import express from 'express';
import { getNotifications } from '../controllers/notificationController.js';
import { isAdmin, isAuth, isRider, isStoreOwner } from '../middlewares/isAuthMiddleware.js';
import { getAllPoliciesAdmin, getPolicyAdminDetail, savePolicy } from '../controllers/systemController.js';

const systemRoute = express.Router();

// app routes
systemRoute.get("/user/get", isAuth, getNotifications)

systemRoute.get("/store/get", isStoreOwner, getNotifications);
systemRoute.get("/rider/get", isRider, getNotifications);
systemRoute.get("/policy/all", isAdmin, getAllPoliciesAdmin);
systemRoute.get("/admin/:type/:receiver", isAdmin, getPolicyAdminDetail);
systemRoute.post("/policies/save", isAdmin, savePolicy);


export default systemRoute;