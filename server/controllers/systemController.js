import { asyncHandler } from "../utilities/asyncHandler.utils.js";
import { errorHandler } from "../utilities/errorHandler.utils.js";
import Policy from "../models/policyModel.js";

export const getPolicy = asyncHandler(async (req, res) => {
    const { type } = req.params;
    const role  = req.user._id;
    const policy = await Policy.findOne({
        type,
        isActive: true,
        receiver : role
    });

    res.status(200).json({
        success: true,
        data: policy
    });
});


// @desc    Create or Update a Policy
export const savePolicy = asyncHandler(async (req, res, next) => {
    const { type, receiver, title, content } = req.body;

    if (!type || !receiver || !title || !content) {
        return next(new errorHandler("All policy fields are required", 400));
    }

    const policy = await Policy.findOneAndUpdate(
        { type, receiver },
        { 
            title, 
            content, 
            updatedBy: req.user._id,
            isActive: true,
            $inc: { version: 1 } // Auto-increment version
        },
        { 
            new: true, 
            upsert: true, 
            runValidators: true 
        }
    );

    res.status(200).json({
        success: true,
        message: "Policy version pushed successfully",
        data: policy
    });
});

// @desc    Get all policies for Admin List
export const getAllPoliciesAdmin = asyncHandler(async (req, res) => {
    const policies = await Policy.find()
        .populate("updatedBy", "name email")
        .sort({ updatedAt: -1 });

    res.status(200).json({
        success: true,
        count: policies.length,
        data: policies
    });
});

export const getPolicyAdminDetail = asyncHandler(async (req, res, next) => {
    const { type, receiver } = req.params;

    const policy = await Policy.findOne({ type, receiver });

    if (!policy) {
        // We don't return 404 here so the frontend can handle "New Policy" state
        return res.status(200).json({
            success: true,
            data: null,
            message: "No policy found for this criteria"
        });
    }

    res.status(200).json({
        success: true,
        data: policy
    });
});