import express from 'express';
import { isAdmin, isAuth } from '../middlewares/isAuthMiddleware.js';
import { createProduct, createVariant, getProducts, getProductById, getProductWithVariantById, getAllProducts, getVarauriantsBySearch, editProduct, deleteProduct, getAllProductInApp, getProductByCategoryGroup, addSuggestionForAdmin } from '../controllers/productController.js';
import upload from '../middlewares/uploadMiddleware.js';

const productRoutes = express.Router();

// app routes
productRoutes.get("/:storeId/view-products", getAllProductInApp);
productRoutes.get("/:storeId/products-cats", getProductByCategoryGroup);

productRoutes.post("/variant", isAuth, upload.array('image', 6), createVariant);

productRoutes.get("/:storeId/product-variant/:id", getProductWithVariantById);
// suggest product
productRoutes.post("/user/suggestion", isAuth, addSuggestionForAdmin);

// search and get variant 
productRoutes.get("/variants/search", getVarauriantsBySearch);

productRoutes.get("/all", getAllProducts);

// dyanamic route  for products
productRoutes.get("/", getProducts);
productRoutes.get("/:id", getProductById);
productRoutes.post("/", upload.any(), createProduct);

productRoutes.delete("/:id", isAdmin, deleteProduct);
productRoutes.put("/:id", isAdmin, upload.any(), editProduct);
export default productRoutes;


