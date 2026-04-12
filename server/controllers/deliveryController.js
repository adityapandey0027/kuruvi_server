import { errorHandler } from "../utilities/errorHandler.utils.js";
import { asyncHandler } from "../utilities/asyncHandler.utils.js";
import DeliveryConfig from "../models/deliveryConfig.js";

// @route   GET /api/delivery/config
export const getDeliveryConfig = asyncHandler(async (req, res, next) => {
    let config = await DeliveryConfig.findOne({ isActive: true });

    if (!config) {
        config = {
            type: "ORDER_VALUE",
            baseFee: 0,
            freeDeliveryAbove: 0,
            orderValueRules: [],
            distanceRules: [],
            isActive: true
        };
    }

    res.status(200).json({
        success: true,
        data: config
    });
});

// @route   POST /api/delivery/config
export const saveDeliveryConfig = asyncHandler(async (req, res, next) => {
    const { type, baseFee, freeDeliveryAbove, orderValueRules, distanceRules } = req.body;

    const config = await DeliveryConfig.findOneAndUpdate(
        {},
        {
            type,
            baseFee,
            freeDeliveryAbove,
            orderValueRules,
            distanceRules,
            isActive: true
        },
        { 
            new: true, 
            upsert: true, 
            runValidators: true 
        }
    );

    res.status(200).json({
        success: true,
        message: "Logistics updated successfully",
        data: config
    });
});

// @route   POST /api/delivery/calculate
export const calculateDeliveryFee = asyncHandler(async (req, res, next) => {
    const { orderAmount, distanceKm } = req.body;

    const config = await DeliveryConfig.findOne({ isActive: true });

    if (!config) {
        return res.status(200).json({ success: true, fee: 0 });
    }

    if (config.freeDeliveryAbove > 0 && orderAmount >= config.freeDeliveryAbove) {
        return res.status(200).json({ success: true, fee: 0, reason: "FREE_THRESHOLD" });
    }

    let finalFee = config.baseFee;

    if (config.type === "ORDER_VALUE") {
        const rule = config.orderValueRules.find(r => 
            orderAmount >= r.minAmount && orderAmount <= r.maxAmount
        );
        if (rule) finalFee = rule.fee;
    } 
    else if (config.type === "DISTANCE") {
        const rule = config.distanceRules.find(r => 
            distanceKm >= r.minKm && distanceKm <= r.maxKm
        );
        if (rule) finalFee = rule.fee;
    }

    res.status(200).json({
        success: true,
        fee: finalFee
    });
});