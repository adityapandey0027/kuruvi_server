import express from "express";
import { riderLogin } from "../controllers/authController.js";
import { updateOrderStatus } from "../controllers/orderController.js";
import { isRider } from "../middlewares/isAuthMiddleware.js";

const riderRouter = express.Router();

// app routes for rider
riderRouter.post("/login", riderLogin);
riderRouter.patch("/:id/status-update",isRider, updateOrderStatus);



export default riderRouter;