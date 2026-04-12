import express from 'express';
import { isAdmin } from '../middlewares/isAuthMiddleware.js';

import { getContactConfig, saveContactConfig } from '../controllers/contactController.js';

const contactRoute = express.Router();


contactRoute.post("/config", isAdmin, saveContactConfig);
contactRoute.get("/config", getContactConfig);

export default contactRoute;