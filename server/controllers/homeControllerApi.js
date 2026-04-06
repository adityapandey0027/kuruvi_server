import { errorHandler } from "../utilities/errorHandler.utils.js";
import { asyncHandler } from "../utilities/asyncHandler.utils.js";

import Order from "../models/orderModel.js";
import OrderItem from "../models/orderItemModel.js";
import Product from "../models/productModel.js";
import mongoose from "mongoose";
import Inventory from "../models/inventoryModel.js";
import Variant from "../models/variantModel.js";




export const getMostShoppedProducts = asyncHandler(async (req, res, next) => {
    const { storeId } = req.params;
    const { limit = 10, days } = req.query;

    const dateFilter = {};
    if (days) {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - Number(days));
        dateFilter.createdAt = { $gte: pastDate };
    }

    const mostShopped = await Order.aggregate([
        {
            $match: {
                storeId: new mongoose.Types.ObjectId(storeId),
                status: { $ne: "CANCELLED" },
                ...dateFilter
            }
        },

        // Order Items
        {
            $lookup: {
                from: "orderitems",
                localField: "_id",
                foreignField: "orderId",
                as: "items"
            }
        },
        { $unwind: "$items" },

        // Variant
        {
            $lookup: {
                from: "variants",
                localField: "items.variantId",
                foreignField: "_id",
                as: "variant"
            }
        },
        { $unwind: "$variant" },

        //Group by product
        {
            $group: {
                _id: "$variant.productId",
                totalSold: { $sum: "$items.quantity" }
            }
        },

        { $sort: { totalSold: -1 } },
        { $limit: Number(limit) },

        //Product
        {
            $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "_id",
                as: "product"
            }
        },
        { $unwind: "$product" },

        // Inventory
        {
            $lookup: {
                from: "inventories",
                let: { productId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            storeId: new mongoose.Types.ObjectId(storeId),
                            isAvailable: true,
                            stock: { $gt: 0 }
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
                        $match: {
                            $expr: {
                                $eq: ["$variant.productId", "$$productId"]
                            }
                        }
                    },

                    { $sort: { price: 1 } },
                    { $limit: 1 }
                ],
                as: "inventory"
            }
        },

        { $unwind: { path: "$inventory", preserveNullAndEmptyArrays: true } },

        {
            $match: {
                "inventory.price": { $ne: null }
            }
        },

        // Final output
        {
            $project: {
                _id: 0,
                productId: "$_id",
                name: "$product.name",
                brand: "$product.brand",
                description: "$product.description",
                totalSold: 1,
                price: "$inventory.price",
                mrp: "$inventory.variant.mrp",
                image: { $arrayElemAt: ["$inventory.variant.images.url", 0] }
            }
        }
    ]);

    res.status(200).json({
        success: true,
        count: mostShopped.length,
        data: mostShopped
    });
});

export const getlowestPricedProducts = asyncHandler(async (req, res, next) => {
    const { storeId } = req.params;
    const {
        limit = 20,
        page = 1,
        categoryId,
        brand,
        minDiscount
    } = req.query;

    const skip = (page - 1) * limit;

    const pipeline = [
        {
            $match: {
                storeId: new mongoose.Types.ObjectId(storeId),
                isAvailable: true,
                stock: { $gt: 0 }
            }
        },

        // 🔗 Variant
        {
            $lookup: {
                from: "variants",
                localField: "variantId",
                foreignField: "_id",
                as: "variant"
            }
        },
        { $unwind: "$variant" },

        // Product
        {
            $lookup: {
                from: "products",
                localField: "variant.productId",
                foreignField: "_id",
                as: "product"
            }
        },
        { $unwind: "$product" }
    ];

    // Category filter
    if (categoryId) {
        pipeline.push({
            $match: {
                "product.categoryId": new mongoose.Types.ObjectId(categoryId)
            }
        });
    }

    // Brand filter
    if (brand) {
        pipeline.push({
            $match: {
                "product.brand": { $regex: brand, $options: "i" }
            }
        });
    }

    // Discount calculation
    pipeline.push({
        $addFields: {
            discountAmount: { $subtract: ["$variant.mrp", "$price"] },
            discountPercentage: {
                $cond: [
                    { $gt: ["$variant.mrp", 0] },
                    {
                        $multiply: [
                            { $divide: [{ $subtract: ["$variant.mrp", "$price"] }, "$variant.mrp"] },
                            100
                        ]
                    },
                    0
                ]
            }
        }
    });

    // Minimum discount filter
    if (minDiscount) {
        pipeline.push({
            $match: {
                discountPercentage: { $gte: Number(minDiscount) }
            }
        });
    }

    // Sort (cheapest + best discount)
    pipeline.push({
        $sort: {
            price: 1,
            discountAmount: -1
        }
    });

    // One variant per product
    pipeline.push(
        {
            $group: {
                _id: "$product._id",
                doc: { $first: "$$ROOT" }
            }
        },
        { $replaceRoot: { newRoot: "$doc" } }
    );

    // Best deal flag
    pipeline.push({
        $addFields: {
            isBestDeal: {
                $gte: ["$discountPercentage", 20]
            }
        }
    });

    // Pagination + total count
    pipeline.push({
        $facet: {
            data: [
                { $skip: Number(skip) },
                { $limit: Number(limit) },
                {
                    $project: {
                        _id: 0,
                        productId: "$product._id",
                        productName: "$product.name",
                        brand: "$product.brand",
                        description: "$product.description",
                        variantSize: "$variant.size",
                        mrp: "$variant.mrp",
                        sellingPrice: "$price",
                        discount: "$discountAmount",
                        savingsPercentage: { $round: ["$discountPercentage", 2] },
                        stock: 1,
                        isBestDeal: 1,
                        image: { $arrayElemAt: ["$variant.images.url", 0] }
                    }
                }
            ],
            totalCount: [{ $count: "total" }]
        }
    });

    const result = await Inventory.aggregate(pipeline);

    const data = result[0].data;
    const total = result[0].totalCount[0]?.total || 0;

    res.status(200).json({
        success: true,
        page: Number(page),
        limit: Number(limit),
        total,
        count: data.length,
        data
    });
});