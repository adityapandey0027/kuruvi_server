
import connection from "./config/redis.js";

export const userSockets = new Map();     // userId → socketId
export const riderSockets = new Map();    // riderId → socketId
export const storeSockets = new Map();    // storeUserId → socketId

export const riderLocations = new Map();  
// riderId → { lat, lng, ts }

export const setRiderSocket = async (riderId, socketId) => {
  riderSockets.set(riderId, socketId);

  await connection.set(`rider:${riderId}`, socketId);
};

export const setRiderLocation = async (riderId, location) => {
  const data = {
    ...location,
    ts: Date.now(),
  };

  riderLocations.set(riderId, data);

  await connection.set(
    `rider_location:${riderId}`,
    JSON.stringify(data)
  );
};

export const getRiderSocket = async (riderId) => {
  let socketId = riderSockets.get(riderId);
  if (socketId) return socketId;

  socketId = await connection.get(`rider:${riderId}`);
  if (!socketId) return null;

  riderSockets.set(riderId, socketId);
  return socketId;
};

export const getRiderLocation = async (riderId) => {
  // 🔹 1. try in-memory (fast path)
  let loc = riderLocations.get(riderId);
  if (loc) return loc;

  // 🔹 2. fallback to Redis
  const data = await connection.get(`rider_location:${riderId}`);
  if (!data) return null;

  try {
    loc = JSON.parse(data);

    // 🔹 validate structure
    if (
      typeof loc.lat !== "number" ||
      typeof loc.lng !== "number"
    ) {
      console.log(`❌ Invalid location data for rider ${riderId}`, loc);
      return null;
    }

    // 🔹 rehydrate memory cache
    riderLocations.set(riderId, loc);

    return loc;
  } catch (err) {
    console.log(`❌ Failed to parse location for rider ${riderId}`);
    return null;
  }
};

export const removeRider = async (riderId) => {
  riderSockets.delete(riderId);
  riderLocations.delete(riderId);

  await connection.del(`rider:${riderId}`);
  await connection.del(`rider_location:${riderId}`);
};