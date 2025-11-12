document.addEventListener("DOMContentLoaded", function () {
  const apiKey = "e2fea1cd-bbea-428b-a974-0d63d55bb01d";
  let driverId = "driver_" + Math.random().toString(36).substring(2, 9);
  let map = L.map("map").setView([14.5, 75.5], 7);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  let userMarker = null;
  let watcher = null;
  let routePolyline = null;
  let currentLocation = null;
  let sendInterval = null;

  function showToast(message) {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = "toast show";
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  function updateClock() {
    document.getElementById("currentTime").innerText = new Date().toLocaleTimeString();
  }
  setInterval(updateClock, 1000);

  // ✅ Watch driver location
  function startTracking() {
    if (!navigator.geolocation) {
      showToast("❌ Geolocation not supported!");
      return;
    }

    watcher = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        currentLocation = [latitude, longitude];

        if (userMarker) userMarker.remove();
        userMarker = L.marker(currentLocation).addTo(map);
      },
      () => showToast("❌ Unable to get location."),
      { enableHighAccuracy: true }
    );
  }

  function stopTracking() {
    if (watcher) navigator.geolocation.clearWatch(watcher);
    watcher = null;
    if (sendInterval) clearInterval(sendInterval);
    sendInterval = null;
    currentLocation = null;
    if (userMarker) userMarker.remove();
  }

  // ✅ Generate route and start sending data
  document.getElementById("routeBtn").addEventListener("click", async function () {
    const startSelect = document.getElementById("startPoint");
    const endSelect = document.getElementById("endPoint");

    const startCoords = startSelect.value.split(",").map(Number);
    const endCoords = endSelect.value.split(",").map(Number);
    const startName = startSelect.options[startSelect.selectedIndex].text;
    const endName = endSelect.options[endSelect.selectedIndex].text;

    try {
      const res = await fetch(
        `https://graphhopper.com/api/1/route?point=${startCoords[0]},${startCoords[1]}&point=${endCoords[0]},${endCoords[1]}&vehicle=car&locale=en&points_encoded=false&key=${apiKey}`
      );
      const data = await res.json();
      if (!data.paths || data.paths.length === 0) {
        showToast("❌ No route found!");
        return;
      }

      const coords = data.paths[0].points.coordinates.map(c => [c[1], c[0]]);
      if (routePolyline) routePolyline.remove();
      routePolyline = L.polyline(coords, { color: "blue", weight: 5 }).addTo(map);
      map.fitBounds(routePolyline.getBounds());

      const distance = data.paths[0].distance / 1000;
      const duration = data.paths[0].time / 60000;
      document.getElementById("distance").innerText = distance.toFixed(1) + " km";
      document.getElementById("estimatedTime").innerText = Math.round(duration) + " min";

      startTracking();
      showToast("✅ Route generated & tracking started");

      // Send driver location every 5 seconds
      if (sendInterval) clearInterval(sendInterval);
      sendInterval = setInterval(async () => {
        if (!currentLocation) return;
        const [lat, lng] = currentLocation;

        await fetch("https://maj-65qm.onrender.com/update-location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            driverId,
            startName,
            endName,
            startCoords,
            endCoords,
            lat,
            lng
          }),
        }).catch(() => console.log("⚠️ Failed to send location"));
      }, 5000);
    } catch (err) {
      console.error(err);
      showToast("❌ Route fetch failed!");
    }
  });

  document.getElementById("enableLocation").addEventListener("click", startTracking);
  document.getElementById("disableLocation").addEventListener("click", stopTracking);
  document.getElementById("gpsLocator").addEventListener("click", () => {
    if (currentLocation) map.setView(currentLocation, 14);
    else showToast("❌ Location not available.");
  });
  document.getElementById("zoomIn").addEventListener("click", () => map.zoomIn());
  document.getElementById("zoomOut").addEventListener("click", () => map.zoomOut());
});
