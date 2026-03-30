import express from "express";
import { isAuth } from "../middlewares/isAuthMiddleware.js";
import { deleteUserProfile, getUserProfile, updateUserProfile } from "../controllers/userController.js";
import { addCartItem, clearCart, getCartItem, removeCartItem } from "../controllers/cartController.js";

const userRoutes = express.Router();

userRoutes.get("/profile", isAuth, getUserProfile);
userRoutes.put("/profile", isAuth, updateUserProfile);
userRoutes.delete("/profile", isAuth, deleteUserProfile);

// cart routes
userRoutes.get("/cart", isAuth, getCartItem);
userRoutes.post("/cart/add", isAuth, addCartItem);
userRoutes.post("/cart/remove", isAuth, removeCartItem);
userRoutes.post("/cart/clear", isAuth, clearCart);

export default userRoutes;