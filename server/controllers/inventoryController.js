import { errorHandler } from "../utilities/errorHandler.utils.js";
import { asyncHandler } from "../utilities/asyncHandler.utils.js";
import Inventory from "../models/inventoryModel.js"
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