import Admin from "../models/adminModel.js";
import { errorHandler } from "../utilities/errorHandler.utils.js";
import { asyncHandler } from "../utilities/asyncHandler.utils.js";


export const getAdminProfile = asyncHandler(async (req, res, next) => {
    const adminId = req.user._id;

    const admin = await Admin.findById(adminId).select("-password").lean();

    if (!admin) {
        return next(new errorHandler("Admin not found", 404));
    }

    res.status(200).json({
        success: true,
        data: admin
    });
});

export const updateAdminProfile = asyncHandler(async (req, res, next) => {
    const adminId = req.user._id;
    const { name, email } = req.body;

    const admin = await Admin.findById(adminId);    

    if (!admin) {
        return next(new errorHandler("Admin not found", 404));
    }

    admin.name = name || admin.name;
    admin.email = email || admin.email;

    await admin.save();

    res.status(200).json({
        success: true,
        data: {
            _id: admin._id,
            name: admin.name,
            email: admin.email, 
            role : admin.role
        }
    });
});


