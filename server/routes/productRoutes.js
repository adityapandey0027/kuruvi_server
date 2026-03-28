import express from 'express';
import { isAuth } from '../middlewares/isAuthMiddleware.js';
import { createProduct, createVariant, getProducts, getProductById, getProductWithVariantById, getAllProducts } from '../controllers/productController.js';
import upload from '../middlewares/uploadMiddleware.js';

const productRoutes = express.Router();

productRoutes.post("/variant", isAuth,upload.array('image', 6), createVariant);

productRoutes.get("/product-variant/:id", getProductWithVariantById);

productRoutes.get("/all", getAllProducts);

// dyanamic route  for products
productRoutes.get("/", getProducts);
productRoutes.get("/:id", getProductById);
productRoutes.post("/", upload.any(), createProduct);
export default productRoutes;