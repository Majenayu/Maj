document.addEventListener("DOMContentLoaded", function () {
    const apiKey = "mzDLjmDOdq62sKIc4y81FgMv8pqj2ndZWPBraNyCm2w";
    const serverURL = "https://maj-65qm.onrender.com"; // your Render backend

    let platform = new H.service.Platform({ 'apikey': apiKey });
    let defaultLayers = platform.createDefaultLayers();
    let map = new H.Map(document.getElementById("map"), defaultLayers.vector.normal.map, {
        zoom: 7,
        center: { lat: 14.5, lng: 75.5 }
    });

    new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
    H.ui.UI.createDefault(map, defaultLayers);

    let driverMarker, watcherId;

    // Toast function
    function showToast(message, type = "") {
        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.getElementById("toastContainer").appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    // Show current time
    setInterval(() => {
        document.getElementById("currentTime").innerText = new Date().toLocaleTimeString();
    }, 1000);

    // Enable driver location tracking
    document.getElementById("enableLocation").addEventListener("click", () => {
        if (!navigator.geolocation) return showToast("Geolocation not supported", "error");

        watcherId = navigator.geolocation.watchPosition(pos => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            updateDriverMarker(lat, lng);
            sendLocation(lat, lng);
        }, () => showToast("Failed to get location", "error"), { enableHighAccuracy: true });

        showToast("Live tracking started ✅", "success");
    });

    // Disable tracking
    document.getElementById("disableLocation").addEventListener("click", () => {
        if (watcherId) navigator.geolocation.clearWatch(watcherId);
        watcherId = null;
        if (driverMarker) map.removeObject(driverMarker);
        showToast("Tracking stopped ❌", "error");
    });

    // Update driver marker on map
    function updateDriverMarker(lat, lng) {
        if (driverMarker) map.removeObject(driverMarker);
        driverMarker = new H.map.Marker({ lat, lng });
        map.addObject(driverMarker);
        map.setCenter({ lat, lng });
    }

    // Send location to backend
    function sendLocation(lat, lng) {
        const startCoords = document.getElementById("startPoint").value.split(",").map(Number);
        const endCoords = document.getElementById("endPoint").value.split(",").map(Number);

        fetch(`${serverURL}/update-location`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                start: startCoords,
                end: endCoords,
                lat, lng
            })
        })
            .then(r => r.json())
            .then(() => showToast("Driver location updated!", "success"))
            .catch(err => console.error("Error:", err));
    }
});
