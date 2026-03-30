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
            data: []
        });
    }

    const variantIds = cart.items.map(item => item.variantId);

    const inventories = await Inventory.find({
        storeId: cart.storeId,
        variantId: { $in: variantIds }
    }).lean();

    const inventoryMap = {};
    inventories.forEach(inv => {
        inventoryMap[inv.variantId.toString()] = inv;
    });

    const result = cart.items.map(item => {
        const inv = inventoryMap[item.variantId.toString()];

        return {
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price,
            stock: inv?.stock || 0,
            inStock: inv?.stock >= item.quantity
        };
    });

    res.status(200).json({
        success: true,
        data: result
    });
});

export const addCartItem = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const { storeId, variantId, quantity } = req.body;

    const variant = await Variant.findById(variantId);
    if (!variant) {
        return next(new errorHandler("Invalid product", 400));
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
        cart = await Cart.create({
            userId,
            storeId,
            items: [{
                variantId,
                quantity,
                price: variant.price
            }]
        });
    } else {
       
        if (cart.storeId.toString() !== storeId) {
            return next(new errorHandler("Cart contains items from another store", 400));
        }

        const itemIndex = cart.items.findIndex(
            item => item.variantId.toString() === variantId
        );

        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += quantity;
        } else {
            cart.items.push({
                variantId,
                quantity,
                price: variant.price
            });
        }

        await cart.save();
    }

    res.status(200).json({
        success: true,
        data: cart
    });
});

export const removeCartItem = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const { variantId } = req.body;

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

    await Cart.findOneAndUpdate(
        { userId },
        { items: [] }
    );

    res.status(200).json({
        success: true,
        message: "Cart cleared"
    });
});