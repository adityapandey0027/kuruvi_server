import { errorHandler } from "../utilities/errorHandler.utils.js";
import { asyncHandler } from "../utilities/asyncHandler.utils.js";
import { sendSms } from "../utilities/sendSms.utils.js";
import connection from "../config/redis.js";
import Category from "../models/categoryModel.js"
import mongoose from "mongoose";
import Inventory from "../models/inventoryModel.js";
import uploadToS3, { deleteFromS3 } from "../services/s3Services.js";
import Product from "../models/productModel.js";
import Variant from "../models/variantModel.js";


export const createCategory = asyncHandler(async (req, res, next) => {

    let { name, parentId } = req.body || {};

    if (!name) {
        return next(new errorHandler("Name is required", 400));
    }

    if (!req.file) {
        return next(new errorHandler("Image is required", 400));
    }

    parentId = parentId === "" ? null : parentId;

    if (parentId && !mongoose.Types.ObjectId.isValid(parentId)) {
        return next(new errorHandler("Invalid parentId", 400));
    }

    let level = 0;

    // 🔍 Validate parent
    if (parentId) {
        const parent = await Category.findById(parentId);

        if (!parent) {
            return next(new errorHandler("Parent category not found", 404));
        }

        level = parent.level + 1;
    }

    //Prevent duplicate in same level
    const existingCategory = await Category.findOne({
        name: name.trim(),
        parentId: parentId || null
    });

    if (existingCategory) {
        return next(new errorHandler("Category already exists", 400));
    }

    // 🖼️ Upload image
    const imageData = await uploadToS3(req.file, 'categories');

    const category = await Category.create({
        name: name.trim(),
        parentId: parentId || null,
        level,
        image: imageData.url,
        imageKey: imageData.key
    });

    res.status(201).json({
        success: true,
        message: "Category created successfully",
        data: category
    });
});

export const updateCategory = asyncHandler(async (req, res, next) => {
    const id = req.params.id;

    let category = await Category.findById(id);

    if (!category) {
        return next(new errorHandler("Category not found", 404));
    }

    let imageData = null;

    // 🖼️ Upload new image
    if (req.file) {
        imageData = await uploadToS3(req.file, 'categories');

        if (category.imageKey) {
            await deleteFromS3(category.imageKey);
        }
    }

    // ❌ Prevent self-parenting
    if (req.body.parentId && req.body.parentId === id) {
        return next(new errorHandler("Category cannot be its own parent", 400));
    }

    // ✅ Handle empty string → null
    let parentId = category.parentId;

    if (req.body.parentId !== undefined) {
        parentId = req.body.parentId === "" ? null : req.body.parentId;
    }

    // 🔒 Validate parent exists
    if (parentId) {
        const parent = await Category.findById(parentId);
        if (!parent) {
            return next(new errorHandler("Parent category not found", 400));
        }

        // ============================
        // 🚫 Prevent circular loop
        // ============================
        let current = parent;

        while (current) {
            if (current._id.toString() === id) {
                return next(
                    new errorHandler("Circular hierarchy not allowed", 400)
                );
            }

            if (!current.parentId) break;

            current = await Category.findById(current.parentId).select("_id parentId");
        }
    }

    const updateData = {
        name: req.body.name ?? category.name,
        image: imageData?.url ?? category.image,
        imageKey: imageData?.key ?? category.imageKey,
        parentId
    };

    category = await Category.findByIdAndUpdate(
        id,
        updateData,
        { returnDocument: 'after', runValidators: true }
    );

    res.status(200).json({
        success: true,
        message: "Category updated successfully",
        category
    });
});

export const deleteCategory = asyncHandler(async (req, res, next) => {
    const id = req.params.id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1️⃣ Check category
        const category = await Category.findById(id).session(session);
        if (!category) {
            throw new Error("Category not found");
        }

        // 2️⃣ Get all nested categories (recursive)
        const getAllChildCategories = async (parentIds) => {
            const children = await Category.find({
                parentId: { $in: parentIds }
            }).select("_id imageKey").session(session);

            if (!children.length) return [];

            const childIds = children.map(c => c._id);
            const deeper = await getAllChildCategories(childIds);

            return [...children, ...deeper];
        };

        const nestedCategories = await getAllChildCategories([id]);

        // include main category
        const allCategories = [
            { _id: category._id, imageKey: category.imageKey },
            ...nestedCategories
        ];

        const allCategoryIds = allCategories.map(c => c._id);

        // 3️⃣ Products
        const products = await Product.find({
            categoryId: { $in: allCategoryIds }
        }).select("_id imageKey").session(session);

        const productIds = products.map(p => p._id);

        // 4️⃣ Variants
        const variants = await Variant.find({
            productId: { $in: productIds }
        }).select("_id imageKey").session(session);

        const variantIds = variants.map(v => v._id);

        const imageKeys = [];

        // categories
        allCategories.forEach(c => c.imageKey && imageKeys.push(c.imageKey));

        // products
        products.forEach(p => p.imageKey && imageKeys.push(p.imageKey));

        // variants
        variants.forEach(v => v.imageKey && imageKeys.push(v.imageKey));

        // remove duplicates
        const uniqueKeys = [...new Set(imageKeys)];

        // delete from S3
        await Promise.all(uniqueKeys.map(key => deleteFromS3(key)));

        // inventory
        await Inventory.deleteMany({
            variantId: { $in: variantIds }
        }).session(session);

        // variants
        await Variant.deleteMany({
            _id: { $in: variantIds }
        }).session(session);

        // products
        await Product.deleteMany({
            _id: { $in: productIds }
        }).session(session);

        // categories
        await Category.deleteMany({
            _id: { $in: allCategoryIds }
        }).session(session);

        // commit
        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: "Category and all related data + images deleted successfully"
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        return next(new errorHandler(error.message, 400));
    }
});

export const getParentCategories = asyncHandler(async (req, res, next) => {

    const categories = await Category.find({ parentId: null, isActive: true })
        .sort({ createdAt: 1 })
        .lean().select("name image parentId level");

    res.status(200).json({
        success: true,
        count: categories.length,
        data: categories
    });

});

export const getParentWithChildren = asyncHandler(async (req, res) => {

    const categories = await Category.aggregate([
        { $match: { parentId: null, isActive: true } },

        {
            $lookup: {
                from: "categories",
                let: { parentId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$parentId", "$$parentId"], },
                            isActive: true
                        }
                    },
                    { $limit: 6 },
                    { $project: { name: 1, image: 1 } }
                ],
                as: "children"
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                children: 1
            }
        }
    ]);

    res.status(200).json({
        success: true,
        data: categories
    });

});

export const getSubCategoriesByCategory = asyncHandler(async (req, res) => {

    const { parentId } = req.params;

    const category = await Category.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(parentId), isActive: true }
        },
        {
            $lookup: {
                from: "categories",
                let: { parentId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$parentId", "$$parentId"] },
                            isActive: true
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                            image: 1,
                            parentId: 1,
                            level: 1
                        }
                    }
                ],
                as: "subCategories"
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                image: 1,
                parentId: 1,
                level: 1,
                subCategories: 1
            }
        }
    ]);

    res.status(200).json({
        success: true,
        data: category[0]
    });

});


// export const getAllCategories = asyncHandler(async (req, res, next) => {

//     const categories = await Category.find().lean();

//     const map = {};
//     const roots = [];

//     // create map
//     categories.forEach(cat => {
//         map[cat._id] = { ...cat, children: [] };
//     });

//     // build tree
//     categories.forEach(cat => {
//         if (cat.parentId) {
//             map[cat.parentId]?.children.push(map[cat._id]);
//         } else {
//             roots.push(map[cat._id]);
//         }
//     });

//     res.status(200).json({
//         success: true,
//         count: categories.length,
//         data: roots
//     });

// });

// export const getDropdownCategories = asyncHandler(async (req, res, next) => {
//     const q = req.query.q || "";

//     const query = {
//         isActive: true
//     };

//     if (q) {
//         query.name = { $regex: q, $options: "i" };
//     } else {
//         query.parentId = null;
//     }

//     const categories = await Category.find(query)
//         .select('_id name image parentId level')
//         .sort({ name: 1 })
//         .limit(10) 
//         .lean();

//     res.status(200).json({
//         success: true,
//         count: categories.length,
//         data: categories
//     });
// });

export const getDropdownCategories = asyncHandler(async (req, res, next) => {
    const { q = "", parentId } = req.query;

    const query = {
        isActive: true
    };

    // 🔍 Search case
    if (q) {
        query.name = { $regex: q, $options: "i" };
    }

    // 📂 Parent filter (priority over default)
    else if (parentId !== undefined) {
        query._id = parentId === "" ? null : parentId;
    }

    // 📁 Default → root categories
    else {
        query.parentId = null;
    }

    const categories = await Category.find(query)
        .select("_id name image parentId level")
        .sort({ name: 1 })
        .limit(10)
        .lean();

    res.status(200).json({
        success: true,
        count: categories.length,
        data: categories
    });
});

export const getAllCategories = asyncHandler(async (req, res, next) => {
    let { page = 1, limit = 10, q = "", parentId, isActive } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    const match = {};

    if (q) {
        match.name = { $regex: q, $options: "i" };
    }

    if (parentId !== undefined) {
        match.parentId = parentId === "" ? null : new mongoose.Types.ObjectId(parentId);
    }

    if (isActive !== undefined) {
        match.isActive = isActive === "true";
    }

    const pipeline = [
        { $match: match },

        // 🔥 Add priority field
        {
            $addFields: {
                parentPriority: {
                    $cond: [{ $eq: ["$parentId", null] }, 0, 1]
                }
            }
        },

        // 🔥 Sort: parent first, then latest
        {
            $sort: {
                parentPriority: 1,
                createdAt: -1
            }
        },

        { $skip: skip },
        { $limit: limit },

        // Optional: populate parent name
        {
            $lookup: {
                from: "categories",
                localField: "parentId",
                foreignField: "_id",
                as: "parent"
            }
        },
        {
            $unwind: {
                path: "$parent",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                name: 1,
                level: 1,
                image: 1,
                isActive: 1,
                createdAt: 1,
                parentId: 1,
                parentName: "$parent.name"
            }
        }
    ];

    const categories = await Category.aggregate(pipeline);

    const total = await Category.countDocuments(match);

    res.status(200).json({
        success: true,
        data: categories,
        pagination: {
            total,
            page,
            pages: Math.ceil(total / limit),
            limit
        }
    });
});