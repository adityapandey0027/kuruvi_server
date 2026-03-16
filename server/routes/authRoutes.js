import express from 'express';
import { rateLmitOtp } from '../middlewares/rateLimiter.js';
import { login, loginWithOtp } from '../controllers/authController.js';

const authRouter = express.Router();

authRouter.post('/send-otp', rateLmitOtp, loginWithOtp);
authRouter.post('/login', login);


export default authRouter;