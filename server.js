// server.js (Fixed)
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Middleware
app.use(cors({
  origin: ["https://majenayu.github.io", "http://localhost:3000"],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ✅ Connect to MongoDB
mongoose.connect("mongodb+srv://ayu:ayu@ayu.cawv7.mongodb.net/drive?retryWrites=true&w=majority")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// ✅ Define Driver Schema
const driverSchema = new mongoose.Schema({
  driverId: { type: String, required: true }, // unique for each driver
  startName: String,
  endName: String,
  startCoords: [Number],
  endCoords: [Number],
  lat: Number,
  lng: Number,
  updatedAt: { type: Date, default: Date.now }
});

// ✅ Helper to sanitize names for collection (remove emoji and normalize)
function sanitizeForCollection(name) {
  // Remove leading emoji (🚌 ) and normalize
  const clean = name.replace(/^🚌\s*/, '').trim();
  return clean.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '');
}

// This function gets the correct model (collection) dynamically
function getRouteModel(startName, endName) {
  const sanitizedStart = sanitizeForCollection(startName);
  const sanitizedEnd = sanitizeForCollection(endName);
  const collectionName = `${sanitizedStart}_${sanitizedEnd}`;
  console.log(`Using collection: ${collectionName}`); // Debug log
  return mongoose.models[collectionName] || mongoose.model(collectionName, driverSchema, collectionName);
}

// ✅ API: Update driver location
app.post("/update-location", async (req, res) => {
  try {
    const { driverId, startName, endName, startCoords, endCoords, lat, lng } = req.body;
    if (!driverId || !startName || !endName || !lat || !lng) {
      return res.status(400).json({ error: "Missing required parameters" });
    }
    const RouteModel = getRouteModel(startName, endName);
    const result = await RouteModel.findOneAndUpdate(
      { driverId },
      {
        driverId,
        startName,
        endName,
        startCoords,
        endCoords,
        lat,
        lng,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );
    console.log(`Updated/Upserted driver ${driverId} in collection ${RouteModel.collection.name}`); // Debug log
    res.json({ message: "✅ Driver location updated successfully" });
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ API: Get all active drivers on a route
app.get("/get-drivers", async (req, res) => {
  try {
    const { startName, endName } = req.query;
    if (!startName || !endName)
      return res.status(400).json({ error: "Missing startName or endName" });
    const RouteModel = getRouteModel(startName, endName);
    const drivers = await RouteModel.find({});
    if (!drivers.length) {
      return res.status(404).json({ message: "No active drivers" });
    }
    res.json(drivers);
  } catch (error) {
    console.error("Error fetching drivers:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Cleanup: Delete driver documents older than 5 minutes
setInterval(async () => {
  try {
    const allCollections = await mongoose.connection.db.listCollections().toArray();
    for (const coll of allCollections) {
      if (coll.name.startsWith('system.')) continue; // Skip system collections
      const model = mongoose.models[coll.name] || mongoose.model(coll.name, driverSchema, coll.name);
      const deleted = await model.deleteMany({ updatedAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) } });
      if (deleted.deletedCount > 0) {
        console.log(`🧹 Cleaned ${deleted.deletedCount} old entries from ${coll.name}`);
      }
    }
    console.log("🧹 Old driver entries cleaned up");
  } catch (err) {
    console.error("Cleanup error:", err);
  }
}, 60 * 1000); // Runs every minute

app.get("/", (req, res) => {
  res.send("Driver tracking backend is running ✅");
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
