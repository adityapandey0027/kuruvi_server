import Cart from "../models/cartModel.js";
import Inventory from "../models/inventoryModel.js";
import { asyncHandler } from "../utilities/asyncHandler.utils.js";
import { errorHandler } from "../utilities/errorHandler.utils.js";

export const getCartItem = asyncHandler(async (res, res, next) => {
    const userId = req.params.id;

    const cart = Cart.findOne({userId});

    if(!cart){
        return res.status(200).json({
            success : true,
            data : []
        })
    }

    const variantIds = Cart.items.map(item => item.variantId);

    const inventories =await Inventory.find({
        storeId : cart.storeId,
        variantId : {$in : variantIds}
    }).lean();

    const inventoryMap = {};
    inventories.forEach((inv)=>{
        inventoryMap[inv.variantId.toString()] = inv;
    })

    const result = cart.items.map(item)

})


export const addCartItem = asyncHandler(async( req, res, next)=>{

})