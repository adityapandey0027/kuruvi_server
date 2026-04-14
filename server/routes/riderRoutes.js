import express from "express";
import { riderLogin, riderRegister, sendRiderOtp } from "../controllers/authController.js";
import { updateOrderStatus } from "../controllers/orderController.js";
import { isAdmin, isRider } from "../middlewares/isAuthMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";
import { acceptOrder, codOrderPaymentCollection, codOrderPaymentVerification, getAcceptedOrders, getAvailableOrders, getAvailableRidersViaAdmin, getRiderCurrentOrder, markDeliverOrder, pickupOrder, verifyDeliveryOtp } from "../controllers/riderController.js";

const riderRouter = express.Router();

// app routes for rider
riderRouter.post("/send-otp", sendRiderOtp);
riderRouter.post("/login", riderLogin);
riderRouter.post(
  "/register",
  upload.fields([
    { name: "profile", maxCount: 1 },
    { name: "aadhaar", maxCount: 1 },
    { name: "dl", maxCount: 1 }
  ]),
  riderRegister
);

riderRouter.get("/orders/available", isRider, getAvailableOrders);
riderRouter.patch("/orders/accept/:id", isRider, acceptOrder);
riderRouter.get("/orders/accepted", isRider, getAcceptedOrders);
riderRouter.patch("/orders/pickup/:id", isRider, pickupOrder);
riderRouter.get("/orders/current-order", isRider, getRiderCurrentOrder);
riderRouter.post("/orders/delivery-otp", isRider, markDeliverOrder);
riderRouter.post("/orders/mark-deliver", isRider, verifyDeliveryOtp);

riderRouter.post("/orders/payment-collect", isRider, codOrderPaymentCollection);
riderRouter.post("/orders/payment-verify", isRider, codOrderPaymentVerification);


riderRouter.patch("/orders/status/:id/",isRider, updateOrderStatus);
riderRouter.get("/available", isAdmin, getAvailableRidersViaAdmin);


export default riderRouter;