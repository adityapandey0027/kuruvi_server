import Order from "../models/orderModel.js";
import OrderItem from "../models/orderItemModel.js";
import Inventory from "../models/inventoryModel.js";
import { errorHandler } from "../utilities/errorHandler.utils.js";
import { asyncHandler } from "../utilities/asyncHandler.utils.js";
import mongoose from "mongoose";
import Variant from "../models/variantModel.js";
import Razorpay from "razorpay";
import crypto from "crypto";


const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
}); 

export const createOrder = asyncHandler(async (req, res, next) => {
    const { storeId, items, addressId, deliveryFee = 0, paymentOption } = req.body;
    const userId = req.user._id;

    if (!items || items.length === 0) {
        return next(new errorHandler("Order items are required", 400));
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let itemTotal = 0;
        const orderItemsData = [];

        for (const item of items) {

            // Fetch inventory (single source of truth)
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

            // Get variant (for mrp / info only)
            const variant = await Variant.findById(item.variantId).session(session);

            if (!variant) {
                throw new Error("Invalid product variant");
            }

            // Correct price source
            const price = inventory.price;
            const mrp = variant.mrp || price;

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

        const totalAmount = itemTotal + deliveryFee;

        const orderId = `KUR-${Date.now().toString().slice(-6)}`;

        const order = await Order.create([{
            orderId,
            userId,
            storeId,
            addressId,
            itemTotal,
            deliveryFee,
            totalAmount,
            paymentOption,
            status: "PLACED",
            paymentStatus: "PENDING"
        }], { session });

        const newOrder = order[0];

        const finalOrderItems = orderItemsData.map(item => ({
            ...item,
            orderId: newOrder._id
        }));

        await OrderItem.insertMany(finalOrderItems, { session });

        await session.commitTransaction();
        session.endSession();

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
    const { orderId } = req.params;
    const userId = req.user._id;

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

    const createdAt = new Date(order.createdAt);
    const now = new Date();
    const diffMinutes = (now - createdAt) / (1000 * 60);

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

        res.status(200).json({
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

    if (order.paymentStatus === "SUCCESS") {
        return res.status(200).json({
            success: true,
            message: "Payment already verified"
        });
    }

    const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

    if (generatedSignature !== razorpaySignature) {
        return next(new errorHandler("Invalid payment signature", 400));
    }

    order.paymentStatus = "SUCCESS";
    order.status = "CONFIRMED";

    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;

    await order.save();

    res.status(200).json({
        success: true,
        message: "Payment verified and order confirmed"
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

