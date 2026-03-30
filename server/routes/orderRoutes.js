import express from "express";
import { 
    createOrder, 
    getOrderDetail, 
    getInhouseOrders, // 1. Is naye function ko import karein
    createRazorpayOrder,
    updateOrderPaymentStatus
} from "../controllers/orderController.js";
import { isAuth } from '../middlewares/isAuthMiddleware.js';

const orderRouter = express.Router();


orderRouter.post("/create", isAuth, createOrder);
orderRouter.post("/payment/create", isAuth, createRazorpayOrder); 
orderRouter.post("/payment/verify", isAuth, updateOrderPaymentStatus); 


orderRouter.get("/inhouse", getInhouseOrders); 
orderRouter.get("/detail/:id", getOrderDetail);

export default orderRouter; 