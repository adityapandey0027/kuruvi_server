import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

import { connectDB } from './config/db.js';
import authRouter from './routes/authRoutes.js';
import { errorMiddleware } from './middlewares/errorMiddleware.js';
import categoryRoute from './routes/categoryRoutes.js';

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: ["http://localhost:3000"],
  credentials: true
}));

app.use("/api/auth", authRouter);
app.use("/api/categories", categoryRoute);

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.use(errorMiddleware);

const startServer = async () => {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error("Server failed to start:", error);
    process.exit(1);
  }
};

startServer();