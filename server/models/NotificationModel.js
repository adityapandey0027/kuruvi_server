import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },

    receiverType: {
        type: String,
        enum: ["user", "admin", "store", "rider"],
        required: true
    },

    title: {
        type: String,
        required: true
    },

    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: [
            "ORDER",
            "PAYMENT",
            "DELIVERY",
            "PROMOTION",
            "INVENTORY",
            "SYSTEM"
        ],
        default: "SYSTEM"
    },

    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
    },

    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    },

    actionUrl: {
        type: String
    },

    isRead: {
        type: Boolean,
        default: false
    },

    readAt: {
        type: Date
    },

    meta: {
        type: Object
    }

}, { timestamps: true });

notificationSchema.index({ receiverId: 1, receiverType: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;