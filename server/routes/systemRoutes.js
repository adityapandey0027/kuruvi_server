import express from 'express';
import { createNotification, getNotifications } from '../controllers/notificationController.js';
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

systemRoute.post("/test", isAuth, async (req, res) => {
    await createNotification({
        receiverId: req.user?._id,
        receiverType: "user",
        title: "Order Placed",
        message: "Your order is placed",
        type: "ORDER",
        orderId: "ODFJF"
    });

    res.send("done");
});

export default systemRoute;