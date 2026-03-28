import express from 'express';
import { adminLogin } from '../controllers/authController.js';

const adminRouter = express.Router();

adminRouter.post('/login', adminLogin);


export default adminRouter;