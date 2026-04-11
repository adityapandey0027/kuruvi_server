import express from "express";
import { isAuth } from "../middlewares/isAuthMiddleware.js";
import { createUserAddress, deleteUserAddress, deleteUserProfile, getUserAddress, getUserProfile, updateUserAddress, updateUserProfile } from "../controllers/userController.js";
import { addCartItem, clearCart, getCartItem, removeCartItem } from "../controllers/cartController.js";
import upload from '../middlewares/uploadMiddleware.js';

const userRoutes = express.Router();

userRoutes.get("/profile", isAuth, getUserProfile);
userRoutes.put("/profile", isAuth, upload.single("image"), updateUserProfile);
userRoutes.delete("/profile", isAuth, deleteUserProfile);

// cart routes
userRoutes.get("/cart", isAuth, getCartItem);
userRoutes.post("/cart/add", isAuth, addCartItem);
userRoutes.post("/cart/remove", isAuth, removeCartItem);
userRoutes.post("/cart/clear", isAuth, clearCart);

// address
userRoutes.get("/address", isAuth, getUserAddress);
userRoutes.post("/address", isAuth, createUserAddress);
userRoutes.put("/address/:id", isAuth, updateUserAddress);
userRoutes.delete("/address/:id", isAuth, deleteUserAddress);


export default userRoutes;