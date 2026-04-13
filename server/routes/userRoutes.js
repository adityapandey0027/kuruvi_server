import express from "express";
import { isAuth } from "../middlewares/isAuthMiddleware.js";
import { createUserAddress, createWalletRechargeOrder, deleteUserAddress, deleteUserProfile, getUserAddress, getUserProfile, getWallet, updateUserAddress, updateUserProfile, verifyWalletRecharge } from "../controllers/userController.js";
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

// wallet recharge
userRoutes.post("/wallet/create-order", isAuth, createWalletRechargeOrder);
userRoutes.post("/wallet/verify", isAuth, verifyWalletRecharge);
userRoutes.get("/wallet/balance", isAuth, getWallet);

// address
userRoutes.get("/address", isAuth, getUserAddress);
userRoutes.post("/address", isAuth, createUserAddress);
userRoutes.put("/address/:id", isAuth, updateUserAddress);
userRoutes.delete("/address/:id", isAuth, deleteUserAddress);


export default userRoutes;