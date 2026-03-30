import Order from "../models/orderModel.js";
import OrderItem from "../models/orderItemModel.js";
import Inventory from "../models/inventoryModel.js";
import { errorHandler } from "../utilities/errorHandler.utils.js";
import { asyncHandler } from "../utilities/asyncHandler.utils.js";
import mongoose from "mongoose";
import Variant from "../models/variantModel.js";
import Razorpay from "razorpay";


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

        // Process each item
        for (const item of items) {
            // 1. Check inventory
            const inventory = await Inventory.findOne({
                storeId,
                variantId: item.variantId
            }).session(session);

            if (!inventory || inventory.stock < item.quantity) {
                throw new Error("Insufficient stock for one or more items");
            }

            const variant = await Variant.findById(item.variantId).session(session);

            if (!variant) {
                throw new Error("Invalid product variant");
            }

            const price = variant.price;

            // 3. Reduce stock
            inventory.stock -= item.quantity;
            await inventory.save({ session });

            // 4. Calculate total
            itemTotal += price * item.quantity;

            // 5. Prepare order items
            orderItemsData.push({
                variantId: item.variantId,
                quantity: item.quantity,
                price
            });
        }

        // 6. Final total calculation
        const totalAmount = itemTotal + deliveryFee;

        // 7. Create Order
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
            paymentStatus: paymentOption === "COD" ? "PENDING" : "PENDING"
        }], { session });

        const newOrder = order[0];

        // 8. Attach orderId to items
        const finalOrderItems = orderItemsData.map(item => ({
            ...item,
            orderId: newOrder._id
        }));

        // 9. Save order items
        await OrderItem.insertMany(finalOrderItems, { session });

        //Commit transaction
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

    const order = await Order.findOne({ orderId });

    if (!order) {
        return next(new errorHandler("Order not found", 404));
    }

    if (order.paymentOption !== "ONLINE") {
        return next(new errorHandler("Payment option is not ONLINE", 400));
    }

    if (order.paymentStatus === "SUCCESS") {
        return next(new errorHandler("Order is already paid", 400));
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
            receipt: order.orderId
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
        return next(new errorHandler("Failed to create Razorpay order", 500));
    }
});

export const updateOrderPaymentStatus = asyncHandler(async (req, res, next) =>{
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const order = await Order.findOne({ razorpayOrderId });

    if (!order) {
        return next(new errorHandler("Order not found", 404));
    }   

    const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(razorpayOrderId + "|" + razorpayPaymentId)
        .digest('hex');

    if (generatedSignature !== razorpaySignature) {
        return next(new errorHandler("Invalid payment signature", 400));
    }

    order.paymentStatus = "SUCCESS";
    await order.save();

    res.status(200).json({
        success: true,
        message: "Payment verified and order updated successfully"
    }); 
})

// @route   GET /api/orders/inhouse
export const getInhouseOrders = asyncHandler(async (req, res, next) => {
    let { page = 1, limit = 10, status, storeId } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    // 🔍 Build filter
    const filter = {};

    if (status) filter.status = status;
    if (storeId) filter.storeId = storeId;

    // ⚡ Query (minimal fields for performance)
    const orders = await Order.find(filter)
        .select("orderId userId status totalAmount createdAt")
        .populate("userId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    // 📊 Total count for pagination
    const total = await Order.countDocuments(filter);

    // 🧾 Format response
    const formattedOrders = orders.map(o => ({
        _id: o._id,
        orderId: o.orderId,
        customer: o.userId?.name || "Guest",
        status: o.status,
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

// @desc    Get detailed view for a single order
export const getOrderDetail = asyncHandler(async (req, res, next) => {
    const order = await Order.findById(req.params.id)
        .populate("userId", "name phone email")
        .populate("storeId", "name city")
        .populate("riderId", "name phone")
        .populate("address", "text lat lng")
        .lean();

    if (!order) {
        return next(new errorHandler("Order not found", 404));
    }

    const items = await OrderItem.find({ orderId: order._id })
        .populate({
            path: "variantId",
            populate: { path: "productId", select: "name" }
        })
        .lean();

    res.status(200).json({
        success: true,
        data: {
            id: order.orderId,
            user_name: order.userId?.name,
            phone: order.userId?.phone,
            email: order.userId?.email,
            created_date: order.createdAt,
            total: order.totalAmount,
            payment_option: order.paymentOption,
            delivery_status: order.status,
            address: order.address?.text || null,
            drop_lat: order.address?.lat || null,
            drop_lng: order.address?.lng || null,
            warehouse_name: order.storeId?.name,
            rider_name: order.riderId?.name || null,
            rider_phone: order.riderId?.phone || null,

            items: items.map(item => {
                const productName = item?.variantId?.productId?.name || "Product";

                return {
                    pname: productName,
                    product_price: item.price,
                    product_quantity: item.quantity,
                    subtotal: item.price * item.quantity,
                    pack_size: item.variantId?.size || "standard"
                };
            })
        }
    });
});