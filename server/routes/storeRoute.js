import express from 'express';
import { createDarkStore, deleteDarkStore, getAllDarkStore, getNearestStore, updateDarkStore } from '../controllers/darkStoreController.js';
import { isAuth } from '../middlewares/isAuthMiddleware.js';

const storeRoute = express.Router();

storeRoute.post("/nearest", getNearestStore);


storeRoute.get("/", isAuth, getAllDarkStore);
storeRoute.post("/", isAuth, createDarkStore);
storeRoute.patch("/:id",isAuth, updateDarkStore);
storeRoute.delete("/:id",  isAuth, deleteDarkStore);

export default storeRoute;