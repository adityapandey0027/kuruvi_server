import express from 'express';

const adminRouter = express.Router();

adminRouter.post('/admin/login', adminLogin);


export default adminRouter;