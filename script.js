document.addEventListener("DOMContentLoaded", function () {
  const apiKey = "9b291c7a36e74c10b90750ce059f48b2";

  // Initialize map
  const map = L.map("map").setView([14.5, 75.5], 7);
  L.tileLayer(
    `https://maps.geoapify.com/v1/tile/carto/{z}/{x}/{y}.png?apiKey=${apiKey}`,
    { attribution: "© Geoapify" }
  ).addTo(map);

  let routeLayer;
  let userMarker;
  let userLocation = null;
  let trackingWatcher = null;

  // Toast notification
  function showToast(message) {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = "toast show";
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.remove("show"); toast.remove(); }, 3000);
  }

  // Show route between two points
  async function showRoute(start, end) {
    const url = `https://api.geoapify.com/v1/routing?waypoints=${start[0]},${start[1]}|${end[0]},${end[1]}&mode=drive&apiKey=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    if (routeLayer) map.removeLayer(routeLayer);
    const coords = data.features[0].geometry.coordinates[0].map(p => [p[1], p[0]]);
    routeLayer = L.polyline(coords, { color: "blue", weight: 5 }).addTo(map);
    map.fitBounds(routeLayer.getBounds());

    const dist = data.features[0].properties.distance / 1000;
    const time = data.features[0].properties.time / 60;
    document.getElementById("distance").textContent = dist.toFixed(2) + " km";
    document.getElementById("estimatedTime").textContent = time.toFixed(1) + " min";
  }

  // Track time
  function updateTime() {
    const now = new Date();
    document.getElementById("currentTime").textContent = now.toLocaleTimeString();
  }
  setInterval(updateTime, 1000);

  // Enable location
  document.getElementById("enableLocation").addEventListener("click", () => {
    if (!navigator.geolocation) return showToast("Geolocation not supported!");
    trackingWatcher = navigator.geolocation.watchPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      userLocation = [latitude, longitude];
      if (userMarker) map.removeLayer(userMarker);
      userMarker = L.marker(userLocation).addTo(map);
    });
    showToast("✅ Location enabled");
  });

  // Disable location
  document.getElementById("disableLocation").addEventListener("click", () => {
    if (trackingWatcher) navigator.geolocation.clearWatch(trackingWatcher);
    trackingWatcher = null;
    userLocation = null;
    if (userMarker) map.removeLayer(userMarker);
    showToast("❌ Location disabled");
  });

  // Show route button
  document.getElementById("routeBtn").addEventListener("click", () => {
    const start = document.getElementById("startPoint").value.split(",").map(Number);
    const end = document.getElementById("endPoint").value.split(",").map(Number);
    showRoute(start, end);
  });

  // Zoom controls
  document.getElementById("zoomIn").addEventListener("click", () => map.zoomIn());
  document.getElementById("zoomOut").addEventListener("click", () => map.zoomOut());
  document.getElementById("gpsLocator").addEventListener("click", () => {
    if (userLocation) map.setView(userLocation, 14);
    else showToast("Location not available");
  });
});
