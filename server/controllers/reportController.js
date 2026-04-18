import Admin from "../models/adminModel.js";
import { errorHandler } from "../utilities/errorHandler.utils.js";
import { asyncHandler } from "../utilities/asyncHandler.utils.js";
import mongoose from "mongoose";
import Rider from "../models/riderModel.js";
import Order from "../models/orderModel.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import Inventory from "../models/inventoryModel.js";


export const exportStockReport = asyncHandler(async (req, res, next) => {
    const { storeId } = req.params;

    const data = await Inventory.aggregate([
        {
            $match: {
                storeId: new mongoose.Types.ObjectId(storeId)
            }
        },

        // Variant
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
        { $unwind: "$product" },

        // Category
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

        {
            $project: {
                productName: "$product.name",
                brand: "$product.brand",
                category: "$category.name",
                sku: "$variant.sku",
                size: "$variant.size",
                unit: "$variant.unit",
                mrp: "$variant.mrp",
                price: "$price",
                stock: "$stock",
                status: {
                    $cond: [{ $gt: ["$stock", 0] }, "In Stock", "Out of Stock"]
                }
            }
        }
    ]);

    // 📄 Create Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Stock Report");

    // 🧾 Columns
    worksheet.columns = [
        { header: "Product Name", key: "productName", width: 25 },
        { header: "Brand", key: "brand", width: 20 },
        { header: "Category", key: "category", width: 20 },
        { header: "SKU", key: "sku", width: 15 },
        { header: "Variant", key: "variant", width: 20 },
        { header: "MRP", key: "mrp", width: 10 },
        { header: "Price", key: "price", width: 10 },
        { header: "Stock", key: "stock", width: 10 },
        { header: "Status", key: "status", width: 15 }
    ];

    // ➕ Add rows
    data.forEach(item => {
        worksheet.addRow({
            ...item,
            variant: `${item.size || ""} ${item.unit || ""}`
        });
    });

    // 🎨 Header styling
    worksheet.getRow(1).font = { bold: true };

    // 📤 Response
    res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
        "Content-Disposition",
        "attachment; filename=stock-report.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
});

export const getStockReport = asyncHandler(async (req, res, next) => {
    const { storeId } = req.params;

    let { page = 1, limit = 20, q = "" } = req.query;

    page = Number(page);
    limit = Number(limit);
    const skip = (page - 1) * limit;

    const pipeline = [
        {
            $match: {
                storeId: new mongoose.Types.ObjectId(storeId)
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

        // 🔍 Search
        ...(q
            ? [{
                $match: {
                    $or: [
                        { "product.name": { $regex: q, $options: "i" } },
                        { "product.brand": { $regex: q, $options: "i" } },
                        { "variant.sku": { $regex: q, $options: "i" } }
                    ]
                }
            }]
            : []),

        // 📦 Final format
        {
            $project: {
                _id: 0,
                productId: "$product._id",
                name: "$product.name",
                brand: "$product.brand",
                category: "$category.name",
                sku: "$variant.sku",
                variant: {
                    size: "$variant.size",
                    unit: "$variant.unit"
                },
                mrp: "$variant.mrp",
                price: "$price",
                stock: "$stock",
                status: {
                    $cond: [
                        { $gt: ["$stock", 0] },
                        "In Stock",
                        "Out of Stock"
                    ]
                }
            }
        },

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


export const exportStockReportPDF = asyncHandler(async (req, res, next) => {
    const { storeId } = req.params;

    const data = await Inventory.aggregate([
        {
            $match: {
                storeId: new mongoose.Types.ObjectId(storeId)
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

        {
            $project: {
                productName: "$product.name",
                brand: "$product.brand",
                category: "$category.name",
                sku: "$variant.sku",
                variant: {
                    $concat: [
                        { $ifNull: ["$variant.size", ""] },
                        " ",
                        { $ifNull: ["$variant.unit", ""] }
                    ]
                },
                price: "$price",
                stock: "$stock"
            }
        }
    ]);

    // 📄 Create PDF
    const doc = new PDFDocument({ margin: 30, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=stock-report.pdf");

    doc.pipe(res);

    // 🧾 Title
    doc.fontSize(18).text("Stock Report", { align: "center" });
    doc.moveDown();

    // 🧱 Table Header
    const tableTop = 100;
    const colSpacing = [50, 150, 230, 300, 360, 420, 480];

    doc.fontSize(10).text("Product", colSpacing[0], tableTop);
    doc.text("Brand", colSpacing[1], tableTop);
    doc.text("SKU", colSpacing[2], tableTop);
    doc.text("Variant", colSpacing[3], tableTop);
    doc.text("Price", colSpacing[4], tableTop);
    doc.text("Stock", colSpacing[5], tableTop);

    let y = tableTop + 20;

    // 📦 Rows
    data.forEach(item => {
        doc.text(item.productName || "-", colSpacing[0], y);
        doc.text(item.brand || "-", colSpacing[1], y);
        doc.text(item.sku || "-", colSpacing[2], y);
        doc.text(item.variant || "-", colSpacing[3], y);
        doc.text(item.price?.toString() || "-", colSpacing[4], y);
        doc.text(item.stock?.toString() || "-", colSpacing[5], y);

        y += 20;

        // 📄 New page if overflow
        if (y > 750) {
            doc.addPage();
            y = 50;
        }
    });

    doc.end();
});