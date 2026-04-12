import express from 'express';
import { adminLogin } from '../controllers/authController.js';
import { isAdmin } from '../middlewares/isAuthMiddleware.js';
import { getAllCustomers, getCustomerDetails } from '../controllers/userController.js';
import { getAdminProfile } from '../controllers/adminController.js';
import { getAllRiders } from '../controllers/riderController.js';
import { getDeliveryConfig, saveDeliveryConfig } from '../controllers/deliveryController.js';

const deliveryConfigRoutes = express.Router();

deliveryConfigRoutes.get("/config",isAdmin, getDeliveryConfig);
deliveryConfigRoutes.post("/config",isAdmin, saveDeliveryConfig);
export default deliveryConfigRoutes;