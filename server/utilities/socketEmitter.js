import {
  riderSockets,
  riderLocations,
  getRiderSocket,
  getRiderLocation
} from "../socketStore.js";

import Store from "../models/storeModel.js";
import { getDistance } from "./distanceCal.utils.js";

export const emitNewOrder = async ({ io, order, itemsCount }) => {
  try {
    const storeId = order.storeId;

    const populatedOrder = await order.populate([
      { path: "userId", select: "name" },
      { path: "storeId" },
      { path: "addressId" }
    ]);

    console.log(`📢 Emitting order ${populatedOrder.orderId}`);

    // 🔹 emit to store
    io.to(`store_${storeId}`).emit("new_order", {
      success: true,
      data: populatedOrder
    });

    const store = populatedOrder.storeId;

    if (!store?.location?.coordinates) {
      console.log("❌ Store location missing");
      return;
    }

    const [storeLng, storeLat] = store.location.coordinates;
    const MAX_DISTANCE = 50;

    // ⚡ Step 1: combine rider IDs (Map + Redis fallback)
    const riderIds = new Set([
      ...riderSockets.keys(),
      ...riderLocations.keys()
    ]);

    console.log(`🧠 Total riders to check: ${riderIds.size}`);

    for (const riderId of riderIds) {
      // 🔹 get location (Map → Redis fallback)
      const riderLoc =
        riderLocations.get(riderId) ||
        (await getRiderLocation(riderId));

      if (!riderLoc) {
        continue;
      }

      // 🔹 skip stale riders (>60s)
      if (Date.now() - riderLoc.ts > 60000) {
        continue;
      }

      if (
        typeof riderLoc.lat !== "number" ||
        typeof riderLoc.lng !== "number"
      ) {
        continue;
      }

      const distance = getDistance(
        storeLat,
        storeLng,
        riderLoc.lat,
        riderLoc.lng
      );

      // 🔹 quick filter
      if (distance > MAX_DISTANCE) continue;

      // 🔹 get socket (Map → Redis fallback)
      let socketId =
        riderSockets.get(riderId) ||
        (await getRiderSocket(riderId));

      if (!socketId) continue;

      const socket = io.sockets.sockets.get(socketId);
      if (!socket) continue;

      console.log(
        `✅ Rider ${riderId} (${distance.toFixed(2)} km)`
      );

      socket.emit("new_order", {
        success: true,
        data: populatedOrder
      });
    }
  } catch (error) {
    console.error("❌ emitNewOrder error:", error);
  }
};