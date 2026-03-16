import mongoose from "mongoose";

const userAddressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    label: String,

    addressLine: String,

    city: String,

    pincode: String,

    receiverPhone :{
        type : Number
    },

    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point"
        },
        coordinates: [Number]
    },
    isDefault: {
        type: Boolean
    }
},{
    timestamps : true
});

userAddressSchema.index({location : "2dsphere"});
userAddressSchema.index({ userId: 1 }); // Fetch addresses belonging to a user

const UserAddress = mongoose.model("UserAddress", userAddressSchema);

export default UserAddress;