import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from "socket.io";

import { connectDB } from './config/db.js';
import { errorMiddleware } from './middlewares/errorMiddleware.js';
import {
  userSockets,
  riderSockets,
  storeSockets,
  riderLocations
} from "./socketStore.js";

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
import favoriteRoute from './routes/favoriteRoutes.js';
import couponRoute from './routes/couponRoutes.js';

const app = express();
const port = process.env.PORT || 8080;

// HTTP server
const server = http.createServer(app);

//  Socket.io
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


io.on("connection", (socket) => {
  try {
    const { userId, role, storeId } = socket.handshake.query;

    if (!userId || !role) {
      socket.disconnect();
      return;
    }

    socket.data.userId = userId;
    socket.data.role = role;
    socket.data.storeId = storeId || null;

    //  USER
    if (role === "user") {
      userSockets.set(userId, socket.id);
    }

    // RIDER ( no store room join for riders)
    if (role === "rider") {
      riderSockets.set(userId, socket.id);

      // Rider sends periodic location updates
      socket.on("update_rider_location", ({ lat, lng }) => {
        if (typeof lat !== "number" || typeof lng !== "number") return;

        riderLocations.set(userId, { lat, lng, ts: Date.now() });
      });
    }

    // STORE
    if (role === "store") {
      storeSockets.set(userId, socket.id);

      if (storeId) {
        socket.join(`store_${storeId}`);
        console.log(`Store connected: ${storeId}`);
      }
    }

    //Order tracking room (user + assigned rider)
    socket.on("join_order", (orderId) => {
      if (!orderId) return;
      socket.join(`order_${orderId}`);
    });

    // Live tracking broadcast 
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
      if (role === "rider") {
        riderSockets.delete(userId);
        riderLocations.delete(userId); // cleanup
      }
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
app.use("/v1/favorites", favoriteRoute);
app.use("/v1/coupons", couponRoute);

// Health
app.get("/", (req, res) => {
  res.send("Server is running");
});

// DB
await connectDB();

// Error
app.use(errorMiddleware);

// Start
server.listen(port, () => {
  console.log(`🚀 Server running with WebSocket on ${port}`);
});