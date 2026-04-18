import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },

    name: {
        type: String,
        required: true
    },

    description: String,

    discountType: {
        type: String,
        enum: ["PERCENTAGE", "FLAT"],
        required: true
    },

    discountValue: {
        type: Number,
        required: true
    },

    maxDiscount: {
        type: Number, 
        default: null
    },

    minOrderAmount: {
        type: Number,
        default: 0
    },

    validFrom: {
        type: Date,
        required: true
    },

    validTill: {
        type: Date,
        required: true
    },

    usageLimit: {
        type: Number, 
        default: null
    },

    usedCount: {
        type: Number,
        default: 0
    },

    perUserLimit: {
        type: Number,
        default: 1
    },

    userType: {
        type: String,
        enum: ["ALL", "NEW", "EXISTING"],
        default: "ALL"
    },

    userIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],

    isActive: {
        type: Boolean,
        default: true
    }

}, { timestamps: true });

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;