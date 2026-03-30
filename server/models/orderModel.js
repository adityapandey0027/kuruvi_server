import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    orderId: {
        type: String,
        unique: true
    },
    paymentOption: {
        type: String,
        enum: ["COD", "ONLINE"]
    },
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
        required: true
    },
    riderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Rider"
    },
    addressId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserAddress",

    },
    itemTotal: {
        type: Number,
        required: true,
        default: 0
    },
    deliveryFee: {
        type: Number,
        default: 0
    },
    handlingFee: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: [
            "PLACED",
            "CONFIRMED",
            "PACKING",
            "OUT_FOR_DELIVERY",
            "DELIVERED",
            "CANCELLED"
        ],
        default: "PLACED"
    },
    paymentStatus: {
        type: String,
        enum: ["PENDING", "SUCCESS"],
        default: "PENDING"
    },
    razorpayOrderId : {
        type : String,
        default : null
    }
}, {
    timestamps: true
});

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ storeId: 1, status: 1 });

const Order = mongoose.model("Order", orderSchema);

export default Order;