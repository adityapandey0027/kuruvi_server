import Order from "../models/orderModel.js";
import OrderItem from "../models/orderItemModel.js";
import Inventory from "../models/inventoryModel.js";
import { errorHandler } from "../utilities/errorHandler.utils.js";
import { asyncHandler } from "../utilities/asyncHandler.utils.js";
import mongoose from "mongoose";
import Variant from "../models/variantModel.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import Store from "../models/storeModel.js";
import { riderSockets, riderLocations } from "../socketStore.js";
import Coupon from "../models/couponModel.js";

export const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const createOrder = asyncHandler(async (req, res, next) => {
    const {
        storeId,
        items,
        addressId,
        couponId,
        deliveryFee = 0,
        paymentOption
    } = req.body;


    const userId = req.user._id;

    if (!items || items.length === 0) {
        return next(new errorHandler("Order items are required", 400));
    }

    const normalizedCouponId =
    couponId && mongoose.Types.ObjectId.isValid(couponId)
        ? couponId
        : null;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let itemTotal = 0;
        let discount = 0;

        const orderItemsData = [];

        // 🔹 STEP 1: VALIDATE + CALCULATE ITEMS
        for (const item of items) {

            const inventory = await Inventory.findOne({
                storeId,
                variantId: item.variantId,
                isAvailable: true
            }).session(session);

            if (!inventory) {
                throw new Error("Product not available");
            }

            if (inventory.stock < item.quantity) {
                throw new Error("Insufficient stock");
            }

            const variant = await Variant.findById(item.variantId).session(session);

            if (!variant) {
                throw new Error("Invalid product variant");
            }

            const price = inventory.price;
            const mrp = variant.mrp || price;

            // 🔥 Deduct stock
            inventory.stock -= item.quantity;
            await inventory.save({ session });

            itemTotal += price * item.quantity;

            orderItemsData.push({
                variantId: item.variantId,
                quantity: item.quantity,
                price,
                mrp
            });
        }

        // 🔹 STEP 2: APPLY COUPON
        if (normalizedCouponId) {
            const coupon = await Coupon.findById(couponId).session(session);

            if (!coupon || !coupon.isActive) {
                throw new Error("Invalid coupon");
            }

            const now = new Date();

            if (now < coupon.validFrom || now > coupon.validTill) {
                throw new Error("Coupon expired or not started");
            }

            if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
                throw new Error("Coupon usage limit reached");
            }

            if (itemTotal < coupon.minOrderAmount) {
                throw new Error(`Minimum order ₹${coupon.minOrderAmount} required`);
            }

            // 👤 Per-user usage
            const userUsage = await Order.countDocuments({
                userId,
                normalizedCouponId
            }).session(session);

            if (userUsage >= coupon.perUserLimit) {
                throw new Error("Coupon already used by user");
            }

            // 👤 USER TYPE
            const totalOrders = await Order.countDocuments({ userId }).session(session);

            if (coupon.userType === "NEW" && totalOrders > 0) {
                throw new Error("Coupon only for new users");
            }

            if (coupon.userType === "EXISTING" && totalOrders === 0) {
                throw new Error("Coupon only for existing users");
            }

            // 💰 CALCULATE DISCOUNT
            if (coupon.discountType === "PERCENTAGE") {
                discount = (itemTotal * coupon.discountValue) / 100;

                if (coupon.maxDiscount) {
                    discount = Math.min(discount, coupon.maxDiscount);
                }

            } else {
                discount = coupon.discountValue;
            }

            discount = Math.min(discount, itemTotal);

            // 🔄 Update usage
            coupon.usedCount += 1;
            await coupon.save({ session });
        }

        const totalAmount = itemTotal + deliveryFee - discount;

        const orderId = `KUR-${Date.now().toString().slice(-6)}`;

        const order = await Order.create([{
            orderId,
            userId,
            storeId,
            addressId,
            couponId : normalizedCouponId,
            itemTotal,
            deliveryFee,
            discount,
            totalAmount,
            paymentOption,
            status: paymentOption === "COD" ? "CONFIRMED" : "PLACED",
            paymentStatus: "PENDING"
        }], { session });

        const newOrder = order[0];

        // 🔹 STEP 5: SAVE ORDER ITEMS
        const finalOrderItems = orderItemsData.map(item => ({
            ...item,
            orderId: newOrder._id
        }));

        await OrderItem.insertMany(finalOrderItems, { session });

        await session.commitTransaction();
        session.endSession();

        // 🔹 STEP 6: SOCKET (ONLY COD)
        if (paymentOption === "COD") {
            const io = req.app.get("io");

            io.to(`store_${storeId}`).emit("new_order", {
                orderId: newOrder._id,
                displayId: newOrder.orderId,
                amount: totalAmount,
                itemsCount: items.length,
                status: newOrder.status,
                paymentType: newOrder.paymentOption,
                createdAt: newOrder.createdAt
            });

            // 🔥 NEAREST RIDERS
            const store = await Store.findById(storeId);
            const [storeLng, storeLat] = store.location.coordinates;

            const MAX_DISTANCE = 5;

            for (const [riderId, socketId] of riderSockets.entries()) {

                const riderLoc = riderLocations.get(riderId);
                if (!riderLoc) continue;

                const distance = getDistance(
                    storeLat,
                    storeLng,
                    riderLoc.lat,
                    riderLoc.lng
                );

                if (distance <= MAX_DISTANCE) {
                    io.to(socketId).emit("new_order", {
                        orderId: newOrder._id,
                        displayId: newOrder.orderId,
                        amount: totalAmount,
                        status: newOrder.status
                    });
                }
            }
        }

        res.status(201).json({
            success: true,
            message: "Order placed successfully",
            order: newOrder
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return next(new errorHandler(error.message, 400));
    }

});


export const createRazorpayOrder = asyncHandler(async (req, res, next) => {
    const { orderId } = req.body;
    const userId = req.user._id;

    if (!orderId) {
        return next(new errorHandler("Order id is required", 400));
    }

    const order = await Order.findOne({ orderId });

    if (!order) {
        return next(new errorHandler("Order not found", 404));
    }

    if (order.userId.toString() !== userId.toString()) {
        return next(new errorHandler("Unauthorized access to order", 403));
    }

    if (["CANCELLED", "DELIVERED"].includes(order.status)) {
        return next(new errorHandler("Cannot create payment for this order", 400));
    }

    if (order.paymentOption !== "ONLINE") {
        return next(new errorHandler("Payment option is not ONLINE", 400));
    }

    if (order.paymentStatus === "SUCCESS") {
        return res.status(200).json({
            success: true,
            message: "Order already paid",
            order: {
                id: order.razorpayOrderId,
                amount: Math.round(order.totalAmount * 100),
                currency: "INR",
                receipt: order.orderId
            }
        });
    }

    const diffMinutes = Math.floor((Date.now() - order.createdAt.getTime()) / 60000);

    if (diffMinutes > 30) {
        return next(new errorHandler("Order payment expired. Please place a new order.", 400));
    }

    if (order.razorpayOrderId) {
        return res.status(200).json({
            success: true,
            message: "Razorpay order already created",
            order: {
                id: order.razorpayOrderId,
                amount: Math.round(order.totalAmount * 100),
                currency: "INR",
                receipt: order.orderId
            }
        });
    }

    const amountInPaise = Math.round(order.totalAmount * 100);

    try {
        const razorpayOrder = await razorpay.orders.create({
            amount: amountInPaise,
            currency: "INR",
            receipt: order.orderId,
            notes: {
                internalOrderId: order._id.toString(),
                userId: userId.toString()
            }
        });

        order.razorpayOrderId = razorpayOrder.id;
        await order.save();

        return res.status(200).json({
            success: true,
            message: "Razorpay order created successfully",
            order: {
                id: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                receipt: razorpayOrder.receipt
            }
        });

    } catch (error) {
        console.error("Razorpay Error:", error);
        return next(new errorHandler("Failed to create Razorpay order", 500));
    }
});

export const updateOrderPaymentStatus = asyncHandler(async (req, res, next) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return next(new errorHandler("Missing payment details", 400));
    }

    const order = await Order.findOne({ razorpayOrderId });

    if (!order) {
        return next(new errorHandler("Order not found", 404));
    }

    // 🔁 Idempotency
    if (order.paymentStatus === "SUCCESS") {
        return res.status(200).json({
            success: true,
            message: "Payment already verified"
        });
    }

    // 🔐 Signature verify
    const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

    if (generatedSignature !== razorpaySignature) {
        return next(new errorHandler("Invalid payment signature", 400));
    }

    // ✅ Update order
    order.paymentStatus = "SUCCESS";
    order.status = "CONFIRMED";
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;

    await order.save();

    const io = req.app.get("io");

    io.to(`store_${order.storeId}`).emit("new_order", {
        orderId: order._id,
        displayId: order.orderId,
        amount: order.totalAmount,
        status: order.status,
        paymentType: order.paymentOption,
        createdAt: order.createdAt
    });

    const store = await Store.findById(order.storeId);

    if (store?.location?.coordinates) {
        const [storeLng, storeLat] = store.location.coordinates;

        const MAX_DISTANCE = 5; // km

        for (const [riderId, socketId] of riderSockets.entries()) {
            const riderLoc = riderLocations.get(riderId);
            if (!riderLoc) continue;

            const distance = getDistance(
                storeLat,
                storeLng,
                riderLoc.lat,
                riderLoc.lng
            );

            if (distance <= MAX_DISTANCE) {
                io.to(socketId).emit("new_order", {
                    orderId: order._id,
                    displayId: order.orderId,
                    amount: order.totalAmount,
                    status: order.status
                });
            }
        }
    }

    res.status(200).json({
        success: true,
        message: "Payment verified and order confirmed"
    });
});

export const updateOrderStatus = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const role = req.user.role;
    const { status } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new errorHandler("Order not found", 404));
    }

    if (role === "store") {
        if (!["CONFIRMED", "PACKING"].includes(status)) {
            return next(new errorHandler("Invalid status for store", 400));
        }
    }

    if (role === "rider") {
        if (!["OUT_FOR_DELIVERY", "DELIVERED"].includes(status)) {
            return next(new errorHandler("Invalid status for rider", 400));
        }

        if (order.riderId?.toString() !== userId.toString()) {
            return next(new errorHandler("Not your order", 403));
        }
    }

    order.status = status;
    await order.save();

    const io = req.app.get("io");

    io.to(`order_${order._id}`).emit("order_status_update", {
        orderId: order._id,
        status: order.status,
        updatedAt: new Date()
    });

    res.status(200).json({
        success: true,
        message: "Order status updated",
        data: order
    });
});




// @route   GET /api/orders/inhouse
export const getInhouseOrders = asyncHandler(async (req, res, next) => {
    let {
        page = 1,
        limit = 10,
        status,
        storeId,
        search,
        startDate,
        endDate,
        sort = "latest"
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    const filter = {};

    // Status filter
    if (status) filter.status = status;

    // Store filter
    if (storeId) {
        filter.storeId = new mongoose.Types.ObjectId(storeId);
    }

    // Date filter
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Search (orderId)
    if (search) {
        filter.orderId = { $regex: search, $options: "i" };
    }

    // Sorting
    let sortOption = { createdAt: -1 }; // default latest
    if (sort === "oldest") sortOption = { createdAt: 1 };
    if (sort === "amount_desc") sortOption = { totalAmount: -1 };
    if (sort === "amount_asc") sortOption = { totalAmount: 1 };

    const orders = await Order.find(filter)
        .select("orderId userId status totalAmount createdAt paymentStatus")
        .populate("userId", "name phone")
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean();

    const total = await Order.countDocuments(filter);

    const formattedOrders = orders.map(o => ({
        _id: o._id,
        orderId: o.orderId,
        customer: o.userId?.name || "Guest",
        phone: o.userId?.phone || null,
        status: o.status,
        paymentStatus: o.paymentStatus,
        amount: o.totalAmount,
        date: o.createdAt
    }));

    res.status(200).json({
        success: true,
        data: formattedOrders,
        pagination: {
            total,
            page,
            pages: Math.ceil(total / limit),
            limit
        }
    });
});

// @desc   
export const getOrderDetail = asyncHandler(async (req, res, next) => {
    const order = await Order.findById(req.params.id)
        .populate("userId", "name phone email")
        .populate("storeId", "name city")
        .populate("riderId", "name phone")
        .populate("addressId", "text lat lng")
        .lean();

    if (!order) {
        return next(new errorHandler("Order not found", 404));
    }

    const items = await OrderItem.find({ orderId: order._id })
        .populate({
            path: "variantId",
            populate: { path: "productId", select: "name brand" }
        })
        .lean();

    let totalItems = 0;

    const formattedItems = items.map(item => {
        const product = item?.variantId?.productId;
        const variant = item?.variantId;

        const quantity = item.quantity;
        const price = item.price;

        totalItems += quantity;

        return {
            variantId: item.variantId?._id || null,
            name: product?.name || "Product",
            brand: product?.brand || "",
            price,
            mrp: item.mrp || price,
            quantity,
            subtotal: price * quantity,
            size: variant?.size || "standard",
            unit: variant?.unit || "",
            image: variant?.images?.[0]?.url || null,

            // 🔥 Safety
            isAvailable: !!variant
        };
    });

    res.status(200).json({
        success: true,
        data: {
            orderId: order.orderId,
            createdAt: order.createdAt,

            customer: {
                name: order.userId?.name,
                phone: order.userId?.phone,
                email: order.userId?.email
            },

            store: {
                name: order.storeId?.name,
                city: order.storeId?.city
            },

            rider: {
                name: order.riderId?.name || null,
                phone: order.riderId?.phone || null
            },

            address: {
                text: order.addressId?.text || null,
                lat: order.addressId?.lat || null,
                lng: order.addressId?.lng || null
            },

            pricing: {
                itemTotal: order.itemTotal,
                deliveryFee: order.deliveryFee,
                discount: order.discount || 0,
                totalAmount: order.totalAmount
            },

            status: {
                orderStatus: order.status,
                paymentStatus: order.paymentStatus,
                paymentOption: order.paymentOption
            },

            summary: {
                totalItems
            },

            items: formattedItems
        }
    });
});


export const getUserAllOrders = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;

    let {
        page = 1,
        limit = 10,
        status,
        fromDate,
        toDate
    } = req.query;

    page = Number(page);
    limit = Number(limit);
    const skip = (page - 1) * limit;

    const filter = { userId };

    if (status) filter.status = status;

    if (fromDate || toDate) {
        filter.createdAt = {};
        if (fromDate) filter.createdAt.$gte = new Date(fromDate);
        if (toDate) filter.createdAt.$lte = new Date(toDate);
    }

    const orders = await Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("orderId totalAmount status paymentOption createdAt storeId")
        .populate("storeId", "name")
        .lean();

    const orderIds = orders.map(o => o._id);

    const items = await OrderItem.find({ orderId: { $in: orderIds } })
        .populate({
            path: "variantId",
            populate: {
                path: "productId",
                select: "name brand"
            }
        })
        .lean();

    const itemMap = {};
    items.forEach(item => {
        const key = item.orderId.toString();
        if (!itemMap[key]) itemMap[key] = [];

        itemMap[key].push({
            variantId: item.variantId?._id,
            productId: item.variantId?.productId?._id,
            name: item.variantId?.productId?.name,
            brand: item.variantId?.productId?.brand,
            size: item.variantId?.size,
            unit: item.variantId?.unit,
            price: item.price,
            quantity: item.quantity,
            image: item.variantId?.images?.[0]?.url
        });
    });

    const formatted = orders.map(order => ({
        id: order._id,
        orderId: order.orderId,
        storeName: order.storeId?.name || "Store",
        amount: order.totalAmount,
        status: order.status,
        paymentType: order.paymentOption,
        date: order.createdAt,
        items: itemMap[order._id.toString()] || []
    }));

    const total = await Order.countDocuments(filter);

    res.status(200).json({
        success: true,
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        count: formatted.length,
        data: formatted
    });
});

// export const generateRazorpaySignature = ({
//   razorpayOrderId,
//   razorpayPaymentId,
//   secret
// }) => {
//   return crypto
//     .createHmac("sha256", secret)
//     .update(`${razorpayOrderId}|${razorpayPaymentId}`)
//     .digest("hex");
// };


// const signature = generateRazorpaySignature({
//   razorpayOrderId: "order_ScK7s2pi7OR6s2",
//   razorpayPaymentId: "KUR-598949",
//   secret: process.env.RAZORPAY_KEY_SECRET
// });


// console.log(signature);