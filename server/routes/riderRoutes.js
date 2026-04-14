import express from "express";
import { riderLogin, riderRegister, sendRiderOtp } from "../controllers/authController.js";
import { updateOrderStatus } from "../controllers/orderController.js";
import { isAdmin, isRider } from "../middlewares/isAuthMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";
import { getAvailableRidersViaAdmin } from "../controllers/riderController.js";

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

riderRouter.patch("/:id/status-update",isRider, updateOrderStatus);
riderRouter.get("/available", isAdmin, getAvailableRidersViaAdmin);


export default riderRouter;