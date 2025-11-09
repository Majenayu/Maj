document.addEventListener("DOMContentLoaded", function () {
    const apiKey = "mzDLjmDOdq62sKIc4y81FgMv8pqj2ndZWPBraNyCm2w"; // ⚠️ REPLACE WITH VALID KEY FROM developer.here.com
    let platform = new H.service.Platform({ 'apikey': apiKey });
    let defaultLayers = platform.createDefaultLayers();
    // Optional: Switch to raster to avoid vector tile errors: defaultLayers.raster.normal.map
    let map = new H.Map(document.getElementById('map'), defaultLayers.vector.normal.map, {
        zoom: 7,
        center: { lat: 14.5, lng: 75.5 }
    });
    let behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
    let ui = H.ui.UI.createDefault(map, defaultLayers);
    let router = platform.getRoutingService(null, 8);  // Explicit v8 for routing
    let blueRoute, yellowRoute, userLocationMarker;
    let userLocation = null;
    let trackingWatcher = null;
   
    function showToast(message, type) {
        const toastContainer = document.getElementById("toastContainer");
        if (!toastContainer) return;
        const toast = document.createElement("div");
        toast.className = `toast ${type} show`;
        toast.innerText = message;
        toastContainer.appendChild(toast);
        setTimeout(() => { toast.classList.remove("show"); setTimeout(() => toast.remove(), 500); }, 5000);
    }

    // Test API key on load (optional)
    fetch(`https://router.hereapi.com/v8/routes?transportMode=car&origin=12.9172,74.8560&destination=12.9716,77.5946&return=summary`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
    }).catch(err => {
        if (err.message.includes('403')) showToast("❌ Invalid API key—get a new one from developer.here.com", "error");
    });

    function removePreviousRoute(route) {
        if (route) map.removeObject(route);
        return null;
    }

    function updateUserLocation(position) {
        userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
        if (userLocationMarker) map.removeObject(userLocationMarker);
        userLocationMarker = new H.map.Marker(userLocation);
        map.addObject(userLocationMarker);
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

    document.getElementById("enableLocation").addEventListener("click", function () {
        if (!navigator.geolocation) {
            showToast("❌ Geolocation not supported.", "error");
            return;
        }
   
        trackingWatcher = navigator.geolocation.watchPosition(
            (position) => {
                let lat = position.coords.latitude;
                let lng = position.coords.longitude;
                updateUserLocation(position);
                sendDriverLocationToServer(lat, lng);
            },
            (error) => {
                showToast("❌ Failed to access location.", "error");
            },
            { enableHighAccuracy: true }
        );
   
        showToast("✅ Location enabled!", "success");
    });
 
    document.getElementById("disableLocation").addEventListener("click", function () {
        if (trackingWatcher) navigator.geolocation.clearWatch(trackingWatcher);
        trackingWatcher = null;
        userLocation = null;
        if (userLocationMarker) map.removeObject(userLocationMarker);
        blueRoute = removePreviousRoute(blueRoute);
        showToast("❌ Location disabled!", "error");
    });

    function calculateRoute(start, end, color, updateTableInfo = false) {
        let routingParams = {
            'transportMode': 'car',
            'origin': `${start[0]},${start[1]}`,
            'destination': `${end[0]},${end[1]}`,
            'return': 'polyline,summary'
        };
       
        router.calculateRoute(routingParams, (result) => {
            if (result.routes.length === 0) {
                showToast("❌ No route found.", "error");
                return;
            }
           
            let routeShape = result.routes[0].sections[0].polyline;
            let routePoints = H.geo.LineString.fromFlexiblePolyline(routeShape);
            let newRoute = new H.map.Polyline(routePoints, { style: { strokeColor: color, lineWidth: 5 } });
   
            if (color === 'blue') {
                blueRoute = removePreviousRoute(blueRoute);
                blueRoute = newRoute;
            } else {
                yellowRoute = removePreviousRoute(yellowRoute);
                yellowRoute = newRoute;
            }
   
            map.addObject(newRoute);
            map.getViewModel().setLookAtData({ bounds: newRoute.getBoundingBox() });

            if (updateTableInfo) {
                let summary = result.routes[0].sections[0].summary;
                updateTable(summary.length / 1000, summary.duration / 60);
            }
        }, (error) => {
            console.error("Routing error:", error);
            if (error.details && error.details.includes("403")) {
                showToast("❌ Routing failed: Invalid API key or quota exceeded. Get a new key.", "error");
            } else {
                showToast("❌ Failed to generate route.", "error");
            }
        });
    }
   
    function sendDriverLocationToServer(lat, lng) {
        let startCoords = document.getElementById("startPoint").value.split(",").map(Number);
        let endCoords = document.getElementById("endPoint").value.split(",").map(Number);
   
        fetch("https://maj-65qm.onrender.com/update-location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                start: startCoords,
                end: endCoords,
                lat: lat,
                lng: lng
            })
        })
        .then(response => response.json())
        .then(data => {
            // Silent success—no toast spam
        })
        .catch(error => {
            console.error("Error sending location:", error);
        });
    }

    function updateUserRoute() {
        if (!userLocation) {
            showToast("❌ Cannot find user location.", "error");
            return;
        }
        let end = document.getElementById("endPoint").value.split(",").map(Number);
        let userStart = [userLocation.lat, userLocation.lng];
        calculateRoute(userStart, end, 'blue', true);
    }
   
    document.getElementById("routeBtn").addEventListener("click", function () {
        let startCoords = document.getElementById("startPoint").value.split(",").map(Number);
        let endCoords = document.getElementById("endPoint").value.split(",").map(Number);
        if (userLocation) {
            updateUserRoute();
        } else {
            calculateRoute(startCoords, endCoords, 'yellow', true);
        }
    });
   
    let idleTimer = null;
    function zoomToUserLocation() {
        if (userLocation) {
            map.setCenter(userLocation);
            map.setZoom(15);
        } else {
            showToast("❌ Location not available.", "error");
        }
    }
   
    function resetIdleTimer() {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(zoomToUserLocation, 10000);
    }
   
    map.addEventListener("pointerdown", resetIdleTimer);
    map.addEventListener("wheel", resetIdleTimer);
    map.addEventListener("touchstart", resetIdleTimer);
    map.addEventListener("dragstart", resetIdleTimer);
   
    document.getElementById("gpsLocator").addEventListener("click", zoomToUserLocation);
   
    document.getElementById("zoomIn").addEventListener("click", function () {
        let currentZoom = map.getZoom();
        map.setZoom(currentZoom + 1);
    });
   
    document.getElementById("zoomOut").addEventListener("click", function () {
        let currentZoom = map.getZoom();
        map.setZoom(currentZoom - 1);
    });
});

