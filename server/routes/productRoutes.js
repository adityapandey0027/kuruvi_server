import express from 'express';
import { isAuth } from '../middlewares/isAuthMiddleware.js';
import { createProduct, createVariant, getProducts, getProductById, getProductWithVariantById } from '../controllers/productController.js';

const productRoutes = express.Router();

productRoutes.post("/variant", isAuth, createVariant);

productRoutes.get("/product-variant/:id", getProductWithVariantById);

// dyanamic route  for products
productRoutes.get("/", getProducts);
productRoutes.get("/:id", getProductById);
productRoutes.post("/", isAuth, createProduct);

export default productRoutes;