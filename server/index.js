import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

import { connectDB } from './config/db.js';
import authRouter from './routes/authRoutes.js';
import { errorMiddleware } from './middlewares/errorMiddleware.js';
import categoryRoute from './routes/categoryRoutes.js';
import storeRoute from './routes/storeRoute.js';
import productRoutes from './routes/productRoutes.js';
import inventoryRoute from './routes/inventoryRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import orderRouter from './routes/orderRoutes.js';
import userRoutes from './routes/userRoutes.js';
import riderRouter from './routes/riderRoutes.js';

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://nljg1w4q-5173.inc1.devtunnels.ms",
      "http://43.205.241.171"
    ],
    credentials: true
  })
);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/categories", categoryRoute);
app.use("/api/v1/stores", storeRoute);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/inventories", inventoryRoute);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/riders", riderRouter);

app.get("/", (req, res) => {
  res.send("Server is running");
});

await connectDB();

app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});