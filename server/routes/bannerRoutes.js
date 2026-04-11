import express from 'express';
import { createBrandBanner, createHomeFirstBanner, deleteBrandBanner, deleteHomeFirstBanner, getAllBrandBanners, getBrandBannerByUsers, getFirstHomeBanners, getFirstHomeBannersViaWeb, toggleHomeFirstBannerStatus, toggleStatusBrandBanner, updateHomeFirstBanner } from '../controllers/bannerController.js';
import upload from '../middlewares/uploadMiddleware.js';
import { isAdmin } from '../middlewares/isAuthMiddleware.js';

const bannerRoute = express.Router();

//app routes
bannerRoute.get("/home/first", getFirstHomeBanners);
bannerRoute.get("/home/brand", getBrandBannerByUsers);

//web routes
bannerRoute.get("/brand/all",isAdmin, getAllBrandBanners);
bannerRoute.post("/brand",upload.single('image'),  isAdmin, createBrandBanner);
bannerRoute.delete("/brand/:id", isAdmin, deleteBrandBanner);
bannerRoute.patch("/brand/status/:id", isAdmin, toggleStatusBrandBanner);

bannerRoute.get("/home/all", getFirstHomeBannersViaWeb);
bannerRoute.post("/add",upload.single("image"), isAdmin, createHomeFirstBanner);
bannerRoute.put("/:id", upload.single("image"), isAdmin, updateHomeFirstBanner);
bannerRoute.delete("/:id", isAdmin, deleteHomeFirstBanner)
bannerRoute.patch("/:id/status", isAdmin, toggleHomeFirstBannerStatus);

export default bannerRoute;