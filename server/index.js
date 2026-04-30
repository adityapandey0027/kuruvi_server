import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from "socket.io";

import { connectDB } from './config/db.js';
import { errorMiddleware } from './middlewares/errorMiddleware.js';
import connection from "./config/redis.js";

import {
  userSockets,
  riderSockets,
  storeSockets,
  setRiderSocket,
  setRiderLocation,
  removeRider
} from "./socketStore.js";

// routes (same as yours)
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
import deliveryConfigRoutes from './routes/deliveryConfigRoutes.js';
import contactRoute from './routes/contactRoutes.js';
import notificationRouter from './routes/notificationRoutes.js';
import systemRoute from './routes/systemRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

const app = express();
const port = process.env.PORT || 8080;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://nljg1w4q-5173.inc1.devtunnels.ms",
      "http://43.205.241.171:5173"
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
  }
});


// =========================
// 🔌 SOCKET CONNECTION
// =========================
io.on("connection", async (socket) => {
  try {
    const { userId, role, storeId } = socket.handshake.query;

    if (!userId || !role) {
      console.log("❌ Missing userId or role");
      socket.disconnect();
      return;
    }

    socket.data = {
      userId,
      role,
      storeId: storeId || null
    };

    console.log(`🔌 ${role} connected: ${userId}`);

    // =========================
    // 👤 USER
    // =========================
    if (role === "user") {
      userSockets.set(userId, socket.id);

      // Redis backup
      await connection.set(`user:${userId}`, socket.id, { EX: 3600 });

      socket.join(`user_${userId}`);
    }

    // =========================
    // 🛵 RIDER
    // =========================
    if (role === "rider") {
      await setRiderSocket(userId, socket.id);

      socket.on("update_rider_location", async ({ lat, lng }) => {
        if (
          typeof lat !== "number" ||
          typeof lng !== "number" ||
          lat < -90 || lat > 90 ||
          lng < -180 || lng > 180
        ) return;

        console.log(`📍 Rider ${userId}: ${lat}, ${lng}`);

        // saves in Map + Redis (with TTL)
        await setRiderLocation(userId, { lat, lng });
      });
    }

    // =========================
    // 🏪 STORE
    // =========================
    if (role === "store") {
      storeSockets.set(userId, socket.id);

      await connection.set(`store:${userId}`, socket.id, { EX: 3600 });

      if (storeId) {
        socket.join(`store_${storeId}`);
        console.log(`🏪 Store connected: ${storeId}`);
      }
    }

    // =========================
    // 📦 ORDER ROOM
    // =========================
    socket.on("join_order", (orderId) => {
      if (!orderId) return;

      socket.join(`order_${orderId}`);
      console.log(`📦 Joined order room: ${orderId}`);
    });

    // =========================
    // 📍 LIVE TRACKING
    // =========================
    socket.on("update_location", ({ orderId, lat, lng }) => {
      if (!orderId) return;

      io.to(`order_${orderId}`).emit("rider_location_update", {
        orderId,
        lat,
        lng
      });
    });

    // =========================
    // ❌ DISCONNECT
    // =========================
    socket.on("disconnect", async () => {
      const { userId, role } = socket.data;

      console.log(`❌ ${role} disconnected: ${userId}`);

      if (role === "user") {
        userSockets.delete(userId);
        await connection.del(`user:${userId}`);
      }

      if (role === "rider") {
        await removeRider(userId);
      }

      if (role === "store") {
        storeSockets.delete(userId);
        await connection.del(`store:${userId}`);
      }
    });

  } catch (err) {
    console.error("❌ Socket Error:", err.message);
    socket.disconnect();
  }
});


// =========================
// EXPRESS SETUP
// =========================
app.set("io", io);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
  "http://localhost:5173",
  "https://nljg1w4q-5173.inc1.devtunnels.ms",
  "http://43.205.241.171",
  "http://13.202.66.40",
  "https://13.202.66.40",
  "https://dashboard.kuruvikal.in"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      process.env.NODE_ENV === 'development'
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));


// =========================
// ROUTES
// =========================
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
app.use("/v1/delivery", deliveryConfigRoutes);
app.use("/v1/contacts", contactRoute);
app.use("/v1/notifications", notificationRouter);
app.use("/v1/systems", systemRoute);
app.use("/v1/reports", reportRoutes);


// =========================
// HEALTH
// =========================
app.get("/", (req, res) => {
  res.send("Server is running");
});


// =========================
// DB + START
// =========================
await connectDB();

app.use(errorMiddleware);

server.listen(port, () => {
  console.log(`🚀 Server running with WebSocket on ${port}`);
});