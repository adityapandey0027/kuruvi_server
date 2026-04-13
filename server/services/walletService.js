import Wallet from "../models/WalletModel.js";
import WalletTransaction from "../models/walletTransactionMdel.js";

export const creditWallet = async (userId, amount, reason, orderId = null) => {

    if (amount <= 0) return;

    const wallet = await Wallet.findOneAndUpdate(
        { userId },
        { $inc: { balance: amount } },
        { new: true, upsert: true }
    );

    await WalletTransaction.create({
        userId,
        type: "CREDIT",
        amount,
        balanceAfter: wallet.balance,
        reason,
        orderId
    });

    return wallet;
};

export const debitWallet = async (userId, amount, reason, orderId = null) => {

    if (amount <= 0) return;

    const wallet = await Wallet.findOne({ userId });

    if (!wallet || wallet.balance < amount) {
        throw new Error("Insufficient balance");
    }

    wallet.balance -= amount;
    await wallet.save();

    await WalletTransaction.create({
        userId,
        type: "DEBIT",
        amount,
        balanceAfter: wallet.balance,
        reason,
        orderId
    });

    return wallet;
};