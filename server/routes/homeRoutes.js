import express from 'express';
import upload from '../middlewares/uploadMiddleware.js';
import { isAdmin } from '../middlewares/isAuthMiddleware.js';
import { getlowestPricedProducts, getMaxDiscountProducts, getMostShoppedProducts } from '../controllers/homeControllerApi.js';

const homeRoutes = express.Router();

//app routes
homeRoutes.get("/:storeId/most-shopped", getMostShoppedProducts);
homeRoutes.get("/:storeId/lowest-priced", getlowestPricedProducts);
homeRoutes.get("/:storeId/max-discount", getMaxDiscountProducts);
export default homeRoutes;