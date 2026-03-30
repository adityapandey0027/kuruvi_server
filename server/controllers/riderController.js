import Admin from "../models/adminModel.js";
import { errorHandler } from "../utilities/errorHandler.utils.js";
import { asyncHandler } from "../utilities/asyncHandler.utils.js";
import Rider from "../models/riderModel.js";
import Order from "../models/orderModel.js";

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
    let { page = 1, limit = 10, q = "", status } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    // 🔍 Filter
    const filter = {};

    if (q) {
        filter.$or = [
            { name: { $regex: q, $options: "i" } },
            { email: { $regex: q, $options: "i" } },
            { phone: { $regex: q, $options: "i" } }
        ];
    }

    if (status) {
        filter.status = status;
    }
    filter.isActive = true;

    const riders = await Rider.find(filter)
        .select("-password")
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
    const riderId = req.params.id;
    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    // 👤 Rider
    const rider = await Rider.findById(riderId)
        .select("-password")
        .lean();

    if (!rider) {
        return next(new errorHandler("Rider not found", 404));
    }

    // 📦 Orders handled by rider
    const orders = await Order.find({ riderId })
        .select("orderId status totalAmount createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const totalOrders = await Order.countDocuments({ riderId });

    // 📊 Stats
    const statsAgg = await Order.aggregate([
        { $match: { riderId: rider._id } },
        {
            $group: {
                _id: null,
                totalDelivered: {
                    $sum: {
                        $cond: [{ $eq: ["$status", "DELIVERED"] }, 1, 0]
                    }
                },
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
            ...rider,
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