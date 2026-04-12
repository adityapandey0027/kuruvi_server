import { errorHandler } from "../utilities/errorHandler.utils.js";
import { asyncHandler } from "../utilities/asyncHandler.utils.js";
import ContactConfig from "../models/contactModel.js";

export const saveContactConfig = asyncHandler(async (req, res, next) => {
    const allowedFields = [
        "email",
        "phone",
        "whatsapp",
        "workingHours", 
        "address",
        "description"   
    ];

    const updateData = {};

    for (const key of allowedFields) {
        if (req.body[key] !== undefined) {
            updateData[key] = req.body[key];
        }
    }

    if (Object.keys(updateData).length === 0) {
        return next(new errorHandler("No valid fields provided", 400));
    }

    const config = await ContactConfig.findOneAndUpdate(
        {},
        { $set: updateData },
        {
            new: true,
            upsert: true,
            runValidators: true 
        }
    );

    res.status(200).json({
        success: true,
        message: "Support info updated",
        data: config
    });
});

export const getContactConfig = asyncHandler(async (req, res) => {
    const config = await ContactConfig.findOne({ isActive: true });

    res.status(200).json({
        success: true,
        data: config
    });
});
