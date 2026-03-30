import Order from "../models/orderModel.js";
import User from "../models/userModel.js";
import { asyncHandler } from "../utilities/asyncHandler.utils.js";
import { errorHandler } from "../utilities/errorHandler.utils.js";

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
    const { name, email } = req.body;

    const user = await User.findById(userId);

    if (!user) {
        return next(new errorHandler("User not found", 404));
    }

    user.name = name || user.name;
    user.email = email || user.email;

    await user.save();

    res.status(200).json({
        success: true,
        data: {
            _id: user._id,
            name: user.name,
            email: user.email
        }
    });
});

export const deleteUserProfile = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;

    const user = await User.findById(userId);

    if (!user) {
        return next(new errorHandler("User not found", 404));
    }

    await user.remove();

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