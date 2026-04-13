import Notification from "../models/NotificationModel.js";
import { asyncHandler } from "../utilities/asyncHandler.utils.js";
import { errorHandler } from "../utilities/errorHandler.utils.js";

export const createNotification = async ({
    receiverId,
    receiverType,
    title,
    message,
    type,
    orderId
}) => {
    return await Notification.create({
        receiverId,
        receiverType,
        title,
        message,
        type,
        orderId
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