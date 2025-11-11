document.addEventListener("DOMContentLoaded", () => {
  const apiKey = "e2fea1cd-bbea-428b-a974-0d63d55bb01d"; // ✅ GraphHopper key

  // Initialize Leaflet Map
  const map = L.map("map").setView([14.5, 75.5], 7);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
  }).addTo(map);

  let driverMarker = null;
  let userMarker = null;
  let routeLine = null;
  let selectedLocation = null;
  let driverLocation = null;

  function showToast(msg, type = "info") {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add("show"), 100);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 500);
    }, 3000);
  }

  async function fetchDriverLocation(startCoords, endCoords) {
    try {
      const response = await fetch(
        `https://maj-65qm.onrender.com/get-driver-location?start=${JSON.stringify(startCoords)}&end=${JSON.stringify(endCoords)}`
      );
      const data = await response.json();
      if (data.driverLocation) {
        driverLocation = data.driverLocation;
        if (driverMarker) driverMarker.remove();
        driverMarker = L.marker([driverLocation.lat, driverLocation.lng]).addTo(map);
        return true;
      } else {
        showToast("No active driver found.", "error");
        return false;
      }
    } catch (err) {
      showToast("Server error while fetching driver.", "error");
      return false;
    }
  }

  async function calculateRoute(start, end) {
    if (!start || !end) {
      showToast("Missing route points!", "error");
      return;
    }

    const url = `https://graphhopper.com/api/1/route?point=${start.lat},${start.lng}&point=${end.lat},${end.lng}&vehicle=car&locale=en&points_encoded=false&key=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!data.paths || data.paths.length === 0) {
        showToast("No route found!", "error");
        return;
      }

      const path = data.paths[0];
      const coords = path.points.coordinates.map(c => [c[1], c[0]]);

      if (routeLine) map.removeLayer(routeLine);
      routeLine = L.polyline(coords, { color: "blue", weight: 5 }).addTo(map);
      map.fitBounds(routeLine.getBounds());

      document.getElementById("distanceToDriver").innerText = (path.distance / 1000).toFixed(2) + " km";
      document.getElementById("ETA").innerText = Math.round(path.time / 60000) + " min";
    } catch (error) {
      showToast("Error calculating route.", "error");
    }
  }

  // Select location on map
  map.on("click", (e) => {
    selectedLocation = { lat: e.latlng.lat, lng: e.latlng.lng };
    if (userMarker) userMarker.remove();
    userMarker = L.marker([selectedLocation.lat, selectedLocation.lng]).addTo(map);
    showToast(`Selected: ${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`);
  });

  document.getElementById("checkDriver").addEventListener("click", async () => {
    const start = document.getElementById("start").value.split(",").map(Number);
    const end = document.getElementById("end").value.split(",").map(Number);
    if (!selectedLocation) {
      showToast("Select a location on the map.", "error");
      return;
    }
    const driverFound = await fetchDriverLocation(start, end);
    if (driverFound) calculateRoute(driverLocation, selectedLocation);
  });

  document.getElementById("gpsLocator").addEventListener("click", () => {
    if (selectedLocation) {
      map.setView([selectedLocation.lat, selectedLocation.lng], 15);
    } else {
      showToast("Select a location first.", "error");
    }
  });

  document.getElementById("zoomIn").addEventListener("click", () => map.zoomIn());
  document.getElementById("zoomOut").addEventListener("click", () => map.zoomOut());

  function updateTime() {
    document.getElementById("currentTime").innerText = new Date().toLocaleTimeString();
  }
  setInterval(updateTime, 1000);
  updateTime();
});
