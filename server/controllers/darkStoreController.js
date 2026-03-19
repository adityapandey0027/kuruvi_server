import { errorHandler } from "../utilities/errorHandler.utils.js";
import { asyncHandler } from "../utilities/asyncHandler.utils.js";
import Store from "../models/storeModel.js";
import bcrypt from "bcrypt";

export const createDarkStore = asyncHandler(async (req, res, next) => {

    const { name, city, lat, lng, serviceRadius, email, password } = req.body;

    if (!name || !city || !lat || !lng || !serviceRadius || !email || !password) {
        return next(new errorHandler("All fields are required", 400));
    }

    const existingStore = await Store.findOne({ email });

    if (existingStore) {
        return next(new errorHandler("Email already exists", 400));
    }

    const location = {
        type: "Point",
        coordinates: [Number(lng), Number(lat)]
    };
    const hashedPassword = await bcrypt.hash(password, 10);

    const store = await Store.create({
        name,
        city,
        serviceRadius,
        email,
        password: hashedPassword,
        location
    });

    res.status(201).json({
        success: true,
        message: "Dark store created successfully",
        data : store
    });

});

export const getAllDarkStore = asyncHandler(async(req, res, next)=>{

    const stores = await Store.find({}).select("-password");

    res.status(200).json({
        success : true,
        message : "Store fetched successfully",
        data : stores
    })
})

export const updateDarkStore = asyncHandler(async (req, res, next) => {

    const { name, serviceRadius } = req.body;
    const storeId = req.params.id;

    const store = await Store.findById(storeId);

    if (!store) {
        return next(new errorHandler("Store not found", 404));
    }

    if (name !== undefined) {
        store.name = name;
    }

    if (serviceRadius !== undefined) {
        store.serviceRadius = serviceRadius;
    }

    await store.save();

    res.status(200).json({
        success: true,
        message: "Store updated successfully",
        data: store
    });

});


export const deleteDarkStore = asyncHandler(async (req, res, next) => {

    const { id } = req.params;

    const store = await Store.findByIdAndDelete(id);

    if (!store) {
        return next(new errorHandler("Store not found", 404));
    }

    res.status(200).json({
        success: true,
        message: "Store deleted successfully"
    });

});





export const getNearestStore = asyncHandler(async (req, res, next) => {

    const { lat, lng } = req.body;

    if (!lat || !lng) {
        return next(new errorHandler("Latitude and longitude are required", 400));
    }

    const store = await Store.findOne({
        isActive: true,
        location: {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: [lng, lat]
                }
            }
        }
    }).select("name location serviceRadius email")
        .lean();

    if (!store) {
        return next(new errorHandler("No store found nearby", 404));
    }

    const distance = getDistance(
        lat,
        lng,
        store.location.coordinates[1],
        store.location.coordinates[0]
    );

    if (distance > store.serviceRadius) {
        return next(new errorHandler("Service not available in your area", 400));
    }

    const eta = calculateETA(distance);

    res.status(200).json({
        success: true,
        data: {
            store,
            distance: `${distance.toFixed(2)} km`,
            eta
        }
    });

});

// constant function
const getDistance = (lat1, lon1, lat2, lon2) => {

    const R = 6371;

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

const calculateETA = (distance) => {

    const avgSpeed = 20;

    const etaMinutes = Math.ceil((distance / avgSpeed) * 60);

    return `${etaMinutes} minutes`;
};

