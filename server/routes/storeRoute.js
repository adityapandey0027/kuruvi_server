import express from 'express';
import { createDarkStore, deleteDarkStore, getAllDarkStore, getNearestStore, updateDarkStore } from '../controllers/darkStoreController.js';
import { isAuth } from '../middlewares/isAuthMiddleware.js';
import { storeLogin } from '../controllers/authController.js';

const storeRoute = express.Router();


// web routes 
storeRoute.post('/login', storeLogin);




// app routes

storeRoute.post("/nearest", getNearestStore);

// dyanamic routes
storeRoute.get("/", isAuth, getAllDarkStore);
storeRoute.post("/", isAuth, createDarkStore);
storeRoute.patch("/:id",isAuth, updateDarkStore);
storeRoute.delete("/:id",  isAuth, deleteDarkStore);

export default storeRoute;