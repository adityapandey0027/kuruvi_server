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

// Routes (same as yours)
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

const app = express();
const port = process.env.PORT || 8080;

const server = http.createServer(app);

const io = new Server(server, {
  origin: [
    "http://localhost:5173",
    "https://nljg1w4q-5173.inc1.devtunnels.ms",
    "http://43.205.241.171:5173"
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true
});

io.on("connection", (socket) => {
  try {
    const { userId, role, storeId } = socket.handshake.query;

    if (!userId || !role) {
      console.log("Missing userId or role");
      socket.disconnect();
      return;
    }

    socket.data = {
      userId,
      role,
      storeId: storeId || null
    };

    console.log(`🔌 ${role} connected: ${userId}`);

    if (role === "user") {
      userSockets.set(userId, socket.id);
       console.log(userId, socket.id);
      socket.join(`user_${userId}`);
    }

    if (role === "rider") {
      riderSockets.set(userId, socket.id);

      socket.on("update_rider_location", ({ lat, lng }) => {
        if (
          typeof lat !== "number" ||
          typeof lng !== "number" ||
          lat < -90 || lat > 90 ||
          lng < -180 || lng > 180
        ) return;

        riderLocations.set(userId, {
          lat,
          lng,
          ts: Date.now()
        });
      });
    }

    if (role === "store") {
      storeSockets.set(userId, socket.id);

      if (storeId) {
        socket.join(`store_${storeId}`);
        console.log(`🏪 Store connected: ${storeId}`);
      }
    }

    socket.on("join_order", (orderId) => {
      if (!orderId) return;

      socket.join(`order_${orderId}`);
      console.log(`📦 Joined order room: ${orderId}`);
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

      console.log(`❌ ${role} disconnected: ${userId}`);

      if (role === "user") userSockets.delete(userId);

      if (role === "rider") {
        riderSockets.delete(userId);
        riderLocations.delete(userId);
      }

      if (role === "store") storeSockets.delete(userId);
    });

  } catch (err) {
    console.error("Socket Error:", err.message);
    socket.disconnect();
  }
});

setInterval(() => {
  const now = Date.now();

  for (const [riderId, loc] of riderLocations.entries()) {
    if (now - loc.ts > 15000) {
      riderLocations.delete(riderId);
    }
  }
}, 10000);

app.set("io", io);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
  "http://localhost:5173",
  "https://nljg1w4q-5173.inc1.devtunnels.ms",
  "http://43.205.241.171"
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Required for cookies/sessions
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Routes (same as yours)
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