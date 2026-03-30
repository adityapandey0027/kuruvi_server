import express from 'express';
import { createCategory, deleteCategory, getAllCategories, getDropdownCategories, getParentCategories, getParentWithChildren, getSubCategoriesByCategory, updateCategory } from '../controllers/categoryController.js';
import { isAdmin } from '../middlewares/isAuthMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const categoryRoute = express.Router();

// GET routes mobile
categoryRoute.get("/parent", getParentCategories);
categoryRoute.get("/menu", getParentWithChildren);
categoryRoute.get("/:parentId/subcategories", getSubCategoriesByCategory);

categoryRoute.get("/search", getDropdownCategories);

// web listing ke liye
categoryRoute.get("/all", getAllCategories);

// CRUD routes
categoryRoute.post("/",isAdmin, upload.single('image'), createCategory);

categoryRoute.put("/:id", isAdmin, upload.single('image'), updateCategory);
categoryRoute.delete("/:id", isAdmin, deleteCategory);

export default categoryRoute;