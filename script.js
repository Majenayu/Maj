document.addEventListener("DOMContentLoaded", function () {
    const apiKey = "e2fea1cd-bbea-428b-a974-0d63d55bb01d";
    const map = L.map('map').setView([14.5, 75.5], 7);

    // OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    let blueRoute, yellowRoute, userMarker;
    let userLocation = null;
    let trackingWatcher = null;

    // Toast display
    function showToast(message) {
        const container = document.getElementById("toastContainer");
        const toast = document.createElement("div");
        toast.className = "toast";
        toast.innerText = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    // Update time
    function updateTime() {
        const now = new Date();
        document.getElementById("currentTime").innerText = now.toLocaleTimeString();
    }
    setInterval(updateTime, 1000);

    // Enable Location
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
                sendDriverLocationToServer(userLocation[0], userLocation[1]);
            },
            (err) => showToast("❌ Failed to access location."),
            { enableHighAccuracy: true }
        );

        showToast("✅ Location enabled!");
    });

    // Disable Location
    document.getElementById("disableLocation").addEventListener("click", function () {
        if (trackingWatcher) navigator.geolocation.clearWatch(trackingWatcher);
        trackingWatcher = null;
        userLocation = null;
        if (userMarker) userMarker.remove();
        if (blueRoute) blueRoute.remove();
        showToast("❌ Location disabled!");
    });

    // Calculate Route via GraphHopper
    async function calculateRoute(start, end, color) {
        const url = `https://graphhopper.com/api/1/route?point=${start[0]},${start[1]}&point=${end[0]},${end[1]}&vehicle=car&locale=en&points_encoded=false&key=${apiKey}`;
        
        try {
            const res = await fetch(url);
            const data = await res.json();

            const coords = data.paths[0].points.coordinates.map(c => [c[1], c[0]]);

            if (color === "blue" && blueRoute) blueRoute.remove();
            if (color === "yellow" && yellowRoute) yellowRoute.remove();

            const route = L.polyline(coords, { color: color, weight: 5 }).addTo(map);
            map.fitBounds(route.getBounds());

            if (color === "blue") blueRoute = route;
            else yellowRoute = route;

            const timeMin = data.paths[0].time / 60000;
            document.getElementById("estimatedTime").innerText = Math.round(timeMin) + " min";
        } catch (err) {
            console.error(err);
            showToast("❌ Route generation failed.");
        }
    }

    // Route Button Click
    document.getElementById("routeBtn").addEventListener("click", function () {
        const start = document.getElementById("startPoint").value.split(",").map(Number);
        const end = document.getElementById("endPoint").value.split(",").map(Number);

        if (userLocation) calculateRoute(userLocation, end, "blue");
        calculateRoute(start, end, "yellow");
    });

    // GPS locator
    document.getElementById("gpsLocator").addEventListener("click", function () {
        if (userLocation) map.setView(userLocation, 15);
        else showToast("❌ No user location found.");
    });

    // Zoom in/out
    document.getElementById("zoomIn").addEventListener("click", () => map.zoomIn());
    document.getElementById("zoomOut").addEventListener("click", () => map.zoomOut());

    // Send driver location to server
    function sendDriverLocationToServer(lat, lng) {
        const startCoords = document.getElementById("startPoint").value.split(",").map(Number);
        const endCoords = document.getElementById("endPoint").value.split(",").map(Number);

        fetch("https://maj-65qm.onrender.com/update-location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ start: startCoords, end: endCoords, lat, lng })
        })
        .then(r => r.json())
        .then(() => showToast("✅ Driver location updated!"))
        .catch(() => showToast("❌ Failed to send location."));
    }
});
