import express from "express";
import { riderLogin } from "../controllers/authController.js";
import { updateOrderStatus } from "../controllers/orderController.js";
import { isAdmin, isRider } from "../middlewares/isAuthMiddleware.js";
import { getAvailableRiders } from "../controllers/riderController.js";

const riderRouter = express.Router();

// app routes for rider
riderRouter.post("/login", riderLogin);
riderRouter.patch("/:id/status-update",isRider, updateOrderStatus);
riderRouter.get("/available", isAdmin, getAvailableRiders);


export default riderRouter;