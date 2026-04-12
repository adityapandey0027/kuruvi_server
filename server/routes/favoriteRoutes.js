import express from 'express';
import { createBrandBanner, createHomeFirstBanner, deleteBrandBanner, deleteHomeFirstBanner, getAllBrandBanners, getBrandBannerByUsers, getFirstHomeBanners, getFirstHomeBannersViaWeb, toggleHomeFirstBannerStatus, toggleStatusBrandBanner, updateHomeFirstBanner } from '../controllers/bannerController.js';
import upload from '../middlewares/uploadMiddleware.js';
import { isAdmin, isAuth } from '../middlewares/isAuthMiddleware.js';
import { addFavorite, getFavorites, removeFavorite, toggleFavorite } from '../controllers/favoriteController.js';

const favoriteRoute = express.Router();

favoriteRoute.post("/:storeId/add", isAuth, addFavorite);
favoriteRoute.delete("/:storeId/:variantId",isAuth, removeFavorite);
favoriteRoute.put("/:storeId/:variantId", isAuth, toggleFavorite);
favoriteRoute.get("/:storeId/all", isAuth, getFavorites);

export default favoriteRoute;