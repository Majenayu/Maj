document.addEventListener("DOMContentLoaded", function () {
    const apiKey = "e2fea1cd-bbea-428b-a974-0d63d55bb01d";

    // Initialize Leaflet Map
    let map = L.map('map').setView([14.5, 75.5], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    let blueRoute, yellowRoute, userLocationMarker;
    let userLocation = null;
    let trackingWatcher = null;

    function showToast(message, type) {
        const container = document.getElementById("toastContainer");
        const toast = document.createElement("div");
        toast.className = `toast show ${type}`;
        toast.innerText = message;
        container.appendChild(toast);
        setTimeout(() => toast.classList.remove("show"), 3000);
        setTimeout(() => toast.remove(), 3500);
    }

    function removeRoute(route) {
        if (route) map.removeLayer(route);
        return null;
    }

    function updateUserLocation(position) {
        userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
        if (userLocationMarker) map.removeLayer(userLocationMarker);
        userLocationMarker = L.marker(userLocation).addTo(map);
    }

    function updateTable(distance, duration) {
        document.getElementById("distance").innerText = distance.toFixed(2) + " km";
        document.getElementById("estimatedTime").innerText = Math.round(duration) + " min";
    }

    function updateTime() {
        let now = new Date();
        document.getElementById("currentTime").innerText = now.toLocaleTimeString();
    }
    setInterval(updateTime, 1000);

    // Enable location tracking
    document.getElementById("enableLocation").addEventListener("click", function () {
        if (!navigator.geolocation) {
            showToast("❌ Geolocation not supported", "error");
            return;
        }
        trackingWatcher = navigator.geolocation.watchPosition(updateUserLocation, 
            () => showToast("❌ Failed to access location", "error"), 
            { enableHighAccuracy: true }
        );
        showToast("✅ Location tracking started", "success");
        document.getElementById("userRouteBtn").style.display = "block";
    });

    // Disable location tracking
    document.getElementById("disableLocation").addEventListener("click", function () {
        if (trackingWatcher) navigator.geolocation.clearWatch(trackingWatcher);
        trackingWatcher = null;
        userLocation = null;
        if (userLocationMarker) map.removeLayer(userLocationMarker);
        blueRoute = removeRoute(blueRoute);
        showToast("❌ Location tracking stopped", "error");
        document.getElementById("userRouteBtn").style.display = "none";
    });

    // GraphHopper Routing API
    async function calculateRoute(start, end, color, isUserRoute) {
        try {
            const response = await fetch(
                `https://graphhopper.com/api/1/route?point=${start[0]},${start[1]}&point=${end[0]},${end[1]}&vehicle=car&locale=en&points_encoded=false&key=${apiKey}`
            );
            const data = await response.json();
            if (!data.paths || data.paths.length === 0) {
                showToast("❌ No route found", "error");
                return;
            }

            const coords = data.paths[0].points.coordinates.map(p => [p[1], p[0]]);
            const polyline = L.polyline(coords, { color, weight: 5 }).addTo(map);
            map.fitBounds(polyline.getBounds());

            const distance = data.paths[0].distance / 1000;
            const duration = data.paths[0].time / 60000;

            if (isUserRoute) {
                blueRoute = removeRoute(blueRoute);
                blueRoute = polyline;
                updateTable(distance, duration);
            } else {
                yellowRoute = removeRoute(yellowRoute);
                yellowRoute = polyline;
            }

        } catch (error) {
            console.error(error);
            showToast("❌ Error fetching route", "error");
        }
    }

    function sendDriverLocationToServer(lat, lng) {
        let startCoords = document.getElementById("startPoint").value.split(",").map(Number);
        let endCoords = document.getElementById("endPoint").value.split(",").map(Number);

        fetch("https://maj-65qm.onrender.com/update-location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ start: startCoords, end: endCoords, lat, lng })
        })
        .then(res => res.json())
        .then(() => showToast("✅ Driver location updated", "success"))
        .catch(() => showToast("❌ Failed to update location", "error"));
    }

    function updateUserRoute() {
        if (!userLocation) {
            showToast("❌ User location unavailable", "error");
            return;
        }
        let end = document.getElementById("endPoint").value.split(",").map(Number);
        calculateRoute([userLocation.lat, userLocation.lng], end, "blue", true);
    }

    document.getElementById("routeBtn").addEventListener("click", function () {
        let startCoords = document.getElementById("startPoint").value.split(",").map(Number);
        let endCoords = document.getElementById("endPoint").value.split(",").map(Number);
        calculateRoute(startCoords, endCoords, "yellow", false);
        updateUserRoute();
    });

    function zoomToUserLocation() {
        if (userLocation) {
            map.setView([userLocation.lat, userLocation.lng], 15);
        } else {
            showToast("❌ Location not available", "error");
        }
    }

    document.getElementById("gpsLocator").addEventListener("click", zoomToUserLocation);
    document.getElementById("zoomIn").addEventListener("click", () => map.zoomIn());
    document.getElementById("zoomOut").addEventListener("click", () => map.zoomOut());
});
