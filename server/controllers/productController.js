import { errorHandler } from "../utilities/errorHandler.utils.js";
import { asyncHandler } from "../utilities/asyncHandler.utils.js";
import Product from "../models/productModel.js"
import Variant from "../models/variantModel.js";

export const createProduct = asyncHandler(async (req, res, next) => {
    const { name, brand, categoryId, description, tags } = req.body;

    if (!name || !categoryId) {
        return next(new errorHandler("All fields are required", 400));
    }

    const product = await Product.create({
        name,
        brand,
        categoryId,
        description,
        tags
    });

    res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: product
    })
})

// get product also category by 
export const getProducts = asyncHandler(async (req, res, next) => {
    const { page = 1, limit = 10, categoryId, search = "" } = req.body;

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

// get product with variants
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
        images,
        attributes
    } = req.body;

    if (!productId) {
        return next(new errorHandler("Product is required", 400));
    }
    if (!mrp) {
        return next(new errorHandler("MRP is required", 400));
    }
    if (!sku) {
        return next(new errorHandler("SKU is requred", 400));
    }

    const product = await Product.findById(productId);

    if (!product) {
        return next(new errorHandler("Product not found", 404));
    }
    const existingSku = await Variant.findOne({ sku });

    if (existingSku) {
        return next(new errorHandler("SKU already exists", 400));
    }

    const variant = await Variant.create({
        productId,
        sku,
        barcode,
        mrp,
        size,
        unit,
        weight,
        images,
        attributes
    });

    res.status(201).json({
        success: true,
        message: "Variant created successfully",
        data: variant
    })
})

