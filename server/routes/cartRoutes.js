import express from "express";
import { addCartItem, clearCart, getCartItem, removeCartItem, updateCartItem } from "../controllers/cartController.js";
import { isAuth } from "../middlewares/isAuthMiddleware.js";

const cartRoute = express.Router();

//app routes
cartRoute.get("/get",isAuth, getCartItem);
cartRoute.post("/add",isAuth, addCartItem);
cartRoute.put("/update/:variantId", isAuth, updateCartItem);
cartRoute.delete("/remove/:variantId", isAuth, removeCartItem);
cartRoute.delete("/clear", isAuth, clearCart);

export default cartRoute;