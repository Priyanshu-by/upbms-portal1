const mongoose = require("mongoose");

let isConnecting = false;

/**
 * Checks if MongoDB is currently connected.
 * readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
 */
function isDbConnected() {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

/**
 * Returns descriptive status of MongoDB connection.
 */
function getDbStatus() {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
  };
  const stateCode = mongoose.connection ? mongoose.connection.readyState : 0;
  return {
    connected: stateCode === 1,
    status: states[stateCode] || "unknown",
    hasUriConfigured: Boolean(process.env.MONGODB_URI || process.env.MONGO_URI),
  };
}

/**
 * Connects to MongoDB when MONGODB_URI is provided.
 * If MONGODB_URI is absent, it logs a clear status and leaves DB disconnected
 * (ready for Atlas connection string later without code changes).
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri || !uri.trim()) {
    console.warn("⚠️  [MongoDB] MONGODB_URI is not set in backend/.env.");
    console.warn("ℹ️  [MongoDB] Database is currently DISCONNECTED. The server will start, but MongoDB operations will return a clear configuration prompt until MONGODB_URI is added.");
    return null;
  }

  if (isDbConnected() || isConnecting) {
    return mongoose.connection;
  }

  try {
    isConnecting = true;
    console.log("🔄 [MongoDB] Connecting to MongoDB Atlas / URI...");
    const conn = await mongoose.connect(uri.trim(), {
      serverSelectionTimeoutMS: 5000,
    });
    isConnecting = false;
    console.log(`✅ [MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    isConnecting = false;
    console.error("❌ [MongoDB] Connection error:", error.message);
    return null;
  }
}

// Global connection event hooks
mongoose.connection.on("connected", () => {
  console.log("📡 [MongoDB] Mongoose event: connected");
});

mongoose.connection.on("error", (err) => {
  console.error("⚠️ [MongoDB] Mongoose connection error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ [MongoDB] Mongoose event: disconnected");
});

module.exports = {
  connectDB,
  isDbConnected,
  getDbStatus,
};
