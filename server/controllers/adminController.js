import Admin from "../models/adminModel.js";
import { errorHandler } from "../utilities/errorHandler.utils.js";
import { asyncHandler } from "../utilities/asyncHandler.utils.js";
import mongoose from "mongoose";
import Rider from "../models/riderModel.js";
import Order from "../models/orderModel.js";

export const getAdminProfile = asyncHandler(async (req, res, next) => {
    const adminId = req.user._id;

    const admin = await Admin.findById(adminId).select("-password").lean();

    if (!admin) {
        return next(new errorHandler("Admin not found", 404));
    }

    res.status(200).json({
        success: true,
        data: admin
    });
});

export const updateAdminProfile = asyncHandler(async (req, res, next) => {
    const adminId = req.user._id;
    const { name, email } = req.body;

    const admin = await Admin.findById(adminId);

    if (!admin) {
        return next(new errorHandler("Admin not found", 404));
    }

    admin.name = name || admin.name;
    admin.email = email || admin.email;

    await admin.save();

    res.status(200).json({
        success: true,
        data: {
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role
        }
    });
});

export const updateRiderStatus = asyncHandler(async (req, res, next) => {
    const { id: riderId } = req.params;
    const { isActive, isVerified, status } = req.body;

    // 1. Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(riderId)) {
        return next(new errorHandler("Invalid Rider ID format", 400));
    }

    const updateData = {};

    if (typeof isActive !== "undefined") {
        updateData.isActive = isActive;
    }

    if (typeof isVerified !== "undefined") {
        updateData.isVerified = isVerified;
    }

    if (status) {
        const validStatuses = ["OFFLINE", "ONLINE", "BUSY"];
        if (!validStatuses.includes(status.toUpperCase())) {
            return next(new errorHandler("Invalid status value", 400));
        }
        updateData.status = status.toUpperCase();
    }

    if (Object.keys(updateData).length === 0) {
        return next(new errorHandler("No valid fields provided for update", 400));
    }

    const updatedRider = await Rider.findByIdAndUpdate(
        riderId,
        { $set: updateData },
        {
            new: true,
            runValidators: true
        }
    ).select("name phone isActive isVerified status");

    if (!updatedRider) {
        return next(new errorHandler("Rider record not found", 404));
    }

    // 5. Response
    res.status(200).json({
        success: true,
        message: "Rider status updated",
        data: updatedRider
    });
});

export const assignRiderForOrder = asyncHandler(async (req, res, next) => {
    const { orderId, riderId } = req.body;

    if (!orderId || !riderId) {
        return next(new errorHandler("orderId and riderId are required", 400));
    }

    const order = await Order.findOne({ orderId });

    if (!order) {
        return next(new errorHandler("Order not found", 404));
    }

    // if (order.riderId) {
    //     return next(new errorHandler("Rider already assigned to this order", 400));
    // }

    const rider = await Rider.findById(riderId);
    if (!rider) {
        return next(new errorHandler("Rider not found", 404));
    }

    order.riderId = riderId;

    await order.save();

    res.status(200).json({
        success: true,
        message: "Rider assigned successfully",
        order
    });
});