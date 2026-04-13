import express from 'express';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../controllers/notificationController.js';
import { isAdmin, isAuth, isRider, isStoreOwner } from '../middlewares/isAuthMiddleware.js';

const notificationRouter = express.Router();

notificationRouter.get("/user/get", isAuth, getNotifications)
notificationRouter.get("/admin/get", isAdmin, getNotifications)
notificationRouter.get("/store/get", isStoreOwner, getNotifications);
notificationRouter.get("/rider/get", isRider, getNotifications)

notificationRouter.patch("/user/read", isAuth, markAllNotificationsRead)
notificationRouter.patch("/admin/read", isAdmin, markAllNotificationsRead)
notificationRouter.patch("/store/read", isStoreOwner, markAllNotificationsRead);
notificationRouter.patch("/rider/read", isRider, markAllNotificationsRead)

export default notificationRouter;