import { errorHandler } from "../utilities/errorHandler.utils.js";
import { asyncHandler } from "../utilities/asyncHandler.utils.js";
import connection from "../config/redis.js";
import { otpRateKey, redisOTPKey } from "../const/constValue.js";

export const rateLmitOtp = asyncHandler(async (req, res, next) => {

    const { mobile } = req.body;

    if (!mobile) {
        return res.status(400).json({
            success: false,
            message: "Mobile number is required"
        });
    }

    const otpKey = `${redisOTPKey}:${mobile}`;
    const rateKey = `${otpRateKey}:${mobile}`;

    const isAlreadySend = await connection.get(otpKey);
    const rate = await connection.get(rateKey);

    if ( rate) {
        return res.status(400).json({
            success: false,
            message: "Please wait some time to send again"
        });
    }

    next();
});