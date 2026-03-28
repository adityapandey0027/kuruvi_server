import { errorHandler } from "../utilities/errorHandler.utils.js";
import { asyncHandler } from "../utilities/asyncHandler.utils.js";
import { sendSms } from "../utilities/sendSms.utils.js";
import connection from "../config/redis.js";
import { otpRateKey, redisOTPKey } from "../const/constValue.js";
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import Store from "../models/storeModel.js";
import Admin from "../models/adminModel.js";
import bcrypt from "bcryptjs";

export const loginWithOtp = asyncHandler(async (req, res, next) => {
    const { mobile } = req.body;

    if (!mobile) {
        return next(new errorHandler("Mobile number is required", 400));
    }

    const otp = Math.floor(1000 + Math.random() * 9000);

    // not sent sms for dev
    //await sendSms(mobile, otp);

    // save otp in redis
    const otpKey = `${redisOTPKey}:${mobile}`;
    const rateKey = `${otpRateKey}:${mobile}`;

    connection.set(otpKey, otp, "EX", 600);
    connection.set(rateKey, 1, "EX", 120);

    res.status(200).json({
        success: true,
        message: "OTP send successfully",
        otp
    })

})

export const login = asyncHandler(async (req, res, next) => {
    const { mobile, otp } = req.body;

    if (!mobile) {
        return next(new errorHandler("Mobile number is required", 400));
    }

    const otpKey = `${redisOTPKey}:${mobile}`;
    const rateKey = `${otpRateKey}:${mobile}`;

    const savedOtp = await connection.get(otpKey);

    if (!savedOtp || otp.toString() !== savedOtp) {
        return next(new errorHandler("Wrong OTP", 400));
    }

    let user = await User.findOne({ mobile: mobile });

    if (!user) {
        user = await User.create({
            mobile: mobile,
            role: "user"
        })
    }
    const jwtEx = process.env.JWT_EXPIRES || "30d"

    const token = await jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: jwtEx
    })
    connection.del(otpKey);

    res.status(200).json({
        success: true,
        message: "User login successful",
        user,
        token
    })
})

export const adminLogin = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new errorHandler("Email and password are required", 400));
    }

    const admin = await Admin.findOne({ email: email });

    if (!admin) {
        return next(new errorHandler("Admin not found", 404));
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
        return next(new errorHandler("Invalid credentials", 401));
    }

    const jwtEx = process.env.JWT_EXPIRES || "30d"

    const token = await jwt.sign({ _id: admin._id, role: admin.role }, process.env.JWT_SECRET, {
        expiresIn: jwtEx
    })
    admin.password = undefined;

    res.status(200).json({
        success: true,
        message: "Admin login successful",
        user: admin,
        token
    })
})

export const storeLogin = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new errorHandler("Email and password are required", 400));
    }

    const store = await Store.findOne({ email: email });

    if (!store) {
        return next(new errorHandler("Store not found", 404));
    }

    const isMatch = await store.matchPassword(password);

    if (!isMatch) {
        return next(new errorHandler("Invalid credentials", 401));
    }

    const jwtEx = process.env.JWT_EXPIRES || "30d"

    const token = await jwt.sign({ _id: store._id, role: "store" }, process.env.JWT_SECRET, {
        expiresIn: jwtEx
    })

    res.status(200).json({
        success: true,
        message: "Store login successful",
        store,
        token
    })
})




