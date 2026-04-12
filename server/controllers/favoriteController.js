import { asyncHandler } from "../utilities/asyncHandler.utils.js";
import { errorHandler } from "../utilities/errorHandler.utils.js";
import connection from "../config/redis.js";
import Favorite from "../models/favoriteModel.js";
import mongoose from "mongoose";


const getCacheKey = (userId, storeId) =>
    `favorites:${userId}:${storeId}`;

const invalidateCache = async (userId, storeId) => {
    const key = getCacheKey(userId, storeId);
    await connection.del(key);
};

const updateCacheAfterRemove = async (userId, storeId, variantId) => {
    const key = getCacheKey(userId, storeId);
    const cached = await connection.get(key);

    if (!cached) return;

    let data = JSON.parse(cached);

    data = data.filter(
        item => item.variantId.toString() !== variantId.toString()
    );

    await connection.set(key, JSON.stringify(data), "EX", 600);
};


export const addFavorite = asyncHandler(async (req, res, next) => {
    const userId = req.user._id.toString();
    const { storeId } = req.params;
    const { variantId } = req.body;

    if (!variantId || !mongoose.Types.ObjectId.isValid(variantId)) {
        return next(new errorHandler("Invalid variantId", 400));
    }

    const exists = await Favorite.findOne({ userId, variantId });

    if (!exists) {
        await Favorite.create({ userId, variantId });
    }

    await invalidateCache(userId, storeId);

    res.status(200).json({
        success: true,
        message: "Added to favorites"
    });
});


export const removeFavorite = asyncHandler(async (req, res, next) => {
    const userId = req.user._id.toString();
    const { variantId, storeId } = req.params;

    if (!variantId || !mongoose.Types.ObjectId.isValid(variantId)) {
        return next(new errorHandler("Invalid variantId", 400));
    }

    await Favorite.findOneAndDelete({ userId, variantId });

    await updateCacheAfterRemove(userId, storeId, variantId);

    res.status(200).json({
        success: true,
        message: "Removed from favorites"
    });
});


export const toggleFavorite = asyncHandler(async (req, res, next) => {
    const userId = req.user._id.toString();
    const { variantId, storeId } = req.params;

    if (!variantId || !mongoose.Types.ObjectId.isValid(variantId)) {
        return next(new errorHandler("Invalid variantId", 400));
    }

    const existing = await Favorite.findOneAndDelete({ userId, variantId });

    let isFavorite;

    if (existing) {
        isFavorite = false;

        await updateCacheAfterRemove(userId, storeId, variantId);
    } else {
        await Favorite.create({ userId, variantId });
        isFavorite = true;

        await invalidateCache(userId, storeId);
    }

    res.status(200).json({
        success: true,
        isFavorite
    });
});


export const getFavorites = asyncHandler(async (req, res, next) => {
    const userId = req.user._id.toString();
    const { storeId } = req.params;

    const cacheKey = getCacheKey(userId, storeId);

    const cached = await connection.get(cacheKey);
    if (cached) {
        return res.json({
            success: true,
            source: "cache",
            data: JSON.parse(cached)
        });
    }

    const favorites = await Favorite.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "variants",
                localField: "variantId",
                foreignField: "_id",
                as: "variant"
            }
        },
        { $unwind: "$variant" },
        {
            $lookup: {
                from: "products",
                localField: "variant.productId",
                foreignField: "_id",
                as: "product"
            }
        },
        { $unwind: "$product" },
        {
            $lookup: {
                from: "inventories",
                let: { variantId: "$variantId" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$variantId", "$$variantId"] },
                                    {
                                        $eq: [
                                            "$storeId",
                                            new mongoose.Types.ObjectId(storeId)
                                        ]
                                    },
                                    { $gt: ["$stock", 0] },
                                    { $eq: ["$isAvailable", true] }
                                ]
                            }
                        }
                    }
                ],
                as: "inventory"
            }
        },
        {
            $unwind: {
                path: "$inventory",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                _id: 0,
                variantId: "$variant._id",
                productId: "$product._id",
                name: "$product.name",
                brand: "$product.brand",
                price: "$inventory.price",
                mrp: "$variant.mrp",
                size: "$variant.size",
                image: { $arrayElemAt: ["$variant.images.url", 0] }
            }
        }
    ]);

    await connection.set(cacheKey, JSON.stringify(favorites), "EX", 600);

    res.status(200).json({
        success: true,
        source: "db",
        data: favorites
    });
});
