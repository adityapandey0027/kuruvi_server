import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utilities/asyncHandler.utils.js';
import { errorHandler } from '../utilities/errorHandler.utils.js';
import User from '../models/userModel.js';
import Admin from '../models/adminModel.js';
import Store from '../models/storeModel.js';
import Rider from '../models/riderModel.js';

export const isAuth = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return next(new errorHandler("Authrization token is missing", 404));
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return next(new errorHandler("Token is required", 404));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
        return next(new errorHandler("Invalid token", 400));

    }

    const user = await User.findById(decoded._id);

    if (!user) {
        return next(new errorHandler("User not found", 404));
    }
    req.user = user;
    next();
});

export const isRider = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return next(new errorHandler("Authrization token is missing", 404));
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return next(new errorHandler("Token is required", 404));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
        return next(new errorHandler("Invalid token", 400));

    }

    const user = await Rider.findById(decoded._id);

    if (!user) {
        return next(new errorHandler("User not found", 404));
    }
    req.user = user;
    next();
});

export const isAdmin = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if(!authHeader) {
        return next(new errorHandler("Authorization token is missing", 404));
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return next(new errorHandler("Token is required", 404));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
        return next(new errorHandler("Invalid token", 400));
    }

    const user = await Admin.findById(decoded._id);

    if (!user) {
        return next(new errorHandler("Admin not found", 404));
    }

    if (!user.role || user.role !== "admin") {
        return next(new errorHandler("Admin access required", 403));
    }

    req.user = user;
    next();
  
});

export const isStoreOwner = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if(!authHeader) {
        return next(new errorHandler("Authorization token is missing", 404));
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return next(new errorHandler("Token is required", 404));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
        return next(new errorHandler("Invalid token", 400));
    }

    const user = await Store.findById(decoded._id);

    if (!user) {
        return next(new errorHandler("Store not found", 404));
    }

    if (!user.role || user.role !== "store") {
        return next(new errorHandler("Store owner access required", 403));
    }

    req.user = user;
    next(); 
});
