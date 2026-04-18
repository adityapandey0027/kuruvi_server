import Coupon from "../models/couponModel.js";
import { errorHandler } from "../utilities/errorHandler.utils.js";
import { asyncHandler } from "../utilities/asyncHandler.utils.js";
import Order from "../models/orderModel.js";
import mongoose from "mongoose";
import Inventory from "../models/inventoryModel.js";
export const getAllCouponsByAdmin = asyncHandler(async (req, res, next) => {
    const coupons = await Coupon.find().sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: coupons.length,
        data: coupons
    });
});

export const createCoupon = asyncHandler(async (req, res, next) => {
    const {
        code, name, description, discountType, discountValue,
        maxDiscount, minOrderAmount, validFrom, validTill,
        usageLimit, perUserLimit, userType
    } = req.body;

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
        return next(new errorHandler("Coupon code already exists", 400));
    }

    const coupon = await Coupon.create({
        code,
        name,
        description,
        discountType,
        discountValue,
        maxDiscount: maxDiscount || null,
        minOrderAmount: minOrderAmount || 0,
        validFrom,
        validTill,
        usageLimit: usageLimit || null,
        perUserLimit: perUserLimit || 1,
        userType
    });

    res.status(201).json({
        success: true,
        message: "Coupon created successfully",
        data: coupon
    });
});

export const updateCoupon = asyncHandler(async (req, res, next) => {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
        return next(new errorHandler("Coupon not found", 404));
    }

    // Prevent updating code to an existing code of another coupon
    if (req.body.code && req.body.code.toUpperCase() !== coupon.code) {
        const duplicate = await Coupon.findOne({ code: req.body.code.toUpperCase() });
        if (duplicate) return next(new errorHandler("New code is already taken", 400));
    }

    const updatedCoupon = await Coupon.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        message: "Coupon updated successfully",
        data: updatedCoupon
    });
});

export const deleteCoupon = asyncHandler(async (req, res, next) => {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
        return next(new errorHandler("Coupon not found", 404));
    }

    await coupon.deleteOne();

    res.status(200).json({
        success: true,
        message: "Coupon deleted successfully"
    });
});

export const toggleCouponStatus = asyncHandler(async (req, res, next) => {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
        return next(new errorHandler("Coupon not found", 404));
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.status(200).json({
        success: true,
        message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'}`,
        data: coupon
    });
});

export const validateCoupon = asyncHandler(async (req, res, next) => {
    const { code, orderAmount, userId } = req.body;

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) {
        return next(new errorHandler("Invalid or expired coupon", 404));
    }

    // 1. Date Validation
    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validTill) {
        return next(new errorHandler("Coupon is not valid at this time", 400));
    }

    // 2. Minimum Order Amount Validation
    if (orderAmount < coupon.minOrderAmount) {
        return next(new errorHandler(`Minimum order amount of ₹${coupon.minOrderAmount} required`, 400));
    }

    // 3. Total Usage Limit Validation
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return next(new errorHandler("Coupon usage limit reached", 400));
    }


    res.status(200).json({
        success: true,
        message: "Coupon applied successfully",
        data: {
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            maxDiscount: coupon.maxDiscount
        }
    });
});


export const getValidCouponViaUser = asyncHandler(async (req, res, next) => {

    const userId = req.user?._id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return next(new errorHandler("Invalid userId", 400));
    }

    const now = new Date();

    const coupons = await Coupon.find({
        isActive: true,
        validFrom: { $lte: now },
        validTill: { $gte: now }
    }).lean();

    const validCoupons = [];

    const orderCount = await Order.countDocuments({ userId });

    for (const coupon of coupons) {

        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) continue;

        if (coupon.userType === "NEW" && orderCount > 0) continue;
        if (coupon.userType === "EXISTING" && orderCount === 0) continue;

        if (coupon.userIds?.length > 0) {
            const allowed = coupon.userIds.some(
                id => id.toString() === userId.toString()
            );
            if (!allowed) continue;
        }

        validCoupons.push({
            couponId: coupon._id,
            code: coupon.code,
            name: coupon.name,
            description: coupon.description,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            maxDiscount: coupon.maxDiscount,
            minOrderAmount: coupon.minOrderAmount,
            validTill: coupon.validTill
        });
    }

    res.status(200).json({
        success: true,
        count: validCoupons.length,
        data: validCoupons
    });
});



export const applyCoupon = asyncHandler(async (req, res, next) => {


    const { items, couponCode, deliveryFee = 0 } = req.body;
    const userId = req.user._id;

    if (!items || items.length === 0) {
        return next(new errorHandler("Items required", 400));
    }

    if (!couponCode) {
        return next(new errorHandler("Coupon code required", 400));
    }

    // 🔹 STEP 1: CALCULATE ITEM TOTAL
    let itemTotal = 0;

    for (const item of items) {
        const inventory = await Inventory.findOne({
            variantId: item.variantId,
            isAvailable: true
        });

        if (!inventory) {
            return next(new errorHandler("Product not available", 400));
        }

        if (inventory.stock < item.quantity) {
            return next(new errorHandler("Insufficient stock", 400));
        }

        itemTotal += inventory.price * item.quantity;
    }

    const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase()
    });

    if (!coupon || !coupon.isActive) {
        return next(new errorHandler("Invalid coupon", 400));
    }

    const now = new Date();

    if (now < coupon.validFrom || now > coupon.validTill) {
        return next(new errorHandler("Coupon expired or not active", 400));
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return next(new errorHandler("Coupon usage limit reached", 400));
    }

    if (itemTotal < coupon.minOrderAmount) {
        return next(new errorHandler(`Minimum order ₹${coupon.minOrderAmount} required`, 400));
    }

    // 🔹 STEP 3: USER BASED CHECKS

    const userUsage = await Order.countDocuments({
        userId,
        couponId: coupon._id
    });

    if (userUsage >= coupon.perUserLimit) {
        return next(new errorHandler("Coupon already used", 400));
    }

    const totalOrders = await Order.countDocuments({ userId });

    if (coupon.userType === "NEW" && totalOrders > 0) {
        return next(new errorHandler("Only for new users", 400));
    }

    if (coupon.userType === "EXISTING" && totalOrders === 0) {
        return next(new errorHandler("Only for existing users", 400));
    }

    // 🔹 STEP 4: CALCULATE DISCOUNT

    let discount = 0;

    if (coupon.discountType === "PERCENTAGE") {
        discount = (itemTotal * coupon.discountValue) / 100;

        if (coupon.maxDiscount) {
            discount = Math.min(discount, coupon.maxDiscount);
        }

    } else {
        discount = coupon.discountValue;
    }

    discount = Math.min(discount, itemTotal);

    // 🔹 STEP 5: FINAL TOTAL
    const totalAmount = itemTotal + deliveryFee - discount;

    res.status(200).json({
        success: true,
        data: {
            couponId: coupon._id,
            code: coupon.code,
            discount,
            itemTotal,
            deliveryFee,
            totalAmount,
            savings: discount
        }
    });

});

