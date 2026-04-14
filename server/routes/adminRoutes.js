import express from 'express';
import { adminLogin } from '../controllers/authController.js';
import { isAdmin } from '../middlewares/isAuthMiddleware.js';
import { getAllCustomers, getCustomerDetails } from '../controllers/userController.js';
import { assignRiderForOrder, getAdminProfile, updateRiderStatus } from '../controllers/adminController.js';
import { getAllRiders, getRiderDetails } from '../controllers/riderController.js';

const adminRouter = express.Router();

adminRouter.post('/login', adminLogin);
adminRouter.get("/profile", isAdmin, getAdminProfile);


// Customer management routes
adminRouter.get("/customers/all", isAdmin, getAllCustomers);
adminRouter.get("/customers/details/:id", isAdmin, getCustomerDetails);

// rider management routes 
adminRouter.get("/riders/all", isAdmin, getAllRiders);
adminRouter.put("/riders/update-status/:id", isAdmin, updateRiderStatus);
adminRouter.get("/riders/details/:id", isAdmin, getRiderDetails);
adminRouter.post("/orders/assign-rider", isAdmin, assignRiderForOrder);

export default adminRouter;