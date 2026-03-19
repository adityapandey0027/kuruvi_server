import express from 'express';
import { isAuth } from '../middlewares/isAuthMiddleware.js';
import {
  createInventory,
  getStoreProductDetailsById,
  getStoreProducts,
  getStoreProductsByCategory
} from '../controllers/inventoryController.js';

const router = express.Router();

// GET routes
router.get("/:storeId/products", getStoreProducts); 
router.get("/:storeId/products/category", getStoreProductsByCategory);
router.get("/:storeId/products/:productId", getStoreProductDetailsById);
// POST
router.post("/", isAuth, createInventory);

export default router;