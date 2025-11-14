document.addEventListener("DOMContentLoaded", function () {
    const apiKey = "e2fea1cd-bbea-428b-a974-0d63d55bb01d"; // GraphHopper API Key
    const map = L.map('map').setView([14.5, 75.5], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    let userMarker, driverMarker, routeLine;
    let userLocation = null;
    let trackingWatcher = null;
    let selectedDriver = null;
    let driverUpdateInterval = null;
    function showToast(msg) {
        alert(msg);
    }
    function updateTime() {
        let now = new Date();
        document.getElementById("currentTime").innerText = now.toLocaleTimeString();
    }
    setInterval(updateTime, 1000);
    // ✅ Enable live location
    document.getElementById("enableLocation").addEventListener("click", function () {
        if (!navigator.geolocation) return showToast("❌ Geolocation not supported.");
        trackingWatcher = navigator.geolocation.watchPosition(
            (pos) => {
                userLocation = [pos.coords.latitude, pos.coords.longitude];
                if (userMarker) userMarker.remove();
                userMarker = L.marker(userLocation, { title: "You" }).addTo(map);
            },
            () => showToast("❌ Failed to access location."),
            { enableHighAccuracy: true }
        );
        showToast("✅ Live location enabled!");
    });
    // ✅ Select location on map manually
    document.getElementById("selectOnMap").addEventListener("click", function () {
        showToast("🗺️ Click anywhere on the map to set your location.");
        map.once('click', (e) => {
            userLocation = [e.latlng.lat, e.latlng.lng];
            if (userMarker) userMarker.remove();
            userMarker = L.marker(userLocation, { title: "Selected Location" }).addTo(map);
            map.setView(userLocation, 14);
            showToast("✅ Location selected on map!");
        });
    });
    // ✅ Disable location
    document.getElementById("disableLocation").addEventListener("click", function () {
        if (trackingWatcher) navigator.geolocation.clearWatch(trackingWatcher);
        trackingWatcher = null;
        if (userMarker) userMarker.remove();
        if (driverMarker) driverMarker.remove();
        if (routeLine) routeLine.remove();
        userLocation = null;
        selectedDriver = null;
        clearInterval(driverUpdateInterval);
        document.getElementById("driverList").innerHTML = "";
        showToast("❌ Location tracking disabled!");
    });
    // ✅ Find driver list
    document.getElementById("findDriver").addEventListener("click", async function () {
        if (!userLocation) return showToast("❌ Set your location first!");
        const startName = document.getElementById("startPoint").value;
        const endName = document.getElementById("endPoint").value;
        try {
            const res = await fetch(`https://maj-65qm.onrender.com/get-drivers?startName=${startName}&endName=${endName}`);
            const drivers = await res.json();
            if (!drivers.length) {
                document.getElementById("driverList").innerHTML = "<li>No driver exists.</li>";
                return;
            }
            const driverListEl = document.getElementById("driverList");
            driverListEl.innerHTML = "";
            // Calculate distance for each driver
            drivers.forEach(driver => {
                const dist = calcDistance(userLocation[0], userLocation[1], driver.lat, driver.lng).toFixed(2);
                const li = document.createElement("li");
                li.innerHTML = `🚗 Driver ${driver.driverId} — Distance: ${dist} km
                    <button class="selectDriver">Select</button>`;
                li.querySelector(".selectDriver").addEventListener("click", () => {
                    selectedDriver = driver;
                    startDriverTracking(driver);
                });
                driverListEl.appendChild(li);
            });
        } catch (err) {
            console.error(err);
            showToast("❌ Failed to fetch drivers.");
        }
    });
    // ✅ Track selected driver (update every 5 sec)
    function startDriverTracking(driver) {
        if (driverUpdateInterval) clearInterval(driverUpdateInterval);
        updateDriverLocation(driver);
        driverUpdateInterval = setInterval(() => updateDriverLocation(driver), 5000);
    }
    // ✅ Fetch and show driver location
    async function updateDriverLocation(driver) {
        try {
            const res = await fetch(`https://maj-65qm.onrender.com/get-drivers?startName=${driver.startName}&endName=${driver.endName}`);
            const data = await res.json();
            const updated = data.find(d => d.driverId === driver.driverId);
            if (!updated) return;
            const driverLatLng = [updated.lat, updated.lng];
            if (driverMarker) driverMarker.remove();
            driverMarker = L.marker(driverLatLng, { title: "Driver" }).addTo(map);
            await calculateRoute(driverLatLng, userLocation);
        } catch (err) {
            console.error("Error updating driver location:", err);
        }
    }
    // ✅ Calculate and draw route
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
    // ✅ Utility: Distance (km)
    function calcDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    // GPS and Zoom
    document.getElementById("gpsLocator").addEventListener("click", () => {
        if (userLocation) map.setView(userLocation, 15);
        else showToast("❌ Location not set.");
    });
    document.getElementById("zoomIn").addEventListener("click", () => map.zoomIn());
    document.getElementById("zoomOut").addEventListener("click", () => map.zoomOut());
});
