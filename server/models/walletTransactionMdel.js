import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    type: {
        type: String,
        enum: ["CREDIT", "DEBIT"],
        required: true
    },

    amount: {
        type: Number,
        required: true
    },

    balanceAfter: {
        type: Number,
        required: true
    },

    reason: {
        type: String,
        enum: [
            "ORDER_PAYMENT",
            "WALLET_RECHARGE",
            "ORDER_REFUND",
            "CASHBACK",
            "ADMIN_ADJUSTMENT"
        ]
    },

    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        default: null
    }

}, { timestamps: true });

const WalletTransaction = mongoose.model("WalletTransaction", walletTransactionSchema);

export default WalletTransaction;