import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from "socket.io";

import { connectDB } from './config/db.js';
import { errorMiddleware } from './middlewares/errorMiddleware.js';

// Routes
import authRouter from './routes/authRoutes.js';
import categoryRoute from './routes/categoryRoutes.js';
import storeRoute from './routes/storeRoute.js';
import productRoutes from './routes/productRoutes.js';
import inventoryRoute from './routes/inventoryRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import orderRouter from './routes/orderRoutes.js';
import userRoutes from './routes/userRoutes.js';
import riderRouter from './routes/riderRoutes.js';
import bannerRoute from './routes/bannerRoutes.js';
import homeRoutes from './routes/homeRoutes.js';
import cartRoute from './routes/cartRoutes.js';

const app = express();
const port = process.env.PORT || 8080;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://nljg1w4q-5173.inc1.devtunnels.ms",
      "http://43.205.241.171"
    ],
    credentials: true
  }
});

const userSockets = new Map();
const riderSockets = new Map();
const storeSockets = new Map(); 
io.on("connection", (socket) => {
  try {
    const { userId, role, storeId } = socket.handshake.query;

    if (!userId || !role) {
      socket.disconnect();
      return;
    }

    socket.data.userId = userId;
    socket.data.role = role;
    socket.data.storeId = storeId;

    if (role === "user") {
      userSockets.set(userId, socket.id);
    }

    if (role === "rider") {
      riderSockets.set(userId, socket.id);

      if (storeId) {
        socket.join(`store_${storeId}`);
      }
    }

    if (role === "store") {
      storeSockets.set(userId, socket.id);

      if (storeId) {
        socket.join(`store_${storeId}`);
        console.log(`Store connected: ${storeId}`);
      }
    }

    socket.on("join_order", (orderId) => {
      socket.join(`order_${orderId}`);
    });

    socket.on("update_location", ({ orderId, lat, lng }) => {
      if (!orderId) return;

      io.to(`order_${orderId}`).emit("rider_location_update", {
        orderId,
        lat,
        lng
      });
    });

    socket.on("disconnect", () => {
      const { userId, role } = socket.data;

      if (role === "user") userSockets.delete(userId);
      if (role === "rider") riderSockets.delete(userId);
      if (role === "store") storeSockets.delete(userId);
    });

  } catch (err) {
    console.error("Socket Error:", err);
    socket.disconnect();
  }
});

app.set("io", io);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://nljg1w4q-5173.inc1.devtunnels.ms",
    "http://43.205.241.171"
  ],
  credentials: true
}));

// Routes
app.use("/v1/auth", authRouter);
app.use("/v1/categories", categoryRoute);
app.use("/v1/stores", storeRoute);
app.use("/v1/products", productRoutes);
app.use("/v1/inventories", inventoryRoute);
app.use("/v1/admin", adminRouter);
app.use("/v1/orders", orderRouter);
app.use("/v1/users", userRoutes);
app.use("/v1/riders", riderRouter);
app.use("/v1/banners", bannerRoute);
app.use("/v1/home", homeRoutes); 
app.use("/v1/cart", cartRoute);

// Health check
app.get("/", (req, res) => {
  res.send("Server is running");
});

// DB
await connectDB();

app.use(errorMiddleware);

server.listen(port, () => {
  console.log(`Server running with WebSocket on ${port}`);
});