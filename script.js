document.addEventListener("DOMContentLoaded", function () {
    const hereApiKey = "mzDLjmDOdq62sKIc4y81FgMv8pqj2ndZWPBraNyCm2w";
    const graphhopperKey = "e2fea1cd-bbea-428b-a974-0d63d55bb01d";

    let platform = new H.service.Platform({ apikey: hereApiKey });
    let defaultLayers = platform.createDefaultLayers();

    let map = new H.Map(document.getElementById('map'),
        defaultLayers.vector.normal.map,
        { zoom: 7, center: { lat: 14.5, lng: 75.5 } });

    let behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
    let ui = H.ui.UI.createDefault(map, defaultLayers);

    let driverMarker, selectedMarker, routeLine;
    let driverLocation = null;
    let selectedLocation = null;

    async function fetchDriverLocation(startCoords, endCoords) {
        try {
            let response = await fetch(`https://maj-65qm.onrender.com/get-driver-location?start=${JSON.stringify(startCoords)}&end=${JSON.stringify(endCoords)}`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            let data = await response.json();
            if (data && data.driverLocation) {
                driverLocation = data.driverLocation;
                updateDriverLocation(driverLocation.lat, driverLocation.lng);
                return true;
            } else {
                showToast("No active driver found.", "info");
                return false;
            }
        } catch (error) {
            alert("Error connecting to server. Please try again.");
            return false;
        }
    }

    function updateDriverLocation(lat, lng) {
        if (driverMarker) map.removeObject(driverMarker);
        driverMarker = new H.map.Marker({ lat, lng });
        map.addObject(driverMarker);
    }

    // ✅ Replace HERE routing with GraphHopper
    async function calculateRoute(start, end) {
        if (!start || !end) {
            showToast("Error: Missing driver or destination!", "error");
            return;
        }

        const url = `https://graphhopper.com/api/1/route?point=${start.lat},${start.lng}&point=${end.lat},${end.lng}&vehicle=car&locale=en&points_encoded=false&key=${graphhopperKey}`;

        try {
            const res = await fetch(url);
            const data = await res.json();

            if (!data.paths || data.paths.length === 0) {
                alert("No route found!");
                return;
            }

            if (routeLine) map.removeObject(routeLine);

            const path = data.paths[0];
            const coords = path.points.coordinates;

            const lineString = new H.geo.LineString();
            coords.forEach(c => lineString.pushLatLngAlt(c[1], c[0]));

            routeLine = new H.map.Polyline(lineString, {
                style: { strokeColor: 'blue', lineWidth: 4 }
            });
            map.addObject(routeLine);

            let distance = (path.distance / 1000).toFixed(2);
            let travelTime = Math.ceil(path.time / 60000);

            document.getElementById("distanceToDriver").innerText = `${distance} km`;
            document.getElementById("ETA").innerText = `${travelTime} min`;

        } catch (error) {
            alert("Error calculating route with GraphHopper: " + error);
        }
    }

    map.addEventListener('tap', function (evt) {
        let coord = map.screenToGeo(evt.currentPointer.viewportX, evt.currentPointer.viewportY);
        selectedLocation = { lat: coord.lat, lng: coord.lng };
        if (selectedMarker) map.removeObject(selectedMarker);
        selectedMarker = new H.map.Marker(selectedLocation);
        map.addObject(selectedMarker);
        alert(`Location Selected: ${coord.lat}, ${coord.lng}`);
    });

    document.getElementById("checkDriver").addEventListener("click", async function () {
        let startSelect = document.getElementById("start");
        let endSelect = document.getElementById("end");

        if (!startSelect.value || !endSelect.value) {
            alert("Please select both start and end locations.");
            return;
        }
        if (!selectedLocation) {
            alert("Please select a location on the map.");
            return;
        }

        let startCoords = startSelect.value.split(",").map(Number);
        let endCoords = endSelect.value.split(",").map(Number);

        let driverFound = await fetchDriverLocation(startCoords, endCoords);
        if (!driverFound) return;

        calculateRoute(driverLocation, selectedLocation);
    });

    function showToast(message, type) {
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }

        let toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    document.getElementById("gpsLocator").addEventListener("click", function () {
        if (!selectedLocation) {
            alert("Select a location first.");
            return;
        }
        map.setCenter(selectedLocation);
        map.setZoom(15);
    });

    document.getElementById("zoomIn").addEventListener("click", function () {
        map.setZoom(map.getZoom() + 1);
    });

    document.getElementById("zoomOut").addEventListener("click", function () {
        map.setZoom(map.getZoom() - 1);
    });

    function updateCurrentTime() {
        let now = new Date();
        document.getElementById("currentTime").innerText = now.toLocaleTimeString();
    }

    setInterval(updateCurrentTime, 1000);
    updateCurrentTime();
});
