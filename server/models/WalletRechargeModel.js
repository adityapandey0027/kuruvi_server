import mongoose from "mongoose";

const walletRechargeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    razorpayOrderId: {
        type: String,
        required: true
    },

    amount: {
        type: Number,
        required: true
    },

    status: {
        type: String,
        enum: ["PENDING", "SUCCESS"],
        default: "PENDING"
    }

}, { timestamps: true });

 const WalletRecharge = mongoose.model("WalletRecharge", walletRechargeSchema);

 export default WalletRecharge;