import express from 'express';
import { createCategory, deleteCategory, getParentCategories, getParentWithChildren, getSubCategoriesByCategory, updateCategory } from '../controllers/categoryController.js';
import { isAuth } from '../middlewares/isAuthMiddleware.js';

const categoryRoute = express.Router();

// GET routes
categoryRoute.get("/parent", getParentCategories);
categoryRoute.get("/menu", getParentWithChildren);
categoryRoute.get("/:parentId/subcategories", getSubCategoriesByCategory);

// CRUD routes
categoryRoute.post("/", isAuth, createCategory);
categoryRoute.patch("/:id", updateCategory);
categoryRoute.delete("/:id", deleteCategory);

export default categoryRoute;