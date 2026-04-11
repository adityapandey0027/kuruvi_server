import mongoose from "mongoose";

const userAddressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    label: {
        type: String,
        required: true,
        enum : ["home", "office", "others"]
    },

    addressLine: {
        type: String,
        required: true
    },

    city: String,

    pincode: String,

    receiverPhone: Number,

    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point"
        },
        coordinates: {
            type: [Number], // [lng, lat]
        }
    },

    isDefault: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: true
});

// Index for geo queries
userAddressSchema.index({ location: "2dsphere" });
userAddressSchema.index({ userId: 1 }); 

export const UserAddress = mongoose.model("UserAddress", userAddressSchema);

export default UserAddress;