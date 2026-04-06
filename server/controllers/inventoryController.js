import { errorHandler } from "../utilities/errorHandler.utils.js";
import { asyncHandler } from "../utilities/asyncHandler.utils.js";
import Inventory from "../models/inventoryModel.js";
import mongoose from "mongoose";
import Store from "../models/storeModel.js";
import Variant from "../models/variantModel.js";

export const getStoreProducts = asyncHandler(async (req, res) => {

  const { storeId } = req.params;

  const products = await Inventory.find({ storeId })
    .populate({
      path: "variantId",
      populate: {
        path: "productId",
        select: "name brand"
      }
    })
    .select("price stock");

  res.status(200).json({
    success: true,
    data: products
  });

});

export const getStoreProductsByCategory = asyncHandler(async (req, res) => {

  const { storeId } = req.params;
  const { categoryId, page = 1, limit = 20 } = req.query;

  const skip = (page - 1) * limit;

  const products = await Inventory.aggregate([

    // 1. filter by store
    {
      $match: {
        storeId: new mongoose.Types.ObjectId(storeId),
        isAvailable: true,
        stock: { $gt: 0 }
      }
    },

    // 2. join variant
    {
      $lookup: {
        from: "variants",
        localField: "variantId",
        foreignField: "_id",
        as: "variant"
      }
    },
    { $unwind: "$variant" },

    // 3. join product
    {
      $lookup: {
        from: "products",
        localField: "variant.productId",
        foreignField: "_id",
        as: "product"
      }
    },
    { $unwind: "$product" },

    // 4. filter category
    ...(categoryId ? [{
      $match: {
        "product.categoryId": new mongoose.Types.ObjectId(categoryId)
      }
    }] : []),

    // 5. shape response
    {
      $project: {
        _id: 0,
        productId: "$product._id",
        name: "$product.name",
        brand: "$product.brand",

        variantId: "$variant._id",
        size: "$variant.size",
        unit: "$variant.unit",

        mrp: "$variant.mrp",
        price: "$price",

        stock: "$stock",

        image: { $arrayElemAt: ["$variant.images", 0] }
      }
    },

    // 6. pagination
    { $skip: skip },
    { $limit: Number(limit) }

  ]);

  res.status(200).json({
    success: true,
    data: products
  });

});

export const getStoreProductDetailsById = asyncHandler(async (req, res, next) => {

  const { storeId, productId } = req.params;

  const data = await Inventory.aggregate([

    // 1. match store
    {
      $match: {
        storeId: new mongoose.Types.ObjectId(storeId),
        isAvailable: true
      }
    },

    // 2. join variant
    {
      $lookup: {
        from: "variants",
        localField: "variantId",
        foreignField: "_id",
        as: "variant"
      }
    },
    { $unwind: "$variant" },

    // 3. filter by productId
    {
      $match: {
        "variant.productId": new mongoose.Types.ObjectId(productId)
      }
    },

    // 4. join product
    {
      $lookup: {
        from: "products",
        localField: "variant.productId",
        foreignField: "_id",
        as: "product"
      }
    },
    { $unwind: "$product" },

    // 5. format response
    {
      $project: {
        _id: 0,

        productId: "$product._id",
        name: "$product.name",
        brand: "$product.brand",
        description: "$product.description",

        variantId: "$variant._id",
        size: "$variant.size",
        unit: "$variant.unit",
        weight: "$variant.weight",

        mrp: "$variant.mrp",
        price: "$price",

        stock: "$stock",

        images: "$variant.images"
      }
    }

  ]);

  if (!data.length) {
    return next(new errorHandler("Product not available in this store", 404));
  }

  // group variants under product
  const product = {
    productId: data[0].productId,
    name: data[0].name,
    brand: data[0].brand,
    description: data[0].description,
    variants: data.map(item => ({
      variantId: item.variantId,
      size: item.size,
      unit: item.unit,
      mrp: item.mrp,
      price: item.price,
      stock: item.stock,
      images: item.images
    }))
  };

  res.status(200).json({
    success: true,
    data: product
  });

});

export const createInventory = asyncHandler(async (req, res, next) => {
  const {
    
    variantId,
    price,
    stock = 0,
    lowStock = 5,
    batchNumber,
    expiryDate
  } = req.body;
  const storeId = req.body.storeId || req.user._id;
  if (!storeId || !variantId || price == null) {
    return next(new errorHandler("storeId, variantId, and price are required", 400));
  }

  if (stock < lowStock) {
    return next(new errorHandler("Low stock threshold cannot be greater than stock", 400));
  }

  if (price <= 0) {
    return next(new errorHandler("Price must be greater than 0", 400));
  }

  const [store, variant, existingInventory] = await Promise.all([
    Store.findById(storeId),
    Variant.findById(variantId),
    Inventory.findOne({ storeId, variantId })
  ]);

  if (!store) return next(new errorHandler("Store not found", 404));
  if (!variant) return next(new errorHandler("Variant not found", 404));

  if (variant.mrp < price) {
    return next(new errorHandler("Price cannot exceed MRP", 400));
  }

  if (existingInventory) {
    return next(new errorHandler("Inventory already exists for this variant in this store", 400));
  }

  const inventoryData = {
    storeId,
    variantId,
    price,
    stock,
    lowStockThreshold: lowStock
  };

  if (batchNumber) {
    inventoryData.batchNumber = batchNumber.trim();
  }

  if (expiryDate) {
    const parsedDate = new Date(expiryDate);
    if (!isNaN(parsedDate)) {
      inventoryData.expiryDate = parsedDate;
    }
  }

  const inventory = await Inventory.create(inventoryData);

  res.status(201).json({
    success: true,
    message: "Inventory record created successfully",
    data: inventory
  });
});

