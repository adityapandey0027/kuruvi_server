import express from 'express';
import { rateLmitOtp } from '../middlewares/rateLimiter.js';
import { adminLogin, login, loginWithOtp, storeLogin } from '../controllers/authController.js';
import { exportStockReport, exportStockReportPDF, getStockReport } from '../controllers/reportController.js';

const reportRoutes = express.Router();

reportRoutes.get("/stock-report/:storeId", getStockReport);      
reportRoutes.get("/stock-report-excel/:storeId", exportStockReport); 
reportRoutes.get("/stock-report-pdf/:storeId", exportStockReportPDF); 
export default reportRoutes;