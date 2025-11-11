document.addEventListener("DOMContentLoaded", function () {
    const map = L.map('map').setView([14.5, 75.5], 7);

    // OSM Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    let blueRoute, driverMarker = null;

    // Update time every second
    setInterval(() => {
        let now = new Date();
        document.getElementById("currentTime").innerText = now.toLocaleTimeString();
    }, 1000);

    // Function to show route using GraphHopper
    async function calculateRoute(start, end) {
        const apiKey = "e2fea1cd-bbea-428b-a974-0d63d55bb01d";
        const url = `https://graphhopper.com/api/1/route?point=${start[0]},${start[1]}&point=${end[0]},${end[1]}&vehicle=car&locale=en&points_encoded=false&key=${apiKey}`;

        try {
            const res = await fetch(url);
            const data = await res.json();
            const coords = data.paths[0].points.coordinates.map(c => [c[1], c[0]]);

            if (blueRoute) blueRoute.remove();
            blueRoute = L.polyline(coords, { color: "blue", weight: 5 }).addTo(map);
            map.fitBounds(blueRoute.getBounds());
        } catch (err) {
            alert("❌ Failed to fetch route");
        }
    }

    // Show Route Button
    document.getElementById("routeBtn").addEventListener("click", function () {
        let start = document.getElementById("startPoint").value.split(",").map(Number);
        let end = document.getElementById("endPoint").value.split(",").map(Number);
        calculateRoute(start, end);
    });

    // Fetch driver’s live location every 5 seconds
    async function fetchDriverLocation() {
        try {
            const res = await fetch("https://maj-65qm.onrender.com/get-location");
            const data = await res.json();
            const { lat, lng } = data;

            document.getElementById("lastUpdate").innerText = new Date().toLocaleTimeString();

            if (driverMarker) driverMarker.remove();
            driverMarker = L.marker([lat, lng], { title: "Driver" }).addTo(map);
        } catch {
            console.log("⚠️ Unable to fetch driver location");
        }
    }

    setInterval(fetchDriverLocation, 5000);
});
