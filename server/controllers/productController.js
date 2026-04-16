import { errorHandler } from "../utilities/errorHandler.utils.js";
import { asyncHandler } from "../utilities/asyncHandler.utils.js";
import Product from "../models/productModel.js"
import Variant from "../models/variantModel.js";
import mongoose from "mongoose";
import connection from "../config/redis.js";
import Inventory from "../models/inventoryModel.js";
import uploadToS3, { deleteFromS3 } from "../services/s3Services.js";
import ProductSuggestionModel from "../models/ProductSuggestionModel.js";

export const createProduct = asyncHandler(async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { name, brand, categoryId, description, tags, variantsMetadata } = req.body;
        const variants = JSON.parse(variantsMetadata);

        if (!name || !categoryId || !variants || variants.length === 0) {
            await session.abortTransaction();
            session.endSession();
            return next(new errorHandler("Product info and variants are required", 400));
        }

        const product = await Product.create([{
            name,
            brand,
            categoryId,
            description,
            tags: tags ? tags.split(',').map(t => t.trim()) : []
        }], { session });

        const productId = product[0]._id;

        const variantDocs = [];

        for (let i = 0; i < variants.length; i++) {
            const v = variants[i];
            let uploadedUrls = [];

            const variantFiles = req.files.filter(
                file => file.fieldname === `variant_images_${i}`
            );

            if (variantFiles.length > 0) {
                uploadedUrls = await Promise.all(
                    variantFiles.map(file => uploadToS3(file, 'variants'))
                );
            }

            variantDocs.push({
                productId,
                sku: v.sku || undefined,
                barcode: v.barcode || undefined,
                mrp: v.mrp,
                size: v.size,
                unit: v.unit,
                weight: v.weight,
                images: uploadedUrls
            });
        }

        await Variant.insertMany(variantDocs, { session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            success: true,
            message: "Product and all variants created successfully",
            data: product[0]
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        return next(error);
    }
});

export const editProduct = asyncHandler(async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const productId = req.params.id;
        const {
            name,
            brand,
            categoryId,
            description,
            tags,
            variantsMetadata,
            deletedVariantIds
        } = req.body;

        const variants = JSON.parse(variantsMetadata || "[]");
        const deletedIds = deletedVariantIds ? JSON.parse(deletedVariantIds) : [];

        const product = await Product.findById(productId).session(session);

        if (!product) {
            await session.abortTransaction();
            session.endSession();
            return next(new errorHandler("Product not found", 404));
        }

        // =========================
        // 🧾 Update product fields
        // =========================
        product.name = name ?? product.name;
        product.brand = brand ?? product.brand;
        product.categoryId = categoryId ?? product.categoryId;
        product.description = description ?? product.description;
        product.tags = tags
            ? tags.split(',').map(t => t.trim())
            : product.tags;

        await product.save({ session });


        if (deletedIds.length > 0) {
            const variantsToDelete = await Variant.find({
                _id: { $in: deletedIds }
            }).session(session);

            const imageKeys = variantsToDelete.flatMap(v =>
                (v.images || []).map(img => img.key)
            );

            await Promise.all(imageKeys.map(key => deleteFromS3(key)));

            await Variant.deleteMany(
                { _id: { $in: deletedIds } },
                { session }
            );
        }

        for (let i = 0; i < variants.length; i++) {
            const v = variants[i];

            let uploadedImages = [];

            const variantFiles = req.files?.filter(
                file => file.fieldname === `variant_images_${i}`
            ) || [];

            if (variantFiles.length > 0) {
                uploadedImages = await Promise.all(
                    variantFiles.map(file => uploadToS3(file, 'variants'))
                );
            }

            // 🔄 UPDATE existing
            if (v._id) {
                const existingVariant = await Variant.findById(v._id).session(session);
                if (!existingVariant) continue;

                // delete old images if new uploaded
                if (uploadedImages.length > 0) {
                    const oldKeys = (existingVariant.images || []).map(img => img.key);
                    await Promise.all(oldKeys.map(key => deleteFromS3(key)));
                    existingVariant.images = uploadedImages;
                }

                existingVariant.sku = v.sku || undefined;
                existingVariant.barcode = v.barcode || undefined;
                existingVariant.mrp = v.mrp ?? existingVariant.mrp;
                existingVariant.size = v.size ?? existingVariant.size;
                existingVariant.unit = v.unit ?? existingVariant.unit;
                existingVariant.weight = v.weight ?? existingVariant.weight;

                await existingVariant.save({ session });
            }

            // ➕ CREATE new
            else {
                await Variant.create([{
                    productId,
                    sku: v.sku || undefined,
                    barcode: v.barcode || undefined,
                    mrp: v.mrp,
                    size: v.size,
                    unit: v.unit,
                    weight: v.weight,
                    images: uploadedImages
                }], { session });
            }
        }

        // ✅ commit
        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: "Product updated successfully"
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return next(error);
    }
});


export const deleteProduct = asyncHandler(async (req, res, next) => {
    const productId = req.params.id;

    const session = await mongoose.startSession();
    session.startTransaction();

    let imageKeysToDelete = [];

    try {

        const product = await Product.findById(productId).session(session);
        if (!product) {
            await session.abortTransaction();
            session.endSession();
            return next(new errorHandler("Product not found", 404));
        }


        const variants = await Variant.find({ productId })
            .select("_id images")
            .session(session);

        const variantIds = variants.map(v => v._id);

        const imageKeys = [];

        variants.forEach(v => {
            (v.images || []).forEach(img => {
                if (img.key) imageKeys.push(img.key);
            });
        });

        imageKeysToDelete = [...new Set(imageKeys)];


        await Inventory.deleteMany({
            variantId: { $in: variantIds }
        }).session(session);

        await Variant.deleteMany({ productId }).session(session);


        await Product.findByIdAndDelete(productId).session(session);

        // ✅ Commit DB first
        await session.commitTransaction();
        session.endSession();


        try {
            await Promise.all(
                imageKeysToDelete.map(key => deleteFromS3(key))
            );
        } catch (err) {
            console.error("S3 delete failed:", err);
            // optional: log to queue / retry system
        }

        res.status(200).json({
            success: true,
            message: "Product and related data deleted successfully"
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        return next(new errorHandler(error.message, 400));
    }
});

export const getProducts = asyncHandler(async (req, res, next) => {
    const { page = 1, limit = 10, categoryId, search = "" } = req.query;

    let filter = { isActive: true };

    if (categoryId) filter.categoryId = categoryId;

    if (search) {
        filter.$text = { $search: search };
    }

    const products = await Product.find(filter)
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean();

    const productIds = products.map(p => p._id);

    const variants = await Variant.find({ productId: { $in: productIds } }).lean();

    const variantMap = {};
    variants.forEach(v => {
        if (!variantMap[v.productId]) variantMap[v.productId] = [];
        variantMap[v.productId].push(v);
    });

    const result = products.map(product => ({
        ...product,
        variants: variantMap[product._id] || []
    }));

    res.status(200).json({
        success: true,
        data: result
    });
});

export const getAllProducts = asyncHandler(async (req, res, next) => {
    const { page = 1, limit = 10, search = "" } = req.query;

    let filter = { isActive: true };

    if (search) {
        filter.name = { $regex: search, $options: "i" };
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('categoryId', 'name')
        .lean();

    const productIds = products.map(p => p._id);

    const variants = await Variant.find({
        productId: { $in: productIds }
    }).lean();

    const variantMap = {};

    variants.forEach(v => {
        const processedImages = (v.images || []).map(img =>
            (img && typeof img === 'object') ? img.url : img
        );

        const variantWithCleanImages = {
            ...v,
            images: processedImages
        };

        if (!variantMap[v.productId]) {
            variantMap[v.productId] = [];
        }

        variantMap[v.productId].push(variantWithCleanImages);
    });

    const result = products.map(product => ({
        ...product,
        variants: variantMap[product._id] || []
    }));

    const totalProducts = await Product.countDocuments(filter);

    res.status(200).json({
        success: true,
        count: result.length,
        total: totalProducts,
        page: pageNum,
        limit: limitNum,
        data: result
    });
});


export const getProductWithVariantById = asyncHandler(async (req, res, next) => {

    const productId = req.params.id;

    const product = await Product.findById(productId)
        .populate("categoryId", "name")
        .lean();

    if (!product) {
        return next(new errorHandler("Product not found", 404));
    }

    const variants = await Variant.find({ productId })
        .select("sku mrp size unit weight images attributes")
        .lean();

    res.status(200).json({
        success: true,
        data: {
            product,
            variants
        }
    });

});

export const getProductWithVariantByIdWithStore = asyncHandler(async (req, res, next) => {

    const productId = req.params.id;
    const { storeId } = req.query;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return next(new errorHandler("Invalid product id", 400));
    }

    if (!storeId || !mongoose.Types.ObjectId.isValid(storeId)) {
        return next(new errorHandler("Invalid store id", 400));
    }

    // 🔹 Product
    const product = await Product.findById(productId)
        .populate("categoryId", "name")
        .lean();

    if (!product) {
        return next(new errorHandler("Product not found", 404));
    }

    // 🔹 Variants via Inventory (store-specific)
    const inventories = await Inventory.aggregate([
        {
            $match: {
                storeId: new mongoose.Types.ObjectId(storeId),
                stock: { $gt: 0 },
                isAvailable: true
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
                "variant.productId": new mongoose.Types.ObjectId(productId)
            }
        },

        // optional sort
        { $sort: { price: 1 } },

        {
            $project: {
                _id: "$variant._id", // ✅ keep same
                sku: "$variant.sku",
                mrp: "$variant.mrp",
                size: "$variant.size",
                unit: "$variant.unit",
                weight: "$variant.weight",
                images: "$variant.images",
                attributes: "$variant.attributes",

                // optional (you can include or remove)
                price: "$price",
                stock: "$stock"
            }
        }
    ]);

    res.status(200).json({
        success: true,
        data: {
            product,
            variants: inventories
        }
    });
});



// get product by id
export const getProductById = asyncHandler(async (req, res, next) => {

    const productId = req.params.id;

    const product = await Product.findById(productId)
        .populate("categoryId", "name")
        .lean();

    if (!product) {
        return next(new errorHandler("Product not found", 404));
    }

    res.status(200).json({
        success: true,
        data: product
    });

});


// variant 
export const createVariant = asyncHandler(async (req, res, next) => {
    const {
        productId,
        sku,
        barcode,
        mrp,
        size,
        unit,
        weight,
        attributes
    } = req.body;

    if (!productId) {
        return next(new errorHandler("Product is required", 400));
    }
    if (!mrp) {
        return next(new errorHandler("MRP is required", 400));
    }
    if (!sku) {
        return next(new errorHandler("SKU is required", 400));
    }

    const product = await Product.findById(productId);

    if (!product) {
        return next(new errorHandler("Product not found", 404));
    }

    const existingSku = await Variant.findOne({ sku });

    if (existingSku) {
        return next(new errorHandler("SKU already exists", 400));
    }

    let uploadedImages = [];

    if (req.files && req.files.length > 0) {
        uploadedImages = await Promise.all(
            req.files.map(file => uploadToS3(file, 'variants'))
        );
    }

    const variant = await Variant.create({
        productId,
        sku,
        barcode,
        mrp,
        size,
        unit,
        weight,
        attributes,
        images: uploadedImages
    });

    res.status(201).json({
        success: true,
        message: "Variant created successfully",
        data: variant
    });
});


export const getVarauriantsBySearch = asyncHandler(async (req, res, next) => {
    const { q } = req.query;

    if (!q || !q.trim()) {
        return next(new errorHandler("Search query is required", 400));
    }

    const searchQuery = q.trim();

    // 1️⃣ Find products using TEXT INDEX
    const matchedProducts = await Product.find(
        { $text: { $search: searchQuery } },
        { score: { $meta: "textScore" } }
    )
        .sort({ score: { $meta: "textScore" } })
        .select("_id name")
        .lean();

    const productIdsFromSearch = matchedProducts.map(p => p._id);

    // 2️⃣ Find variants (sku, barcode, attributes)
    const variantMatches = await Variant.find({
        $or: [
            { sku: { $regex: searchQuery, $options: "i" } },
            { barcode: { $regex: searchQuery, $options: "i" } },
            {
                $expr: {
                    $gt: [
                        {
                            $size: {
                                $filter: {
                                    input: {
                                        $ifNull: [
                                            { $objectToArray: "$attributes" },
                                            []
                                        ]
                                    },
                                    as: "attr",
                                    cond: {
                                        $regexMatch: {
                                            input: "$$attr.v",
                                            regex: searchQuery,
                                            options: "i"
                                        }
                                    }
                                }
                            }
                        },
                        0
                    ]
                }
            }
        ]
    })
        .select("_id productId sku barcode mrp size unit weight attributes images")
        .lean();

    const productIdsFromVariants = variantMatches.map(v => v.productId);

    // 3️⃣ Merge all product IDs (remove duplicates)
    const allProductIds = [
        ...new Set([
            ...productIdsFromSearch.map(id => id.toString()),
            ...productIdsFromVariants.map(id => id.toString())
        ])
    ];

    // 4️⃣ Get all variants of matched products
    const allVariants = await Variant.find({
        productId: { $in: allProductIds }
    })
        .select("_id productId sku barcode mrp size unit weight attributes images")
        .lean();

    // 5️⃣ Get product names
    const products = await Product.find({
        _id: { $in: allProductIds }
    })
        .select("_id name")
        .lean();

    const productMap = {};
    products.forEach(p => {
        productMap[p._id.toString()] = p.name;
    });

    // 6️⃣ Format response
    const result = {
        variants: allVariants.map(item => ({
            variantId: item._id,
            productId: item.productId,
            productName: productMap[item.productId.toString()] || "Unknown",
            sku: item.sku,
            barcode: item.barcode,
            mrp: item.mrp,
            size: item.size,
            unit: item.unit,
            weight: item.weight,
            attributes: item.attributes || {},
            images: item.images || []
        }))
    };

    res.status(200).json({
        success: true,
        count: result.variants.length,
        data: result
    });
});

export const getAllProductInApp = asyncHandler(async (req, res, next) => {
    const {
        page = 1,
        limit = 10,
        search,
        categoryId,
        sort,
        minPrice,
        maxPrice,
        brand,
        inStock
    } = req.query;

    const { storeId } = req.params;
    const skip = (page - 1) * limit;

    let sortOption = { price: 1 };
    if (sort === "price_desc") sortOption = { price: -1 };
    if (sort === "newest") sortOption = { "product.createdAt": -1 };

    const pipeline = [
        {
            $match: {
                storeId: new mongoose.Types.ObjectId(storeId),
                isAvailable: true,
                ...(inStock === "true" ? { stock: { $gt: 0 } } : {})
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

        // Search (TEXT + fallback)
        ...(search
            ? [
                {
                    $match: {
                        $or: [
                            { $text: { $search: search } }, // fast search
                            { "product.name": { $regex: search, $options: "i" } },
                            { "product.brand": { $regex: search, $options: "i" } },
                            { "variant.size": { $regex: search, $options: "i" } },
                            { "variant.unit": { $regex: search, $options: "i" } }
                        ]
                    }
                }
            ]
            : []),

        // Category
        ...(categoryId
            ? [
                {
                    $match: {
                        "product.categoryId": new mongoose.Types.ObjectId(categoryId)
                    }
                }
            ]
            : []),

        // Brand
        ...(brand
            ? [
                {
                    $match: {
                        "product.brand": { $regex: brand, $options: "i" }
                    }
                }
            ]
            : []),

        //  Price range
        ...(minPrice || maxPrice
            ? [
                {
                    $match: {
                        price: {
                            ...(minPrice ? { $gte: Number(minPrice) } : {}),
                            ...(maxPrice ? { $lte: Number(maxPrice) } : {})
                        }
                    }
                }
            ]
            : []),

        // 🔥 Sort before grouping
        { $sort: sortOption },

        {
            $group: {
                _id: "$product._id",
                doc: { $first: "$$ROOT" }
            }
        },
        { $replaceRoot: { newRoot: "$doc" } },

        {
            $facet: {
                data: [
                    { $skip: Number(skip) },
                    { $limit: Number(limit) },
                    {
                        $project: {
                            _id: 0,
                            productId: "$product._id",
                            name: "$product.name",
                            brand: "$product.brand",
                            description: "$product.description",
                            categoryId: "$product.categoryId",
                            price: "$price",
                            mrp: "$variant.mrp",
                            size: "$variant.size",
                            unit: "$variant.unit",
                            stock: 1,
                            image: { $arrayElemAt: ["$variant.images.url", 0] }
                        }
                    }
                ],
                totalCount: [{ $count: "total" }]
            }
        }
    ];

    const result = await Inventory.aggregate(pipeline);

    const products = result[0].data;
    const total = result[0].totalCount[0]?.total || 0;

    res.status(200).json({
        success: true,
        page: Number(page),
        limit: Number(limit),
        total,
        count: products.length,
        data: products
    });
});

export const getProductByCategoryGroup = asyncHandler(async (req, res, next) => {
    const { storeId } = req.params;
    let { page = 1, limit = 20, q = "" } = req.query;

    page = Number(page);
    limit = Number(limit);
    const skip = (page - 1) * limit;

    let productIds = [];

    // 🔐 escape regex
    const escapeRegex = (text) =>
        text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // 🔍 SEARCH
    if (q) {
        const products = await Product.find(
            { $text: { $search: q } },
            { _id: 1, score: { $meta: "textScore" } }
        )
            .sort({ score: -1 })
            .limit(100);

        productIds = products.map(p => p._id);

        if (productIds.length === 0) {
            const safeRegex = new RegExp(escapeRegex(q), "i");

            const fallbackProducts = await Product.find({
                $or: [
                    { name: safeRegex },
                    { brand: safeRegex },
                    { tags: safeRegex }
                ]
            }).limit(50);

            productIds = fallbackProducts.map(p => p._id);
        }

        if (productIds.length === 0) {
            return res.status(200).json({
                success: true,
                page,
                limit,
                total: 0,
                count: 0,
                data: []
            });
        }
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

        // 🔍 Apply search filter
        ...(q
            ? [{
                $match: {
                    "variant.productId": { $in: productIds }
                }
            }]
            : []),

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

        // 🔗 Category
        {
            $lookup: {
                from: "categories",
                localField: "product.categoryId",
                foreignField: "_id",
                as: "category"
            }
        },
        {
            $unwind: {
                path: "$category",
                preserveNullAndEmptyArrays: true
            }
        },

        // 💰 Discount calc
        {
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
        },

        // 🔥 Sort cheapest first
        { $sort: { price: 1 } },

        // 🔥 One product → one variant (cheapest)
        {
            $group: {
                _id: "$product._id",
                doc: { $first: "$$ROOT" }
            }
        },
        { $replaceRoot: { newRoot: "$doc" } },

        // 🔥 Group by category
        {
            $group: {
                _id: {
                    categoryId: "$product.categoryId",
                    categoryName: {
                        $ifNull: ["$category.name", "Other"]
                    },
                    categoryImage: {
                        $ifNull: ["$category.image", null]
                    }
                },
                products: {
                    $push: {
                        productId: "$product._id",
                        variantId: "$variant._id",

                        name: "$product.name",
                        brand: "$product.brand",
                        description: "$product.description",
                        tags: "$product.tags",

                        // 🧾 Variant
                        size: "$variant.size",
                        unit: "$variant.unit",
                        weight: "$variant.weight",
                        sku: "$variant.sku",

                        // 💰 Pricing
                        price: "$price",
                        mrp: "$variant.mrp",
                        discount: "$discount",
                        discountPercentage: {
                            $round: ["$discountPercentage", 2]
                        },

                        // 📦 Inventory
                        stock: "$stock",

                        // 🏷️ Flags
                        isBestDeal: { $gte: ["$discountPercentage", 20] },
                        isLowStock: { $lte: ["$stock", 5] },

                        // 🖼️ Image
                        image: {
                            $arrayElemAt: ["$variant.images.url", 0]
                        }
                    }
                }
            }
        },

        // 🔥 Clean output
        {
            $project: {
                _id: 0,
                categoryId: "$_id.categoryId",
                categoryName: "$_id.categoryName",
                categoryImage: "$_id.categoryImage",
                products: 1
            }
        },

        { $sort: { categoryName: 1 } },

        // 📦 Pagination
        {
            $facet: {
                data: [
                    { $skip: skip },
                    { $limit: limit }
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


export const addSuggestionForAdmin = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;

    const { name, brand = "", note = "" } = req.body;

    if (!name) {
        return next(new errorHandler("Product name is required", 400));
    }

    const exists = await ProductSuggestionModel.findOne({
        userId,
        name
    });

    if (exists) {
        return res.json({
            success: true,
            message: "Already suggested"
        });
    }

    const suggestion = await ProductSuggestionModel.create({
        userId,
        name,
        brand,
        note
    });

    res.status(201).json({
        success: true,
        message: "Suggestion submitted successfully",
        data: suggestion
    });
});