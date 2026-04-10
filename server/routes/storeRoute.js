import express from 'express';
import { createDarkStore, deleteDarkStore, getAllDarkStore, getNearestStore, updateDarkStore } from '../controllers/darkStoreController.js';
import { isAdmin, isAuth, isStoreOwner } from '../middlewares/isAuthMiddleware.js';
import { storeLogin } from '../controllers/authController.js';
import { updateOrderStatus } from '../controllers/orderController.js';

const storeRoute = express.Router();

// app routes
storeRoute.post("/nearest", getNearestStore);


// web routes 
storeRoute.post('/login', storeLogin);
storeRoute.patch("/:id/status-update", isStoreOwner, updateOrderStatus);

// dyanamic routes
storeRoute.get("/", getAllDarkStore);
storeRoute.post("/",isAdmin, createDarkStore);
storeRoute.patch("/:id",isAdmin, updateDarkStore);
storeRoute.delete("/:id", isAdmin, deleteDarkStore);

export default storeRoute;