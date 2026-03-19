import { errorHandler } from "../utilities/errorHandler.utils.js";
import { asyncHandler } from "../utilities/asyncHandler.utils.js";
import { sendSms } from "../utilities/sendSms.utils.js";
import connection from "../config/redis.js";
import Category from "../models/categoryModel.js"
import mongoose from "mongoose";

export const createCategory = asyncHandler(async (req, res, next) => {

    const { name, parentId, image } = req.body || {};

    if (!name || !image) {
        return next(new errorHandler("Name and image are required", 400));
    }

    let level = 0;

    if (parentId) {
        const parent = await Category.findById(parentId);

        if (!parent) {
            return next(new errorHandler("Parent category not found", 404));
        }

        level = parent.level + 1;
    }

    const existingCategory = await Category.findOne({
        name,
        parentId: parentId || null
    });

    if (existingCategory) {
        return next(new errorHandler("Category already exists", 400));
    }

    const category = await Category.create({
        name,
        parentId: parentId || null,
        level,
        image
    });

    res.status(201).json({
        success: true,
        message: "Category created successfully",
        data: category
    });

});

export const updateCategory = asyncHandler(async (req, res, next) => {
    const id = req.params.id;
    const category = null
    res.status(200).json({
        success: true,
        message: "Category updated successfully",
        category
    })
})

export const deleteCategory = asyncHandler(async (req, res, next) => {
    const id = req.params.id;
    const category = null
    res.status(200).json({
        success: true,
        message: "Category deleted successfully",
    })
})

export const getParentCategories = asyncHandler(async (req, res, next) => {

    const categories = await Category.find({ parentId: null, isActive: true })
        .sort({ createdAt: 1 })
        .lean().select("name image");

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
                            image: 1
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
                subCategories: 1
            }
        }
    ]);

    res.status(200).json({
        success: true,
        data: category[0]
    });

});

export const getAllCategories = asyncHandler(async (req, res, next) => {

    const categories = await Category.find().lean();

    const map = {};
    const roots = [];

    // create map
    categories.forEach(cat => {
        map[cat._id] = { ...cat, children: [] };
    });

    // build tree
    categories.forEach(cat => {
        if (cat.parentId) {
            map[cat.parentId]?.children.push(map[cat._id]);
        } else {
            roots.push(map[cat._id]);
        }
    });

    res.status(200).json({
        success: true,
        count: categories.length,
        data: roots
    });

});

