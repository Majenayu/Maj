document.addEventListener("DOMContentLoaded", function () {
    const apiKey = "e2fea1cd-bbea-428b-a974-0d63d55bb01d";
    const map = L.map('map').setView([14.5, 75.5], 7);

    // OpenStreetMap base layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    let userMarker, driverMarker, routeLine;
    let userLocation = null;
    let trackingWatcher = null;

    function showToast(msg) {
        alert(msg);
    }

    // Update live time
    function updateTime() {
        let now = new Date();
        document.getElementById("currentTime").innerText = now.toLocaleTimeString();
    }
    setInterval(updateTime, 1000);

    // Enable location tracking
    document.getElementById("enableLocation").addEventListener("click", function () {
        if (!navigator.geolocation) {
            showToast("❌ Geolocation not supported.");
            return;
        }

        trackingWatcher = navigator.geolocation.watchPosition(
            (pos) => {
                userLocation = [pos.coords.latitude, pos.coords.longitude];
                if (userMarker) userMarker.remove();
                userMarker = L.marker(userLocation).addTo(map);
            },
            (err) => showToast("❌ Failed to access location."),
            { enableHighAccuracy: true }
        );

        showToast("✅ Location enabled!");
    });

    // Disable location
    document.getElementById("disableLocation").addEventListener("click", function () {
        if (trackingWatcher) navigator.geolocation.clearWatch(trackingWatcher);
        trackingWatcher = null;
        if (userMarker) userMarker.remove();
        userLocation = null;
        if (routeLine) routeLine.remove();
        if (driverMarker) driverMarker.remove();
        showToast("❌ Location disabled!");
    });

    // Find driver and show route
    document.getElementById("findDriver").addEventListener("click", async function () {
        if (!userLocation) {
            showToast("❌ Enable your location first!");
            return;
        }

        try {
           const start = document.getElementById("startPoint").value.split(",").map(Number);
const end = document.getElementById("endPoint").value.split(",").map(Number);
const res = await fetch(`https://maj-65qm.onrender.com/get-driver-location?start=${JSON.stringify(start)}&end=${JSON.stringify(end)}`);

            const data = await res.json();

            const driverLat = data.lat;
            const driverLng = data.lng;

            if (driverMarker) driverMarker.remove();
            driverMarker = L.marker([driverLat, driverLng], { title: "Driver" }).addTo(map);

            calculateRoute([driverLat, driverLng], userLocation);
        } catch (err) {
            console.error(err);
            showToast("❌ Failed to fetch driver location.");
        }
    });

    // Calculate route between driver and user
    async function calculateRoute(start, end) {
        const url = `https://graphhopper.com/api/1/route?point=${start[0]},${start[1]}&point=${end[0]},${end[1]}&vehicle=car&locale=en&points_encoded=false&key=${apiKey}`;
        try {
            const res = await fetch(url);
            const data = await res.json();
            const coords = data.paths[0].points.coordinates.map(c => [c[1], c[0]]);

            if (routeLine) routeLine.remove();
            routeLine = L.polyline(coords, { color: "blue", weight: 5 }).addTo(map);
            map.fitBounds(routeLine.getBounds());

            const distanceKm = data.paths[0].distance / 1000;
            const timeMin = data.paths[0].time / 60000;

            document.getElementById("driverDistance").innerText = distanceKm.toFixed(1) + " km";
            document.getElementById("driverETA").innerText = Math.round(timeMin) + " min";
        } catch (err) {
            console.error(err);
            showToast("❌ Failed to draw route.");
        }
    }

    // GPS locator button
    document.getElementById("gpsLocator").addEventListener("click", function () {
        if (userLocation) {
            map.setView(userLocation, 15);
        } else {
            showToast("❌ Location not available.");
        }
    });

    // Zoom buttons
    document.getElementById("zoomIn").addEventListener("click", () => map.zoomIn());
    document.getElementById("zoomOut").addEventListener("click", () => map.zoomOut());
});

