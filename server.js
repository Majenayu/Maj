const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));


// Serve script1.js and script.js from their current location
app.use("/script1.js", express.static(path.join(__dirname, "script1.js")));
app.use("/script.js", express.static(path.join(__dirname, "script.js")));
app.use("/script11.js", express.static(path.join(__dirname, "script11.js")));
app.use("/script12.js", express.static(path.join(__dirname, "script12.js")));

// Connect to MongoDB
mongoose.connect("mongodb+srv://ayu:ayu@ayu.cawv7.mongodb.net/yourDatabaseName?retryWrites=true&w=majority&appName=ayu")
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));


// Route-to-collection mapping
const routeCollections = [
    { start: [12.9172, 74.8560], end: [12.9716, 77.5946], collection: "1" },
    { start: [12.9172, 74.8560], end: [13.3409, 74.7421], collection: "2" },
    { start: [12.9172, 74.8560], end: [14.4530, 75.9215], collection: "3" },
    { start: [12.9172, 74.8560], end: [15.3647, 75.1239], collection: "4" },
    { start: [12.9172, 74.8560], end: [15.8497, 74.4977], collection: "5" },
    { start: [12.9172, 74.8560], end: [12.2958, 76.6394], collection: "6" },
    { start: [12.9716, 77.5946], end: [12.9172, 74.8560], collection: "7" },
    { start: [12.9716, 77.5946], end: [13.3409, 74.7421], collection: "8" },
    { start: [12.9716, 77.5946], end: [14.4530, 75.9215], collection: "9" },
    { start: [12.9716, 77.5946], end: [15.3647, 75.1239], collection: "10" },
    { start: [12.9716, 77.5946], end: [15.8497, 74.4977], collection: "11" },
    { start: [12.9716, 77.5946], end: [12.2958, 76.6394], collection: "12" },
    { start: [13.3409, 74.7421], end: [12.9172, 74.8560], collection: "13" },
    { start: [13.3409, 74.7421], end: [12.9716, 77.5946], collection: "14" },
    { start: [13.3409, 74.7421], end: [14.4530, 75.9215], collection: "15" },
    { start: [13.3409, 74.7421], end: [15.3647, 75.1239], collection: "16" },
    { start: [13.3409, 74.7421], end: [15.8497, 74.4977], collection: "17" },
    { start: [13.3409, 74.7421], end: [12.2958, 76.6394], collection: "18" },
    { start: [14.4530, 75.9215], end: [12.9172, 74.8560], collection: "19" },
    { start: [14.4530, 75.9215], end: [12.9716, 77.5946], collection: "20" },
    { start: [14.4530, 75.9215], end: [13.3409, 74.7421], collection: "21" },
    { start: [14.4530, 75.9215], end: [15.3647, 75.1239], collection: "22" },
    { start: [14.4530, 75.9215], end: [15.8497, 74.4977], collection: "23" },
    { start: [14.4530, 75.9215], end: [12.2958, 76.6394], collection: "24" },
    { start: [15.3647, 75.1239], end: [12.9172, 74.8560], collection: "25" },
    { start: [15.3647, 75.1239], end: [12.9716, 77.5946], collection: "26" },
    { start: [15.3647, 75.1239], end: [13.3409, 74.7421], collection: "27" },
    { start: [15.3647, 75.1239], end: [14.4530, 75.9215], collection: "28" },
    { start: [15.3647, 75.1239], end: [15.8497, 74.4977], collection: "29" },
    { start: [15.3647, 75.1239], end: [12.2958, 76.6394], collection: "30" },];

// Function to get the correct MongoDB collection
function getRouteCollection(start, end) {
    start = start.map(Number);
    end = end.map(Number);

    const route = routeCollections.find(r => 
        r.start[0] === start[0] && r.start[1] === start[1] && 
        r.end[0] === end[0] && r.end[1] === end[1]
    );

    return route ? mongoose.connection.db.collection(route.collection) : null;
}

// API to update the driver's location
app.post("/update-location", async (req, res) => {
    try {
        const { start, end, lat, lng } = req.body;
        if (!start || !end || !lat || !lng) {
            return res.status(400).json({ error: "Missing required parameters" });
        }

        // Get the appropriate MongoDB collection
        const routeCollection = getRouteCollection(start, end);
        if (!routeCollection) return res.status(404).json({ error: "Route not found" });

        // Update the driver's location in the collection
        await routeCollection.updateOne(
            {},
            { $set: { driverLocation: { lat, lng }, timestamp: new Date() } },
            { upsert: true }
        );

        res.json({ message: "Driver location updated successfully" });
    } catch (error) {
        console.error("Error updating location:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// API to update the passenger count on a specific route
app.post("/update-passenger-count", async (req, res) => {
    try {
        const { start, end, count } = req.body;
        if (!start || !end || typeof count !== "number") {
            return res.status(400).json({ error: "Missing or invalid parameters" });
        }

        // Get the appropriate MongoDB collection
        const routeCollection = getRouteCollection(start, end);
        if (!routeCollection) return res.status(404).json({ error: "Route not found" });

        // Update the passenger count in the collection
        await routeCollection.updateOne(
            {},
            { $set: { passengerCount: count, passengerUpdateTime: new Date() } },
            { upsert: true }
        );

        res.json({ message: "Passenger count updated successfully" });
    } catch (error) {
        console.error("Error updating passenger count:", error);
        res.status(500).json({ error: "Server error" });
    }
});




// API to retrieve the driver's location
app.get("/get-driver-location", async (req, res) => {
    try {
        const { start, end } = req.query;
        if (!start || !end) {
            return res.status(400).json({ error: "Missing start or end parameters" });
        }

        // Get the corresponding MongoDB collection
        const routeCollection = getRouteCollection(JSON.parse(start), JSON.parse(end));
        if (!routeCollection) return res.status(404).json({ error: "Route not found" });

        // Retrieve the driver's latest location
        const driverLocation = await routeCollection.findOne({}, { projection: { _id: 0 } });
        if (!driverLocation) return res.status(404).json({ message: "No driver available on this route" });

        res.json(driverLocation);
    } catch (error) {
        console.error("Error fetching driver location:", error);
        res.status(500).json({ error: "Server error" });
    }
});



// API to retrieve the passenger count on a specific route
app.get("/get-passenger-count", async (req, res) => {
    try {
        const { start, end } = req.query;
        if (!start || !end) {
            return res.status(400).json({ error: "Missing start or end parameters" });
        }

        // Get the appropriate MongoDB collection
        const routeCollection = getRouteCollection(JSON.parse(start), JSON.parse(end));
        if (!routeCollection) return res.status(404).json({ error: "Route not found" });

        // Fetch the latest passenger count
        const passengerData = await routeCollection.findOne({}, {
            projection: { _id: 0, passengerCount: 1, passengerUpdateTime: 1 }
        });

        if (!passengerData || passengerData.passengerCount === undefined) {
            return res.status(404).json({ message: "No passenger data available on this route" });
        }

        res.json(passengerData);
    } catch (error) {
        console.error("Error fetching passenger count:", error);
        res.status(500).json({ error: "Server error" });
    }
});





app.get("/", (req, res) => {
    res.send("Backend is running!");
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
