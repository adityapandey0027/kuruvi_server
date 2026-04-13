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

    const pipeline = [
        {
            $match: {
                storeId: new mongoose.Types.ObjectId(storeId),
                status: { $ne: "CANCELLED" },
                ...dateFilter
            }
        },

        // 🔗 Order Items
        {
            $lookup: {
                from: "orderitems",
                localField: "_id",
                foreignField: "orderId",
                as: "items"
            }
        },
        { $unwind: "$items" },

        // 🔗 Variant
        {
            $lookup: {
                from: "variants",
                localField: "items.variantId",
                foreignField: "_id",
                as: "variant"
            }
        },
        { $unwind: "$variant" },

        // 🔥 GROUP by product → total sold
        {
            $group: {
                _id: "$variant.productId",
                totalSold: { $sum: "$items.quantity" }
            }
        },

        { $sort: { totalSold: -1 } },
        { $limit: Number(limit) },

        // 🔗 Product
        {
            $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "_id",
                as: "product"
            }
        },
        { $unwind: "$product" },

        {
            $match: {
                "product.isActive": true
            }
        },

        // 🔥 FETCH ALL VARIANTS FROM INVENTORY
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

                    // 💰 Discount calculation
                    {
                        $addFields: {
                            discount: {
                                $subtract: ["$variant.mrp", "$price"]
                            },
                            discountPercentage: {
                                $cond: [
                                    { $gt: ["$variant.mrp", 0] },
                                    {
                                        $multiply: [
                                            {
                                                $divide: [
                                                    { $subtract: ["$variant.mrp", "$price"] },
                                                    "$variant.mrp"
                                                ]
                                            },
                                            100
                                        ]
                                    },
                                    0
                                ]
                            }
                        }
                    }
                ],
                as: "variants"
            }
        },

        { $unwind: { path: "$variants", preserveNullAndEmptyArrays: true } },

        // 🔥 GROUP AGAIN → COLLECT VARIANTS
        {
            $group: {
                _id: "$_id",
                product: { $first: "$product" },
                totalSold: { $first: "$totalSold" },

                variants: {
                    $push: {
                        _id: "$variants.variant._id",
                        sku: "$variants.variant.sku",
                        mrp: "$variants.variant.mrp",
                        size: "$variants.variant.size",
                        unit: "$variants.variant.unit",
                        weight: "$variants.variant.weight",
                        price: "$variants.price",
                        stock: "$variants.stock",
                        discount: "$variants.discount",
                        discountPercentage: {
                            $round: ["$variants.discountPercentage", 2]
                        },
                        image: {
                            $arrayElemAt: ["$variants.variant.images.url", 0]
                        }
                    }
                }
            }
        },

        // 🔥 SORT VARIANTS → CHEAPEST FIRST
        {
            $addFields: {
                variants: {
                    $sortArray: {
                        input: "$variants",
                        sortBy: { price: 1 }
                    }
                }
            }
        },

        // 🔥 FINAL OUTPUT
        {
            $project: {
                _id: 0,
                product: {
                    _id: "$product._id",
                    name: "$product.name",
                    brand: "$product.brand",
                    description: "$product.description"
                },
                totalSold: 1,
                variants: 1
            }
        }
    ];

    const data = await Order.aggregate(pipeline);

    res.status(200).json({
        success: true,
        count: data.length,
        data
    });
});

export const getlowestPricedProducts = asyncHandler(async (req, res, next) => {
    const { storeId } = req.params;

    let {
        limit = 20,
        page = 1,
        categoryId,
        brand,
        minDiscount
    } = req.query;

    page = Number(page);
    limit = Number(limit);
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

        // 🔗 Product
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
            $match: {
                "product.isActive": true
            }
        }
    ];

    // 🔍 Category filter
    if (categoryId) {
        pipeline.push({
            $match: {
                "product.categoryId": new mongoose.Types.ObjectId(categoryId)
            }
        });
    }

    // 🔍 Brand filter
    if (brand) {
        pipeline.push({
            $match: {
                "product.brand": { $regex: brand, $options: "i" }
            }
        });
    }

    // 💰 Discount calculation
    pipeline.push({
        $addFields: {
            discount: { $subtract: ["$variant.mrp", "$price"] },
            discountPercentage: {
                $cond: [
                    { $gt: ["$variant.mrp", 0] },
                    {
                        $multiply: [
                            {
                                $divide: [
                                    { $subtract: ["$variant.mrp", "$price"] },
                                    "$variant.mrp"
                                ]
                            },
                            100
                        ]
                    },
                    0
                ]
            }
        }
    });

    // 🔍 Min discount filter
    if (minDiscount) {
        pipeline.push({
            $match: {
                discountPercentage: { $gte: Number(minDiscount) }
            }
        });
    }

    // 🔥 GROUP → PRODUCT WITH ALL VARIANTS
    pipeline.push({
        $group: {
            _id: "$product._id",

            product: {
                $first: {
                    _id: "$product._id",
                    name: "$product.name",
                    brand: "$product.brand",
                    description: "$product.description"
                }
            },

            variants: {
                $push: {
                    _id: "$variant._id",
                    sku: "$variant.sku",
                    mrp: "$variant.mrp",
                    size: "$variant.size",
                    unit: "$variant.unit",
                    weight: "$variant.weight",
                    price: "$price",
                    stock: "$stock",
                    discount: "$discount",
                    discountPercentage: {
                        $round: ["$discountPercentage", 2]
                    },
                    image: {
                        $arrayElemAt: ["$variant.images.url", 0]
                    }
                }
            }
        }
    });

    // 🔥 SORT VARIANTS → CHEAPEST FIRST
    pipeline.push({
        $addFields: {
            variants: {
                $sortArray: {
                    input: "$variants",
                    sortBy: { price: 1 }
                }
            }
        }
    });

    // 🔥 SORT PRODUCTS (based on cheapest variant)
    pipeline.push({
        $addFields: {
            cheapestPrice: { $arrayElemAt: ["$variants.price", 0] }
        }
    });

    pipeline.push({
        $sort: {
            cheapestPrice: 1
        }
    });

    // 🔥 FINAL OUTPUT
    pipeline.push({
        $project: {
            _id: 0,
            product: 1,
            variants: 1
        }
    });

    // 📦 Pagination
    pipeline.push({
        $facet: {
            data: [
                { $skip: skip },
                { $limit: limit }
            ],
            totalCount: [{ $count: "total" }]
        }
    });

    const result = await Inventory.aggregate(pipeline);

    const data = result[0]?.data || [];
    const total = result[0]?.totalCount[0]?.total || 0;

    res.status(200).json({
        success: true,
        page,
        limit,
        total,
        count: data.length,
        data
    });
});

export const getMaxDiscountProducts = asyncHandler(async (req, res, next) => {
    const { storeId } = req.params;
    let { limit = 10, page = 1 } = req.query;

    page = Number(page);
    limit = Number(limit);
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

        // 🔗 Product
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
            $match: {
                "product.isActive": true
            }
        },

        // 💰 Discount Calculation
        {
            $addFields: {
                discountAmount: { $subtract: ["$variant.mrp", "$price"] },
                discountPercentage: {
                    $cond: [
                        { $gt: ["$variant.mrp", 0] },
                        {
                            $multiply: [
                                {
                                    $divide: [
                                        { $subtract: ["$variant.mrp", "$price"] },
                                        "$variant.mrp"
                                    ]
                                },
                                100
                            ]
                        },
                        0
                    ]
                }
            }
        },

        // 🔥 STEP 1: SORT → best discount first
        {
            $sort: {
                discountAmount: -1,
                discountPercentage: -1
            }
        },

        // 🔥 STEP 2: GROUP → pick best variant per product
        {
            $group: {
                _id: "$product._id",
                doc: { $first: "$$ROOT" }
            }
        },
        { $replaceRoot: { newRoot: "$doc" } },

        // 🔥 STEP 3: RE-SORT (CRITICAL)
        {
            $sort: {
                discountAmount: -1,
                discountPercentage: -1
            }
        },

        // 📦 Pagination + Data
        {
            $facet: {
                data: [
                    { $skip: skip },
                    { $limit: limit },

                    {
                        $project: {
                            _id: 0,

                            productId: "$product._id",
                            variantId: "$variant._id",

                            name: "$product.name",
                            brand: "$product.brand",
                            description: "$product.description",

                            // 🧾 Variant
                            size: "$variant.size",
                            unit: "$variant.unit",
                            weight: "$variant.weight",

                            // 💰 Pricing
                            price: "$price",
                            mrp: "$variant.mrp",
                            discount: "$discountAmount",
                            discountPercentage: {
                                $round: ["$discountPercentage", 2]
                            },

                            // 📦 Stock
                            stock: "$stock",

                            // 🏷️ Flag
                            isBestDeal: { $gte: ["$discountPercentage", 20] },

                            // 🖼️ Image
                            image: {
                                $arrayElemAt: ["$variant.images.url", 0]
                            }
                        }
                    }
                ],
                totalCount: [{ $count: "total" }]
            }
        }
    ];

    const result = await Inventory.aggregate(pipeline);

    const data = result[0]?.data || [];
    const total = result[0]?.totalCount[0]?.total || 0;

    res.status(200).json({
        success: true,
        page,
        limit,
        total,
        count: data.length,
        data
    });
});

export const getSuggestedProducts = asyncHandler(async (req, res, next) => {
    const { storeId, productId } = req.params;
    const { limit = 10 } = req.query;

    const product = await Product.findById(productId);

    if (!product) {
        return next(new errorHandler("Product not found", 404));
    }

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

        // 🔗 Product
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
            $match: {
                "product.isActive": true,
                "product._id": { $ne: product._id }, // ❌ exclude current
                "product.categoryId": product.categoryId // ✅ same category
            }
        },

        // 💰 Discount
        {
            $addFields: {
                discountPercentage: {
                    $cond: [
                        { $gt: ["$variant.mrp", 0] },
                        {
                            $multiply: [
                                {
                                    $divide: [
                                        { $subtract: ["$variant.mrp", "$price"] },
                                        "$variant.mrp"
                                    ]
                                },
                                100
                            ]
                        },
                        0
                    ]
                }
            }
        },

        // 🔥 Sort: best mix (discount + price)
        {
            $sort: {
                discountPercentage: -1,
                price: 1
            }
        },

        // 🔥 One variant per product
        {
            $group: {
                _id: "$product._id",
                doc: { $first: "$$ROOT" }
            }
        },
        { $replaceRoot: { newRoot: "$doc" } },

        // 🔥 Limit
        { $limit: Number(limit) },

        // 🎯 Final output
        {
            $project: {
                _id: 0,
                productId: "$product._id",
                variantId: "$variant._id",
                name: "$product.name",
                brand: "$product.brand",
                price: "$price",
                mrp: "$variant.mrp",
                discountPercentage: {
                    $round: ["$discountPercentage", 2]
                },
                image: {
                    $arrayElemAt: ["$variant.images.url", 0]
                }
            }
        }
    ];

    const data = await Inventory.aggregate(pipeline);

    res.status(200).json({
        success: true,
        count: data.length,
        data
    });
});