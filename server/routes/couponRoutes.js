import express from 'express';
import { isAdmin, isAuth } from '../middlewares/isAuthMiddleware.js';
import { createCoupon, deleteCoupon, getAllCouponsByAdmin, getValidCouponViaUser, toggleCouponStatus, updateCoupon } from '../controllers/couponController.js';

const couponRoute = express.Router();

couponRoute.get("/all", isAuth, getValidCouponViaUser);

//web 
couponRoute.get("/admin/all", isAdmin, getAllCouponsByAdmin);
couponRoute.post("/add", isAdmin, createCoupon);
couponRoute.put("/update/:id", isAdmin, updateCoupon);
couponRoute.delete("/delete/:id", isAdmin, deleteCoupon);
couponRoute.patch("/status/:id", isAdmin, toggleCouponStatus);
export default couponRoute;