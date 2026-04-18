import Cart from "../models/cartModel.js";
import Inventory from "../models/inventoryModel.js";
import Variant from "../models/variantModel.js";
import { asyncHandler } from "../utilities/asyncHandler.utils.js";
import { errorHandler } from "../utilities/errorHandler.utils.js";

export const getCartItem = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;

    const cart = await Cart.findOne({ userId }).lean();

    if (!cart || cart.items.length === 0) {
        return res.status(200).json({
            success: true,
            data: [],
            summary: {
                totalItems: 0,
                subtotal: 0,
                totalMRP: 0,
                totalDiscount: 0
            }
        });
    }

    const variantIds = cart.items.map(i => i.variantId);

    const data = await Inventory.aggregate([
        {
            $match: {
                storeId: cart.storeId,
                variantId: { $in: variantIds }
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
        { $unwind: "$product" }
    ]);

    const map = {};
    data.forEach(d => {
        map[d.variantId.toString()] = d;
    });

    let totalItems = 0;
    let subtotal = 0;
    let totalMRP = 0;

    const result = cart.items.map(item => {
        const d = map[item.variantId.toString()];
        if (!d) {
            return {
                variantId: item.variantId,
                quantity: item.quantity,
                isAvailable: false
            };
        }

        const price = d.price;
        const mrp = d.variant?.mrp || 0;
        const quantity = item.quantity;

        totalItems += quantity;
        subtotal += price * quantity;
        totalMRP += mrp * quantity;

        return {
            variantId: item.variantId,
            quantity,
            price,
            mrp,
            name: d.product?.name,
            brand: d.product?.brand,
            size: d.variant?.size,
            unit: d.variant?.unit,
            image: d.variant?.images?.[0]?.url,
            stock: d.stock || 0,
            inStock: d.stock >= quantity,

            // Important flags
            priceChanged: item.price !== price,
            isAvailable: true
        };
    });

    const totalDiscount = totalMRP - subtotal;

    res.status(200).json({
        success: true,
        data: result,
        summary: {
            totalItems,
            subtotal,
            totalMRP,
            totalDiscount
        }
    });
});

export const addCartItem = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const { storeId, variantId } = req.body;

    const quantity = 1;

    const inventory = await Inventory.findOne({
        storeId,
        variantId,
        isAvailable: true
    });

    if (!inventory) {
        return next(new errorHandler("Product not available in this store", 400));
    }

    if (inventory.stock < 1) {
        return next(new errorHandler("Out of stock", 400));
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
        cart = await Cart.create({
            userId,
            storeId,
            items: [{
                variantId,
                quantity: 1,
                price: inventory.price
            }]
        });
    } else {

        if (cart.storeId.toString() !== storeId.toString()) {

            //  Clear old cart & replace with new store
            cart.storeId = storeId;
            cart.items = [{
                variantId,
                quantity: 1,
                price: inventory.price
            }];

            await cart.save();

            return res.status(200).json({
                success: true,
                message: "Cart reset for new store",
                data: cart
            });
        }

        const index = cart.items.findIndex(
            item => item.variantId.toString() === variantId.toString()
        );

        if (index > -1) {
            const newQty = cart.items[index].quantity + 1;

            if (newQty > inventory.stock) {
                return next(new errorHandler("Exceeds available stock", 400));
            }

            cart.items[index].quantity = newQty;
        } else {
            cart.items.push({
                variantId,
                quantity: 1,
                price: inventory.price
            });
        }

        await cart.save();
    }

    res.status(200).json({
        success: true,
        data: cart
    });
});

export const updateCartItem = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const { variantId } = req.params;
    const { action } = req.body;

    if (!["increment", "decrement"].includes(action)) {
        return next(new errorHandler("Invalid action", 400));
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
        return next(new errorHandler("Cart not found", 404));
    }

    const itemIndex = cart.items.findIndex(
        item => item.variantId.toString() === variantId
    );

    if (itemIndex === -1) {
        return next(new errorHandler("Item not in cart", 404));
    }

    const item = cart.items[itemIndex];

    const inventory = await Inventory.findOne({
        storeId: cart.storeId,
        variantId,
        isAvailable: true
    });

    if (!inventory) {
        return next(new errorHandler("Product not available", 400));
    }

    if (action === "increment") {
        if (item.quantity + 1 > inventory.stock) {
            return next(new errorHandler("Exceeds available stock", 400));
        }
        item.quantity += 1;
    }

    if (action === "decrement") {
        item.quantity -= 1;

        if (item.quantity <= 0) {
            cart.items.splice(itemIndex, 1);
        }
    }

    await cart.save();

    res.status(200).json({
        success: true,
        data: cart
    });
});

export const removeCartItem = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const { variantId } = req.params;

    const cart = await Cart.findOne({ userId });

    if (!cart) {
        return next(new errorHandler("Cart not found", 404));
    }

    cart.items = cart.items.filter(
        item => item.variantId.toString() !== variantId
    );

    await cart.save();

    res.status(200).json({
        success: true,
        data: cart
    });
});


export const clearCart = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;

    const cart = await Cart.findOneAndUpdate(
        { userId },
        { $set: { items: [] } },
        { returnDocument: "after" }
    );

    if (!cart) {
        return next(new errorHandler("Cart not found", 404));
    }

    res.status(200).json({
        success: true,
        message: "Cart cleared",
        data: cart
    });
});