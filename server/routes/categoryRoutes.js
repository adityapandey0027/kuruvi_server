import express from 'express';
import { createCategory, deleteCategory, getDropdownCategories, getParentCategories, getParentWithChildren, getSubCategoriesByCategory, updateCategory } from '../controllers/categoryController.js';
import { isAuth } from '../middlewares/isAuthMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const categoryRoute = express.Router();

// GET routes
categoryRoute.get("/parent", getParentCategories);
categoryRoute.get("/menu", getParentWithChildren);
categoryRoute.get("/:parentId/subcategories", getSubCategoriesByCategory);
categoryRoute.get("/search", getDropdownCategories);


// CRUD routes
categoryRoute.post("/", upload.single('image'), createCategory);

categoryRoute.put("/:id", upload.single('image'), updateCategory);
categoryRoute.delete("/:id", deleteCategory);

export default categoryRoute;