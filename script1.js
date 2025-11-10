document.addEventListener("DOMContentLoaded", () => {
  const apiKey = "9b291c7a36e74c10b90750ce059f48b2"; // Geoapify API Key

  const map = L.map("map").setView([14.5, 75.5], 7);
  L.tileLayer(`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${apiKey}`, {
    attribution: '© OpenStreetMap contributors, © Geoapify',
  }).addTo(map);

  let driverMarker, selectedMarker, routeLine;
  let driverLocation = null;
  let selectedLocation = null;

  // Fetch driver location (same logic as before)
  async function fetchDriverLocation(startCoords, endCoords) {
    try {
      let response = await fetch(`https://maj-65qm.onrender.com/get-driver-location?start=${JSON.stringify(startCoords)}&end=${JSON.stringify(endCoords)}`);
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      let data = await response.json();
      if (data && data.driverLocation) {
        driverLocation = data.driverLocation;
        updateDriverLocation(driverLocation.lat, driverLocation.lng);
        return true;
      } else {
        showToast("No active driver found", "info");
        return false;
      }
    } catch (error) {
      alert("Error connecting to server.");
      console.error(error);
      return false;
    }
  }

  function updateDriverLocation(lat, lng) {
    if (driverMarker) map.removeLayer(driverMarker);
    driverMarker = L.marker([lat, lng]).addTo(map).bindPopup("Driver Location");
  }

  // Calculate route using Geoapify Routing API
  async function calculateRoute(start, end) {
    const url = `https://api.geoapify.com/v1/routing?waypoints=${start.lat},${start.lng}|${end.lat},${end.lng}&mode=drive&apiKey=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!data.features || data.features.length === 0) {
        alert("No route found!");
        return;
      }

      const coords = data.features[0].geometry.coordinates[0].map(c => [c[1], c[0]]);

      if (routeLine) map.removeLayer(routeLine);
      routeLine = L.polyline(coords, { color: "blue", weight: 4 }).addTo(map);
      map.fitBounds(routeLine.getBounds());

      const summary = data.features[0].properties;
      document.getElementById("distanceToDriver").innerText = `${(summary.distance / 1000).toFixed(2)} km`;
      document.getElementById("ETA").innerText = `${Math.ceil(summary.time / 60)} min`;
    } catch (error) {
      console.error("Routing error:", error);
    }
  }

  // Select location on map
  map.on("click", (e) => {
    selectedLocation = { lat: e.latlng.lat, lng: e.latlng.lng };
    if (selectedMarker) map.removeLayer(selectedMarker);
    selectedMarker = L.marker([selectedLocation.lat, selectedLocation.lng]).addTo(map);
    alert(`Location Selected: ${selectedLocation.lat}, ${selectedLocation.lng}`);
  });

  // Check Driver
  document.getElementById("checkDriver").addEventListener("click", async () => {
    const start = document.getElementById("start").value.split(",").map(Number);
    const end = document.getElementById("end").value.split(",").map(Number);
    if (!selectedLocation) {
      alert("Select a location on the map first.");
      return;
    }
    const driverFound = await fetchDriverLocation(start, end);
    if (driverFound) calculateRoute(driverLocation, selectedLocation);
  });

  // Zoom & GPS controls
  document.getElementById("zoomIn").addEventListener("click", () => map.zoomIn());
  document.getElementById("zoomOut").addEventListener("click", () => map.zoomOut());
  document.getElementById("gpsLocator").addEventListener("click", () => {
    if (!selectedLocation) return alert("Select a location first!");
    map.setView([selectedLocation.lat, selectedLocation.lng], 15);
  });

  // Current time updater
  setInterval(() => {
    document.getElementById("currentTime").innerText = new Date().toLocaleTimeString();
  }, 1000);

  function showToast(message, type) {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add("show"), 100);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
});
