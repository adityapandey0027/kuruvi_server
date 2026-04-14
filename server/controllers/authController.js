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
import Rider from "../models/riderModel.js";
import uploadToS3 from "../services/s3Services.js";

export const loginWithOtp = asyncHandler(async (req, res, next) => {
    const { mobile } = req.body;

    if (!mobile) {
        return next(new errorHandler("Mobile number is required", 400));
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(mobile)) {
        return next(new errorHandler("Invalid mobile number", 400));
    }

    const otpKey = `${redisOTPKey}:${mobile}`;
    const rateKey = `${otpRateKey}:${mobile}`;

    const ttl = await connection.ttl(rateKey);

    if (ttl > 0) {
        return res.status(429).json({
            success: false,
            message: `Please wait ${ttl}s before requesting OTP again`
        });
    }

    const otp = Math.floor(1000 + Math.random() * 9000);

    if (process.env.NODE_ENV === "production") {
        await sendSms(mobile, otp);

    }

    await connection.set(otpKey, otp.toString(), "EX", 600);
    await connection.set(rateKey, "1", "EX", 60);


    res.status(200).json({
        success: true,
        message: "OTP sent successfully",

        ...(process.env.NODE_ENV !== "production" && { otp })
    });
});

export const login = asyncHandler(async (req, res, next) => {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
        return next(new errorHandler("Mobile and OTP required", 400));
    }

    const otpKey = `${redisOTPKey}:${mobile}`;

    const savedOtp = await connection.get(otpKey);

    if (!savedOtp) {
        return next(new errorHandler("OTP expired", 400));
    }

    if (otp.toString() !== savedOtp) {
        return next(new errorHandler("Invalid OTP", 400));
    }

    let user = await User.findOne({ mobile });

    if (!user) {
        user = await User.create({
            mobile,
            role: "user"
        });
    }

    const token = jwt.sign(
        { _id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES || "30d" }
    );

    await connection.del(otpKey);

    res.status(200).json({
        success: true,
        message: "User login successful",
        token,
        user: {
            _id: user._id,
            mobile: user.mobile,
            role: user.role
        }
    });
});

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

    const isMatch = await bcrypt.compare(password, store.password);

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
        user: store,
        token
    })
})

export const sendRiderOtp = asyncHandler(async (req, res, next) => {
    const { phone } = req.body;

    if (!phone) {
        return next(new errorHandler("Phone number required", 400));
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
        return next(new errorHandler("Invalid phone number", 400));
    }

    const rider = await Rider.findOne({ phone });

    if (!rider) {
        return next(new errorHandler("Rider not registered", 404));
    }

    if (!rider.isActive) {
        return next(new errorHandler("Account disabled", 403));
    }
     if (!rider.isVerified) {
        return next(new errorHandler("Please wait for admin varification, before loign", 403));
    }

    const otpKey = `rider_otp:${phone}`;
    const rateKey = `rider_otp_rate:${phone}`;

    const ttl = await connection.ttl(rateKey);
    if (ttl > 0) {
        return next(new errorHandler(`Wait ${ttl}s before retry`, 429));
    }

    const otp = Math.floor(1000 + Math.random() * 9000);

    if (process.env.NODE_ENV === "production") {
        await sendSms(mobile, otp);
    }

    await connection.set(otpKey, otp.toString(), "EX", 600);
    await connection.set(rateKey, "1", "EX", 60);

    res.status(200).json({
        success: true,
        message: "OTP sent successfully",
        ...(process.env.NODE_ENV !== "production" && { otp })
    });
});

export const riderLogin = asyncHandler(async (req, res, next) => {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
        return next(new errorHandler("Phone and OTP required", 400));
    }

    const otpKey = `rider_otp:${phone}`;

    const savedOtp = await connection.get(otpKey);

    if (!savedOtp) {
        return next(new errorHandler("OTP expired", 400));
    }

    if (otp.toString() !== savedOtp) {
        return next(new errorHandler("Invalid OTP", 400));
    }

    const rider = await Rider.findOne({ phone });

    if (!rider) {
        return next(new errorHandler("Rider not found", 404));
    }

    if (!rider.isVerified) {
        return next(new errorHandler("Waiting for admin approval", 403));
    }

    if (!rider.isActive) {
        return next(new errorHandler("Account disabled", 403));
    }

    const token = jwt.sign(
        { _id: rider._id, role: rider.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES || "30d" }
    );

    await connection.del(otpKey);

    res.status(200).json({
        success: true,
        message: "Rider login successful",
        token,
        data: {
            _id: rider._id,
            name: rider.name,
            phone: rider.phone,
            status: rider.status,
            role: rider.role
        }
    });
});

export const riderRegister = asyncHandler(async (req, res, next) => {

    const safeParse = (data) => {
        try {
            return typeof data === "string" ? JSON.parse(data) : data;
        } catch {
            return null;
        }
    };

    req.body.address = safeParse(req.body.address);
    req.body.documents = safeParse(req.body.documents);
    req.body.bankDetails = safeParse(req.body.bankDetails);

    const {
        name,
        phone,
        age,
        gender,
        vehicleType,
        address,
        documents,
        bankDetails
    } = req.body;

    if (!name || !phone || !vehicleType) {
        return next(new errorHandler("Name, phone, vehicle type required", 400));
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
        return next(new errorHandler("Invalid phone number", 400));
    }

    if (age && (age < 18 || age > 60)) {
        return next(new errorHandler("Age must be between 18-60", 400));
    }

    if (!["bike", "cycle"].includes(vehicleType)) {
        return next(new errorHandler("Invalid vehicle type", 400));
    }

    const exists = await Rider.findOne({ phone });
    if (exists) {
        return next(new errorHandler("Rider already exists", 400));
    }

    if (!documents?.aadhaarNumber || !documents?.drivingLicenseNumber) {
        return next(new errorHandler("Aadhaar & Driving License required", 400));
    }

    if (!/^\d{12}$/.test(documents.aadhaarNumber)) {
        return next(new errorHandler("Invalid Aadhaar number", 400));
    }

    if (documents.drivingLicenseNumber.length < 8) {
        return next(new errorHandler("Invalid driving license number", 400));
    }

    if (bankDetails) {
        if (!bankDetails.accountNumber || !bankDetails.ifscCode) {
            return next(new errorHandler("Invalid bank details", 400));
        }

        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankDetails.ifscCode)) {
            return next(new errorHandler("Invalid IFSC code", 400));
        }
    }

    if (!req.files?.profile || !req.files?.aadhaar || !req.files?.dl) {
        return next(new errorHandler("All images required (profile, aadhaar, dl)", 400));
    }

    const profileImage = await uploadToS3(req.files.profile[0], "riders/profile");
    const aadhaarImage = await uploadToS3(req.files.aadhaar[0], "riders/aadhaar");
    const dlImage = await uploadToS3(req.files.dl[0], "riders/dl");

    const rider = await Rider.create({
        name,
        phone,
        age,
        gender,
        vehicleType,

        address: {
            fullAddress: address?.fullAddress,
            city: address?.city,
            pincode: address?.pincode
        },

        profileImage,

        documents: {
            aadhaarNumber: documents.aadhaarNumber,
            aadhaarImage,
            drivingLicenseNumber: documents.drivingLicenseNumber,
            drivingLicenseImage: dlImage
        },

        bankDetails: bankDetails ? {
            accountHolderName: bankDetails.accountHolderName,
            accountNumber: bankDetails.accountNumber,
            ifscCode: bankDetails.ifscCode,
            bankName: bankDetails.bankName
        } : undefined,

        status: "OFFLINE",
        isVerified: false
    });

    res.status(201).json({
        success: true,
        message: "Registration submitted. Await admin approval.",
        data: {
            id: rider._id,
            name: rider.name,
            phone: rider.phone,
            status: rider.status
        }
    });
});

const insetAdmin = async () => {
    const name = "Admin";
    const email = "admin@gamil.com";
    const role = "admin";
    const password = "admin123";

    const newAdmin = await Admin.create({
        name,
        email,
        role,
        password: await bcrypt.hash(password, 10)
    })

    console.log("Admin created", newAdmin);
}

// insetAdmin();