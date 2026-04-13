export const userSockets = new Map();     // userId → socketId
export const riderSockets = new Map();    // riderId → socketId
export const storeSockets = new Map();    // storeUserId → socketId

export const riderLocations = new Map();  
// riderId → { lat, lng, ts }