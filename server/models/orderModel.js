import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
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
    address: {
        type: Object,
        required: true
    },
    
    items: [{
        variantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Variant",
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: { 
            type: Number,
            required: true
        }
    }],

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
    }
}, {
    timestamps: true
});

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ storeId: 1, status: 1 }); 

const Order = mongoose.model("Order", orderSchema);

export default Order;