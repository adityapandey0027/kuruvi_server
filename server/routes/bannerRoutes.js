import express from 'express';
import { createHomeFirstBanner, deleteHomeFirstBanner, getFirstHomeBanners, getFirstHomeBannersViaWeb, toggleHomeFirstBannerStatus, updateHomeFirstBanner } from '../controllers/bannerController.js';
import upload from '../middlewares/uploadMiddleware.js';
import { isAdmin } from '../middlewares/isAuthMiddleware.js';

const bannerRoute = express.Router();

//app routes
bannerRoute.get("/home/first", getFirstHomeBanners);


//web routes
bannerRoute.get("/home/all", getFirstHomeBannersViaWeb);
bannerRoute.post("/add",upload.single("image"), isAdmin, createHomeFirstBanner);
bannerRoute.put("/:id", upload.single("image"), isAdmin, updateHomeFirstBanner);
bannerRoute.delete("/:id", isAdmin, deleteHomeFirstBanner)
bannerRoute.patch("/:id/status", isAdmin, toggleHomeFirstBannerStatus);
export default bannerRoute;