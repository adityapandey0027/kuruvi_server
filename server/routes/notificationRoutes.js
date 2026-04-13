import express from 'express';
import { getNotifications } from '../controllers/notificationController.js';
import { isAdmin, isAuth, isRider, isStoreOwner } from '../middlewares/isAuthMiddleware.js';

const notificationRouter = express.Router();

notificationRouter.get("/user/get", isAuth, getNotifications)
notificationRouter.get("/admin/get", isAdmin, getNotifications)
notificationRouter.get("/store/get", isStoreOwner, getNotifications);
notificationRouter.get("/rider/get", isRider, getNotifications)

notificationRouter.get("/user/read", isAuth, getNotifications)
notificationRouter.get("/admin/read", isAdmin, getNotifications)
notificationRouter.get("/store/read", isStoreOwner, getNotifications);
notificationRouter.get("/rider/read", isRider, getNotifications)

export default notificationRouter;