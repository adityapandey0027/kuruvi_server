import Notification from "../models/NotificationModel.js";
import { asyncHandler } from "../utilities/asyncHandler.utils.js";
import { errorHandler } from "../utilities/errorHandler.utils.js";

import mongoose from "mongoose";

const toObjectId = (id) => {
    if (!id) return null;

    if (id instanceof mongoose.Types.ObjectId) return id;

    if (typeof id === "string" && mongoose.Types.ObjectId.isValid(id)) {
        return new mongoose.Types.ObjectId(id);
    }

    return null; 
};

export const createNotification = async ({
    receiverId,
    receiverType,
    title,
    message,
    type,
    orderId = null,
    meta = {}
}) => {

    const parsedReceiverId = toObjectId(receiverId);

    if (!parsedReceiverId) {
        throw new Error("Invalid receiverId");
    }

    const parsedOrderId = toObjectId(orderId);

    return await Notification.create({
        receiverId: parsedReceiverId,
        receiverType,
        title,
        message,
        type,
        orderId: parsedOrderId, // will be null if invalid
        meta
    });
};

export const getNotifications = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const role  = req?.user?.role;
    const data = await Notification.find({
        receiverId: userId,
        receiverType: role
    })
        .sort({ createdAt: -1 })
        .limit(20);

    res.json({ success: true, data });
});


export const markNotificationRead = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new errorHandler("Invalid notification id", 400));
    }

    const notification = await Notification.findOneAndUpdate(
        {
            _id: id,
            receiverId: userId 
        },
        {
            isRead: true,
            readAt: new Date()
        },
        { new: true }
    );

    if (!notification) {
        return next(new errorHandler("Notification not found", 404));
    }

    res.status(200).json({
        success: true,
        message: "Notification marked as read",
        data: notification
    });
});

export const markAllNotificationsRead = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;

    const result = await Notification.updateMany(
        {
            receiverId: userId,
            isRead: false
        },
        {
            $set: {
                isRead: true,
                readAt: new Date()
            }
        }
    );

    res.status(200).json({
        success: true,
        message: "All notifications marked as read",
        updatedCount: result.modifiedCount
    });
});