import Admin from "../models/adminModel.js";
import { errorHandler } from "../utilities/errorHandler.utils.js";
import { asyncHandler } from "../utilities/asyncHandler.utils.js";
import Rider from "../models/riderModel.js";
import Order from "../models/orderModel.js";
import { riderSockets, riderLocations } from "../socketStore.js";
import mongoose from "mongoose";
import { sendSms } from "../utilities/sendSms.utils.js";
import connection from "../config/redis.js";

export const getRiderProfile = asyncHandler(async (req, res, next) => {
    const riderId = req.user._id;

    const rider = await Rider.findById(riderId).select("-password ").lean();

    if (!rider) {
        return next(new errorHandler("Rider not found", 404));
    }

    res.status(200).json({
        success: true,
        data: rider
    });
});

export const updateRiderProfile = asyncHandler(async (req, res, next) => {
    const riderId = req.user._id;
    const { name, email } = req.body;

    const rider = await Rider.findById(riderId);
    if (!rider) {
        return next(new errorHandler("Rider not found", 404));
    }

    rider.name = name || rider.name;
    rider.email = email || rider.email;

    await rider.save();

    res.status(200).json({
        success: true,
        data: {
            _id: rider._id,
            name: rider.name,
            email: rider.email,
            role: rider.role
        }
    });
});

export const deleteRiderProfile = asyncHandler(async (req, res, next) => {
    const riderId = req.user._id;

    const rider = await Rider.findById(riderId);

    if (!rider) {
        return next(new errorHandler("Rider not found", 404));
    }

    await rider.remove();

    res.status(200).json({
        success: true,
        message: "Rider profile deleted successfully"
    });
});

export const getRiderOrders = asyncHandler(async (req, res, next) => {
    const riderId = req.user._id;

    let { page = 1, limit = 10, q } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    // Rider
    const rider = await Rider.findById(riderId)
        .select("-password")
        .lean();

    if (!rider) {
        return next(new errorHandler("Rider not found", 404));
    }

    // Orders assigned to this rider (paginated)
    const filter = { riderId };

    if (q) {
        filter.orderId = { $regex: q, $options: "i" };
    }

    const orders = await Order.find(filter)
        .select("orderId userId status totalAmount createdAt storeId")
        .populate("userId", "name")
        .populate("storeId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const total = await Order.countDocuments(filter);

    const formattedOrders = orders.map(o => ({
        _id: o._id,
        orderId: o.orderId,
        customer: o.userId?.name || "Guest",
        store: o.storeId?.name || "Unknown Store",
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

export const getRiderOrderDetail = asyncHandler(async (req, res, next) => {
    const riderId = req.user._id;

    const order = await Order.findById(req.params.id)
        .populate("userId", "name phone email")
        .populate("storeId", "name city")
        .populate("riderId", "name phone")
        .populate("address", "text lat lng")
        .lean();

    if (!order) {
        return next(new errorHandler("Order not found", 404));
    }

    if (order.riderId?._id.toString() !== riderId.toString()) {
        return next(new errorHandler("Access denied to this order", 403));
    }

    res.status(200).json({
        success: true,
        data: order
    });
});

export const updateRiderOrderStatus = asyncHandler(async (req, res, next) => {
    const riderId = req.user._id;
    const { status } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new errorHandler("Order not found", 404));
    }

    if (order.riderId?._id.toString() !== riderId.toString()) {
        return next(new errorHandler("Access denied to this order", 403));
    }

    order.status = status;
    await order.save();

    res.status(200).json({
        success: true,
        data: order
    });
});

export const getAllRiders = asyncHandler(async (req, res, next) => {
    let {
        page = 1,
        limit = 10,
        q = "",
        status,
        isVerified
    } = req.query;

    page = Number(page);
    limit = Number(limit);

    const skip = (page - 1) * limit;

    let filter = {};
    // const filter = {
    //     isActive: true
    // };

    if (q) {
        filter.$or = [
            { name: { $regex: q, $options: "i" } },
            { phone: { $regex: q, $options: "i" } }
        ];
    }

    if (status) {
        filter.status = status;
    }

    if (typeof isVerified !== "undefined") {
        filter.isVerified = isVerified === "true";
    }

    const riders = await Rider.find(filter)
        .select(`
            name 
            phone 
            isActive
            status 
            vehicleType 
            isVerified 
            activeOrders 
            createdAt
        `)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const total = await Rider.countDocuments(filter);

    res.status(200).json({
        success: true,
        data: riders,
        pagination: {
            total,
            page,
            pages: Math.ceil(total / limit),
            limit
        }
    });
});

export const getRiderDetails = asyncHandler(async (req, res, next) => {
    const { id: riderId } = req.params;
    let { page = 1, limit = 10 } = req.query;

    page = Number(page);
    limit = Number(limit);
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(riderId)) {
        return next(new errorHandler("Invalid rider id", 400));
    }

    const rider = await Rider.findById(riderId).lean();

    if (!rider) {
        return next(new errorHandler("Rider not found", 404));
    }

    // if (rider.bankDetails?.accountNumber) {
    //     rider.bankDetails.accountNumber =
    //         "XXXX" + rider.bankDetails.accountNumber.slice(-4);
    // }

    // if (rider.documents?.aadhaarNumber) {
    //     rider.documents.aadhaarNumber =
    //         "XXXX-XXXX-" + rider.documents.aadhaarNumber.slice(-4);
    // }

    const orders = await Order.find({ riderId })
        .select("orderId status totalAmount deliveryFee createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const totalOrders = await Order.countDocuments({ riderId });

    const statsAgg = await Order.aggregate([
        {
            $match: {
                riderId: new mongoose.Types.ObjectId(riderId),
                status: "DELIVERED"
            }
        },
        {
            $group: {
                _id: null,
                totalDelivered: { $sum: 1 },
                totalEarnings: { $sum: "$deliveryFee" }
            }
        }
    ]);

    const stats = statsAgg[0] || {
        totalDelivered: 0,
        totalEarnings: 0
    };

    res.status(200).json({
        success: true,
        data: {
            rider,
            location: riderLocations.get(riderId.toString()) || null,
            stats,
            orders,
            pagination: {
                total: totalOrders,
                page,
                pages: Math.ceil(totalOrders / limit),
                limit
            }
        }
    });
});

export const getAvailableRidersViaAdmin = asyncHandler(async (req, res, next) => {

    let { page = 1, limit = 10, q = "" } = req.query;

    page = Number(page);
    limit = Number(limit);

    const skip = (page - 1) * limit;

    // 🔍 Filter
    const filter = {
        isActive: true,
        isVerified: true
    };

    // 🔍 Optional search
    if (q) {
        filter.$or = [
            { name: { $regex: q, $options: "i" } },
            { phone: { $regex: q, $options: "i" } }
        ];
    }

    const riders = await Rider.find(filter)
        .select("name phone status vehicleType activeOrders")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const total = await Rider.countDocuments(filter);

    res.status(200).json({
        success: true,
        page,
        limit,
        total,
        count: riders.length,
        data: riders
    });
});

export const getAvailableOrders = asyncHandler(async (req, res, next) => {

    let { page = 1, limit = 10 } = req.query;

    page = Number(page);
    limit = Number(limit);

    const skip = (page - 1) * limit;

    const orders = await Order.find({
        status: { $in: ["CONFIRMED", "PACKING"] },
        riderId: null
    })
        .populate("storeId", "name location")
        .populate("userId", "name")
        .populate("addressId", "addressLine city location receiverPhone pincode")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await Order.countDocuments({
        status: { $in: ["CONFIRMED", "PACKING"] },
        riderId: null
    });

    res.status(200).json({
        success: true,
        page,
        limit,
        total,
        count: orders.length,
        data: orders
    });
});

export const acceptOrder = asyncHandler(async (req, res, next) => {
    const riderId = req.user._id;
    const orderId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return next(new errorHandler("Invalid order id", 400));
    }

    const order = await Order.findOneAndUpdate(
        {
            _id: orderId,
            riderId: null,
            status: { $in: ["CONFIRMED", "PACKING"] }
        },
        {
            riderId,
            acceptedAt: new Date()
        },
        { new: true }
    );

    if (!order) {
        return next(new errorHandler("Order already assigned", 400));
    }

    const io = req.app.get("io");

    io.to(`user_${order.userId}`).emit("order_rider_assigned", {
        orderId: order._id,
        riderId
    });

    io.to(`store_${order.storeId}`).emit("order_assigned", {
        orderId: order._id,
        riderId
    });

    const riderSocketId = riderSockets.get(riderId.toString());
    if (riderSocketId) {
        io.sockets.sockets.get(riderSocketId)?.join(`order_${order._id}`);
    }

    res.status(200).json({
        success: true,
        message: "Order accepted successfully",
        data: order
    });
});

export const pickupOrder = asyncHandler(async (req, res, next) => {
    const riderId = req.user._id;
    const orderId = req.params.id;

    const order = await Order.findOneAndUpdate(
        {
            orderId,
            riderId,
            status: { $in: ["CONFIRMED", "PACKING"] }
        },
        {
            status: "OUT_FOR_DELIVERY",
            pickedAt: new Date()
        },
        { new: true }
    ).populate("addressId");

    if (!order) {
        return next(new errorHandler("Order not found or not assigned", 404));
    }

    const io = req.app.get("io");

    io.to(`user_${order.userId}`).emit("order_status_update", {
        orderId,
        status: "OUT_FOR_DELIVERY"
    });

    res.status(200).json({
        success: true,
        message: "Order picked and out for delivery",
        data: order
    });
});

export const getRiderCurrentOrder = asyncHandler(async (req, res, next) => {
    const riderId = req.user._id;

    const order = await Order.findOne({
        riderId,
        status: "OUT_FOR_DELIVERY"
    })
        .populate("userId", "name phone")
        .populate("addressId", "addressLine city location receiverPhone pincode")
        .populate("storeId", "name address");

    if (!order) {
        return res.status(200).json({
            success: true,
            message: "No active order",
            order: null
        });
    }

    res.status(200).json({
        success: true,
        data: order
    });
});

export const markDeliverOrder = asyncHandler(async (req, res, next) => {
    const riderId = req.user._id;
    const { orderId } = req.body;

    const order = await Order.findOne({ orderId })
        .populate("addressId", "receiverPhone");

    if (!order) {
        return next(new errorHandler("Order not found", 404));
    }

    if (order.riderId.toString() !== riderId.toString()) {
        return next(new errorHandler("Not authorized", 403));
    }

    if (order.status !== "OUT_FOR_DELIVERY") {
        return next(new errorHandler("Order not out for delivery", 400));
    }

    if (order.paymentMethod === "COD" && order.paymentStatus !== "SUCCESS") {
        return next(new errorHandler("Collect payment before delivery", 400));
    }

    const otp = Math.floor(1000 + Math.random() * 9000);


    const otpKey = `delivery_otp:${order._id}`;

    await connection.set(otpKey, otp.toString(), "EX", 300);

    if (process.env.NODE_ENV === "production") {
        await sendSms(order.addressId?.receiverPhone, ` ${otp}`);
    }

    res.status(200).json({
        success: true,
        message: "Delivery OTP sent to customer",
        ...(process.env.NODE_ENV !== "production" && { otp })
    });
});

export const verifyDeliveryOtp = asyncHandler(async (req, res, next) => {
    const riderId = req.user._id;
    const { orderId, otp } = req.body;

    if (!otp) {
        return next(new errorHandler("OTP required", 400));
    }

    const order = await Order.findOne({ orderId });

    if (!order) {
        return next(new errorHandler("Order not found", 404));
    }

    if (order.riderId.toString() !== riderId.toString()) {
        return next(new errorHandler("Not authorized", 403));
    }

    const otpKey = `delivery_otp:${order._id}`;
    const savedOtp = await connection.get(otpKey);

    if (!savedOtp) {
        return next(new errorHandler("OTP expired", 400));
    }

    if (otp.toString() !== savedOtp) {
        return next(new errorHandler("Invalid OTP", 400));
    }

    order.status = "DELIVERED";
    order.deliveredAt = new Date();

    await order.save();

    await connection.del(otpKey);

    const io = req.app.get("io");
    io.to(`user_${order.userId}`).emit("order_status_update", {
        orderId: order._id,
        status: "DELIVERED"
    });

    res.status(200).json({
        success: true,
        message: "Order delivered successfully"
    });
});

export const getAcceptedOrders = asyncHandler(async (req, res, next) => {
    const riderId = req.user._id;

    if (!riderId) {
        return next(new errorHandler("Unauthorized", 401));
    }

    const orders = await Order.find({
        riderId,
        status: {
            $in: ["CONFIRMED", "PACKING",]
        }
    })
        .populate("userId", "name phone")
        .populate("storeId", "name address")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        total: orders.length,
        orders
    });
});

export const codOrderPaymentCollection = asyncHandler(async (req, res, next) => {

    res.status(200).json({
        success: true
    })
})

export const codOrderPaymentVerification = asyncHandler(async (req, res, next) => {

    res.status(200).json({
        success: true
    })
})