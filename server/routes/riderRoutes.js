import express from "express";
import { riderLogin } from "../controllers/authController.js";

const riderRouter = express.Router();

// Define rider-specific routes here
riderRouter.post("/login", riderLogin);



export default riderRouter;