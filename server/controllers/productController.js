import { errorHandler } from "../utilities/errorHandler.utils.js";
import { asyncHandler } from "../utilities/asyncHandler.utils.js";
import Product from "../models/productModel.js"
import Variant from "../models/variantModel.js";
import mongoose from "mongoose";
import connection from "../config/redis.js";
import Inventory from "../models/inventoryModel.js";
import uploadToS3, { deleteFromS3 } from "../services/s3Services.js";


export const createProduct = asyncHandler(async (req, res, next) => {
    const { name, brand, categoryId, description, tags, variantsMetadata } = req.body;
    const variants = JSON.parse(variantsMetadata);

    if (!name || !categoryId || !variants || variants.length === 0) {
        return next(new errorHandler("Product info and variants are required", 400));
    }

    const product = await Product.create({
        name,
        brand,
        categoryId,
        description,
        tags: tags ? tags.split(',').map(t => t.trim()) : []
    });

    const variantDocs = [];

    for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        let uploadedUrls = [];

        const variantFiles = req.files.filter(file => file.fieldname === `variant_images_${i}`);

        if (variantFiles.length > 0) {
            uploadedUrls = await Promise.all(
                variantFiles.map(file => uploadToS3(file, 'variants'))
            );
        }

        variantDocs.push({
            productId: product._id,
            sku: v.sku,
            barcode: v.barcode,
            mrp: v.mrp,
            size: v.size,
            unit: v.unit,
            weight: v.weight,
            images: uploadedUrls // S3 URLs ka array
        });
    }

    await Variant.insertMany(variantDocs);

    res.status(201).json({
        success: true,
        message: "Product and all variants created successfully",
        data: product
    });
});


export const editProduct = asyncHandler(async (req, res, next) => {
    const productId = req.params.id;
    const { name, brand, categoryId, description, tags, variantsMetadata, deletedVariantIds } = req.body;

    const variants = JSON.parse(variantsMetadata || "[]");
    const deletedIds = deletedVariantIds ? JSON.parse(deletedVariantIds) : [];

    const product = await Product.findById(productId);

    if (!product) {
        return next(new errorHandler("Product not found", 404));
    }

    // =========================
    // 🧾 Update product fields
    // =========================
    product.name = name ?? product.name;
    product.brand = brand ?? product.brand;
    product.categoryId = categoryId ?? product.categoryId;
    product.description = description ?? product.description;
    product.tags = tags ? tags.split(',').map(t => t.trim()) : product.tags;

    await product.save();

    // =========================
    // 🗑️ Delete removed variants
    // =========================
    if (deletedIds.length > 0) {
        const variantsToDelete = await Variant.find({ _id: { $in: deletedIds } });

        // delete images from S3
        const imageKeys = variantsToDelete.flatMap(v =>
            (v.images || []).map(img => img.key)
        );

        await Promise.all(imageKeys.map(key => deleteFromS3(key)));

        await Variant.deleteMany({ _id: { $in: deletedIds } });
    }

    // =========================
    // 🔁 Add / Update variants
    // =========================
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

        // 🔄 UPDATE existing variant
        if (v._id) {
            const existingVariant = await Variant.findById(v._id);

            if (!existingVariant) continue;

            // delete old images if new uploaded
            if (uploadedImages.length > 0) {
                const oldKeys = (existingVariant.images || []).map(img => img.key);
                await Promise.all(oldKeys.map(key => deleteFromS3(key)));
            }

            existingVariant.sku = v.sku ?? existingVariant.sku;
            existingVariant.barcode = v.barcode ?? existingVariant.barcode;
            existingVariant.mrp = v.mrp ?? existingVariant.mrp;
            existingVariant.size = v.size ?? existingVariant.size;
            existingVariant.unit = v.unit ?? existingVariant.unit;
            existingVariant.weight = v.weight ?? existingVariant.weight;

            if (uploadedImages.length > 0) {
                existingVariant.images = uploadedImages;
            }

            await existingVariant.save();
        }

        // ➕ CREATE new variant
        else {
            await Variant.create({
                productId,
                sku: v.sku,
                barcode: v.barcode,
                mrp: v.mrp,
                size: v.size,
                unit: v.unit,
                weight: v.weight,
                images: uploadedImages
            });
        }
    }

    res.status(200).json({
        success: true,
        message: "Product updated successfully"
    });
});

export const deleteProduct = asyncHandler(async (req, res, next) => {
    const productId = req.params.id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1️⃣ Check product
        const product = await Product.findById(productId).session(session);
        if (!product) {
            throw new Error("Product not found");
        }

        // 2️⃣ Get all variants
        const variants = await Variant.find({ productId })
            .select("_id images")
            .session(session);

        const variantIds = variants.map(v => v._id);

        // ===========================
        // 🧹 Collect S3 image keys
        // ===========================
        const imageKeys = [];

        variants.forEach(v => {
            (v.images || []).forEach(img => {
                if (img.key) imageKeys.push(img.key);
            });
        });

        const uniqueKeys = [...new Set(imageKeys)];

        // ===========================
        // 🗑️ Delete from S3
        // ===========================
        try {
            await Promise.all(uniqueKeys.map(key => deleteFromS3(key)));
        } catch (err) {
            console.error("S3 delete error:", err);
            // optional: don't fail transaction
        }

        // ===========================
        // 🧾 Delete inventory (if exists)
        // ===========================
        await Inventory.deleteMany({
            variantId: { $in: variantIds }
        }).session(session);

        // ===========================
        // 🗑️ Delete variants
        // ===========================
        await Variant.deleteMany({
            productId
        }).session(session);

        // ===========================
        // 🗑️ Delete product
        // ===========================
        await Product.findByIdAndDelete(productId).session(session);

        // ✅ Commit
        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: "Product, variants, and images deleted successfully"
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

    // Pagination numbers ko integer mein convert karna zaroori hai
    const skip = (Number(page) - 1) * Number(limit);

    const products = await Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('categoryId', 'name')
        .lean();

    const productIds = products.map(p => p._id);
    const variants = await Variant.find({ productId: { $in: productIds } }).lean();

    const variantMap = {};
    variants.forEach(v => {
        // Safe image processing
        const processedImages = (v.images || []).map(img => 
            (img && typeof img === 'object') ? img.url : img
        );

        const variantWithCleanImages = {
            ...v,
            images: processedImages
        };

        if (!variantMap[v.productId]) variantMap[v.productId] = [];
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
        page: Number(page),
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