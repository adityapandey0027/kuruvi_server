import Order from "../models/orderModel.js";
import UserAddress from "../models/userAddressModel.js";
import User from "../models/userModel.js";
import { asyncHandler } from "../utilities/asyncHandler.utils.js";
import { errorHandler } from "../utilities/errorHandler.utils.js";
import uploadToS3, { deleteFromS3 } from "../services/s3Services.js";
import WalletModel from "../models/WalletModel.js";
import walletTransactionMdel from "../models/walletTransactionMdel.js";
import crypto from "crypto";
import { razorpay } from "../config/razorpay.js";
import WalletRecharge from "../models/WalletRechargeModel.js";
import { creditWallet, debitWallet } from "../services/walletService.js";

export const getUserProfile = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;

    const user = await User.findById(userId).select("-password").lean();

    if (!user) {
        return next(new errorHandler("User not found", 404));
    }

    res.status(200).json({
        success: true,
        data: user
    });
});

export const updateUserProfile = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);
    console.log("HEADERS:", req.headers["content-type"]);

    const { name, email } = req.body;
    console.log(name)
    const user = await User.findById(userId);

    if (!user) {
        return next(new errorHandler("User not found", 404));
    }

    if (email) {
        const existingUser = await User.findOne({ email });

        if (existingUser && existingUser._id.toString() !== userId.toString()) {
            return next(new errorHandler("Email already in use", 400));
        }
    }

    let image = null;

    if (req.file) {
        if (user?.image?.key) {
            await deleteFromS3(user.image.key);
        }

        image = await uploadToS3(req.file, "profile");
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (image) user.image = image;

    await user.save();

    res.status(200).json({
        success: true,
        user
    });
});

export const deleteUserProfile = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;

    const user = await User.findById(userId);

    if (!user) {
        return next(new errorHandler("User not found", 404));
    }

    if (user?.image?.key) {
        await deleteFromS3(user.image.key);
    }

    await user.deleteOne();

    res.status(200).json({
        success: true,
        message: "User profile deleted successfully"
    });
});

export const getAllCustomers = asyncHandler(async (req, res, next) => {
    let { page = 1, limit = 10, q = "" } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    // 🔍 Build search filter
    const filter = {
        role: "user"
    };

    if (q) {
        filter.$or = [
            { name: { $regex: q, $options: "i" } },
            { email: { $regex: q, $options: "i" } },
            { phone: { $regex: q, $options: "i" } }
        ];
    }

    // ⚡ Query
    const customers = await User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    // 📊 Total count
    const total = await User.countDocuments(filter);

    res.status(200).json({
        success: true,
        data: customers,
        pagination: {
            total,
            page,
            pages: Math.ceil(total / limit),
            limit
        }
    });
});

export const getCustomerDetails = asyncHandler(async (req, res, next) => {
    const customerId = req.params.id;
    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    // Customer
    const customer = await User.findById(customerId)
        .select("-password")
        .lean();

    if (!customer) {
        return next(new errorHandler("Customer not found", 404));
    }

    // (paginated)
    const orders = await Order.find({ userId: customer._id })
        .select("orderId status totalAmount createdAt storeId")
        .populate("storeId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const totalOrders = await Order.countDocuments({ userId: customer._id });

    // 📊 Stats (very useful for dashboard)
    const statsAgg = await Order.aggregate([
        { $match: { userId: customer._id } },
        {
            $group: {
                _id: null,
                totalSpent: { $sum: "$totalAmount" },
                totalOrders: { $sum: 1 }
            }
        }
    ]);

    const stats = statsAgg[0] || { totalSpent: 0, totalOrders: 0 };

    res.status(200).json({
        success: true,
        data: {
            ...customer,
            stats: {
                totalOrders: stats.totalOrders,
                totalSpent: stats.totalSpent
            },
            orders,
            pagination: {
                total: totalOrders,
                page,
                pages: Math.ceil(totalOrders / limit),
                limit
            }
        }
    });
});

export const getUserAddress = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;

    const addresses = await UserAddress.find({ userId });

    res.status(200).json({
        success: true,
        addresses
    });
});

export const createUserAddress = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;

    const {
        addressLine,
        label,
        city,
        pincode,
        receiverPhone,
        coordinates,
        isDefault = false
    } = req.body;

    if (!addressLine || !label) {
        return next(new errorHandler("Address invalid", 400));
    }

    if (isDefault) {
        await UserAddress.updateMany({ userId }, { isDefault: false });
    }

    const newAddress = {
        userId,
        addressLine,
        label,
        city,
        pincode,
        receiverPhone,
        isDefault
    };

    if (coordinates && coordinates.length === 2) {
        newAddress.location = {
            type: "Point",
            coordinates
        };
    }

    const address = await UserAddress.create(newAddress);

    res.status(201).json({
        success: true,
        address
    });
});

export const updateUserAddress = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const addressId = req.params.id;

    const address = await UserAddress.findOne({
        _id: addressId,
        userId
    });

    if (!address) {
        return next(new errorHandler("Address not found", 404));
    }

    const {
        addressLine,
        label,
        city,
        pincode,
        receiverPhone,
        coordinates,
        isDefault
    } = req.body;

    if (addressLine !== undefined) address.addressLine = addressLine;
    if (label !== undefined) address.label = label;
    if (city !== undefined) address.city = city;
    if (pincode !== undefined) address.pincode = pincode;
    if (receiverPhone !== undefined) address.receiverPhone = receiverPhone;

    if (coordinates && coordinates.length === 2) {
        address.location = {
            type: "Point",
            coordinates
        };
    }

    if (isDefault === true) {
        await UserAddress.updateMany({ userId }, { isDefault: false });
        address.isDefault = true;
    }

    await address.save();

    res.status(200).json({
        success: true,
        address
    });
});


export const deleteUserAddress = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const addressId = req.params.id;

    const address = await UserAddress.findOneAndDelete({
        _id: addressId,
        userId
    });

    if (!address) {
        return next(new errorHandler("Address not found", 404));
    }

    res.status(200).json({
        success: true,
        message: "Address deleted successfully"
    });
});


export const getWallet = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;

    let wallet = await WalletModel.findOne({ userId });

    if (!wallet) {
        wallet = await WalletModel.create({ userId, balance: 0 });
    }

    res.status(200).json({
        success: true,
        balance: wallet.balance
    });
});


export const getWalletTransactions = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const transactions = await walletTransactionMdel.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50);

    res.status(200).json({
        success: true,
        data: transactions
    });
});

export const createWalletRechargeOrder = asyncHandler(async (req, res, next) => {
    const { amount } = req.body;
    const userId = req.user._id;

    if (!amount || isNaN(amount) || amount < 10) {
        return next(new errorHandler("Minimum recharge ₹10", 400));
    }

    const amountInPaise = Math.round(Number(amount) * 100);

    try {
        const existing = await WalletRecharge.findOne({
            userId,
            status: "PENDING",
            createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // last 5 min
        });

        if (existing) {
            return res.status(200).json({
                success: true,
                message: "Recharge already initiated",
                order: {
                    id: existing.razorpayOrderId,
                    amount: existing.amount * 100,
                    currency: "INR"
                }
            });
        }

        const razorpayOrder = await razorpay.orders.create({
            amount: amountInPaise,
            currency: "INR",
            receipt: `wallet_${Date.now()}`,
            notes: {
                type: "WALLET_RECHARGE",
                userId: userId.toString()
            }
        });

        await WalletRecharge.create({
            userId,
            razorpayOrderId: razorpayOrder.id,
            amount: Number(amount),
            status: "PENDING"
        });

        res.status(200).json({
            success: true,
            message: "Wallet recharge order created",
            order: {
                id: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency
            }
        });

    } catch (err) {
        console.error("Wallet Razorpay Error:", err);

        return next(new errorHandler("Failed to create wallet order", 500));
    }
});


export const verifyWalletRecharge = asyncHandler(async (req, res, next) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const userId = req.user._id;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return next(new errorHandler("Missing payment details", 400));
    }

    const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

    if (generatedSignature !== razorpaySignature) {
        return next(new errorHandler("Invalid payment signature", 400));
    }

    const recharge = await WalletRecharge.findOne({
        razorpayOrderId,
        userId
    });

    if (!recharge) {
        return next(new errorHandler("Recharge record not found", 404));
    }

    if (recharge.status === "SUCCESS") {
        return res.status(200).json({
            success: true,
            message: "Already processed"
        });
    }

    await creditWallet(
        userId,
        recharge.amount,
        "WALLET_RECHARGE",
        null
    );

    recharge.status = "SUCCESS";
    recharge.razorpayPaymentId = razorpayPaymentId;
    recharge.razorpaySignature = razorpaySignature;

    await recharge.save();


    res.status(200).json({
        success: true,
        message: "Wallet recharged successfully",
        amount: recharge.amount
    });
});