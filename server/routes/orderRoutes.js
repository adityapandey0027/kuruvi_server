import express from "express";
import { 
    createOrder, 
    getOrderDetail, 
    getInhouseOrders,
    createRazorpayOrder,
    updateOrderPaymentStatus,
    getUserAllOrders,
} from "../controllers/orderController.js";
import { isAuth } from '../middlewares/isAuthMiddleware.js';

const orderRouter = express.Router();

orderRouter.post("/create", isAuth, createOrder);
orderRouter.post("/payment/create", isAuth, createRazorpayOrder); 
orderRouter.post("/payment/verify", isAuth, updateOrderPaymentStatus); 
orderRouter.get("/history", isAuth, getUserAllOrders)
orderRouter.get("/inhouse", getInhouseOrders); 
orderRouter.get("/detail/:id", getOrderDetail);

export default orderRouter; 