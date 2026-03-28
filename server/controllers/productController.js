import { errorHandler } from "../utilities/errorHandler.utils.js";
import { asyncHandler } from "../utilities/asyncHandler.utils.js";
import Product from "../models/productModel.js"
import Variant from "../models/variantModel.js";

import uploadToS3 from "../services/s3Services.js";


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
