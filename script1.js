document.addEventListener("DOMContentLoaded", function () {
    const apiKey = "e2fea1cd-bbea-428b-a974-0d63d55bb01d";
    const map = L.map('map').setView([14.5, 75.5], 7);

    // Base map (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    let driverMarker, selectedMarker, routeLine;
    let driverLocation = null;
    let selectedLocation = null;

    // Toast message
    function showToast(msg) {
        alert(msg);
    }

    // Live clock
    function updateCurrentTime() {
        document.getElementById("currentTime").innerText =
            new Date().toLocaleTimeString();
    }
    setInterval(updateCurrentTime, 1000);
    updateCurrentTime();

    // Tap on map to select location
    map.on('click', function (e) {
        selectedLocation = [e.latlng.lat, e.latlng.lng];
        if (selectedMarker) selectedMarker.remove();
        selectedMarker = L.marker(selectedLocation).addTo(map);
        showToast(`📍 Location Selected: ${selectedLocation[0].toFixed(4)}, ${selectedLocation[1].toFixed(4)}`);
    });

    // Fetch driver location from backend
    async function fetchDriverLocation(startCoords, endCoords) {
        try {
            let res = await fetch(`https://maj-65qm.onrender.com/get-driver-location?start=${JSON.stringify(startCoords)}&end=${JSON.stringify(endCoords)}`);
            if (!res.ok) throw new Error(`HTTP error ${res.status}`);
            let data = await res.json();

            if (data && data.driverLocation) {
                driverLocation = [data.driverLocation.lat, data.driverLocation.lng];
                updateDriverMarker(driverLocation);
                return true;
            } else {
                showToast("❌ No active driver found.");
                return false;
            }
        } catch (err) {
            console.error(err);
            showToast("⚠️ Failed to connect to server.");
            return false;
        }
    }

    // Update driver marker
    function updateDriverMarker(coords) {
        if (driverMarker) driverMarker.remove();
        driverMarker = L.marker(coords, { title: "Driver" }).addTo(map);
    }

    // Calculate route using GraphHopper API
    async function calculateRoute(start, end) {
        if (!start || !end) {
            showToast("❌ Missing driver or destination location.");
            return;
        }

        const url = `https://graphhopper.com/api/1/route?point=${start[0]},${start[1]}&point=${end[0]},${end[1]}&vehicle=car&locale=en&points_encoded=false&key=${apiKey}`;

        try {
            const res = await fetch(url);
            const data = await res.json();

            if (!data.paths || !data.paths.length) {
                showToast("⚠️ No route found.");
                return;
            }

            const coords = data.paths[0].points.coordinates.map(c => [c[1], c[0]]);

            if (routeLine) routeLine.remove();
            routeLine = L.polyline(coords, { color: "blue", weight: 5 }).addTo(map);
            map.fitBounds(routeLine.getBounds());

            const distKm = (data.paths[0].distance / 1000).toFixed(2);
            const timeMin = Math.ceil(data.paths[0].time / 60000);

            document.getElementById("distanceToDriver").innerText = `${distKm} km`;
            document.getElementById("ETA").innerText = `${timeMin} min`;

        } catch (err) {
            console.error(err);
            showToast("❌ Error calculating route.");
        }
    }

    // Find Driver Button
    document.getElementById("checkDriver").addEventListener("click", async function () {
        const startCoords = document.getElementById("start").value.split(",").map(Number);
        const endCoords = document.getElementById("end").value.split(",").map(Number);

        if (!selectedLocation) {
            showToast("📍 Please select a location on the map first.");
            return;
        }

        const driverFound = await fetchDriverLocation(startCoords, endCoords);
        if (driverFound) {
            showToast("✅ Driver found! Generating route...");
            calculateRoute(driverLocation, selectedLocation);
        }
    });

    // GPS Locator
    document.getElementById("gpsLocator").addEventListener("click", function () {
        if (selectedLocation) {
            map.setView(selectedLocation, 15);
        } else {
            showToast("⚠️ Please select a location first.");
        }
    });

    // Zoom Controls
    document.getElementById("zoomIn").addEventListener("click", () => map.zoomIn());
    document.getElementById("zoomOut").addEventListener("click", () => map.zoomOut());
});
