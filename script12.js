document.addEventListener("DOMContentLoaded", function () {
    const apiKey = "mzDLjmDOdq62sKIc4y81FgMv8pqj2ndZWPBraNyCm2w";
    let platform = new H.service.Platform({ 'apikey': apiKey });
    let defaultLayers = platform.createDefaultLayers();
    let map = new H.Map(document.getElementById('map'), defaultLayers.vector.normal.map, {
        zoom: 7,
        center: { lat: 14.5, lng: 75.5 }
    });

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
                console.log("Driver location fetched:", driverLocation);
                updateDriverLocation(driverLocation.lat, driverLocation.lng);
                return true;
            } else {
                console.log("No active driver found.");
                return false;
            }
        } catch (error) {
            alert("Error connecting to the server. Please try again.");
            console.error("Error fetching driver location:", error);
            return false;
        }
    }
// Fetch passenger count when start and end coordinates are provided
async function fetchPassengerCount(startCoords, endCoords) {
    try {
        // Construct URL without stringifying the coordinates
        const response = await fetch(`https://maj-65qm.onrender.com/get-passenger-count?start=${startCoords.join(",")}&end=${endCoords.join(",")}`);
        
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();

        if (data && data.passengerCount !== undefined) {
            console.log("Passenger count fetched:", data.passengerCount);
            updatePassengerDisplay(data.passengerCount);
        } else {
            console.log("No passenger data found.");
            updatePassengerDisplay("N/A");
        }
    } catch (error) {
        alert("Error connecting to the server. Please try again.");
        console.error("Error fetching passenger count:", error);
    }
}

    document.getElementById("checkDriver").addEventListener("click", () => {
    const startValue = document.getElementById("start").value;
    const endValue = document.getElementById("end").value;

    if (startValue && endValue) {
        const startCoords = startValue.split(",").map(Number);
        const endCoords = endValue.split(",").map(Number);

        fetchPassengerCount(startCoords, endCoords);
    }
});


function updatePassengerDisplay(count) {
    const displayBox = document.getElementById("passengerCountDisplay");
    const tableCell = document.getElementById("passengerCountTable");
console.log("Displaying in:", document.getElementById("passengerCountDisplay"));

    const text = `👥 Passengers: ${count}`;
    if (displayBox) displayBox.textContent = text;
    if (tableCell) tableCell.textContent = count;
}


    function updateDriverLocation(lat, lng) {
        if (driverMarker) map.removeObject(driverMarker);
        driverMarker = new H.map.Marker({ lat, lng });
        map.addObject(driverMarker);
    }

    function calculateRoute(start, end) {
        if (!start || !end) {
            showToast("Error: Missing driver location or destination!", "error");
            return;
        }

        let router = platform.getRoutingService(null, 8);
        let routeParams = {
            routingMode: 'fast',
            transportMode: 'car',
            origin: `${start.lat},${start.lng}`,
            destination: `${end.lat},${end.lng}`,
            return: 'polyline,summary'
        };

        router.calculateRoute(routeParams, function (result) {
            if (!result.routes.length || !result.routes[0].sections) {
                alert("No route found!");
                return;
            }

            if (routeLine) {
                map.removeObject(routeLine);
            }

            let route = result.routes[0];
            let lineString = new H.geo.LineString();

            route.sections.forEach(section => {
                let coords = H.geo.LineString.fromFlexiblePolyline(section.polyline);
                coords.getLatLngAltArray().forEach((value, index, array) => {
                    if (index % 3 === 0) {
                        lineString.pushLatLngAlt(array[index], array[index + 1]);
                    }
                });
            });

            routeLine = new H.map.Polyline(lineString, { style: { strokeColor: 'blue', lineWidth: 4 } });
            map.addObject(routeLine);

            let distance = (route.sections[0].summary.length / 1000).toFixed(2);
            let travelTime = Math.ceil(route.sections[0].summary.duration / 60);
            document.getElementById("distanceToDriver").innerText = `${distance} km`;
            document.getElementById("ETA").innerText = `${travelTime} min`;

        }, function (error) {
            alert("Error calculating route: " + error);
        });
    }

    // ✅ Selecting Location on Map
    map.addEventListener('tap', function (evt) {
        let coord = map.screenToGeo(evt.currentPointer.viewportX, evt.currentPointer.viewportY);
        selectedLocation = { lat: coord.lat, lng: coord.lng };

        if (selectedMarker) map.removeObject(selectedMarker);
        selectedMarker = new H.map.Marker(selectedLocation);
        map.addObject(selectedMarker);

        alert(`Location Selected: ${selectedLocation.lat}, ${selectedLocation.lng}`);
    });

    // ✅ Checking for Driver & Route Calculation
    document.getElementById("checkDriver").addEventListener("click", async function () {
        let startSelect = document.getElementById("start");
        let endSelect = document.getElementById("end");

        if (!startSelect.value || !endSelect.value) {
            alert("Please select both start and end locations first.");
            return;
        }

        if (!selectedLocation) {
            alert("Please select a location on the map.");
            return;
        }

        let startCoords = startSelect.value.split(",").map(Number);
        let endCoords = endSelect.value.split(",").map(Number);

        let driverFound = await fetchDriverLocation(startCoords, endCoords);
        if (!driverFound) {
            showToast("No active driver found.", "info");
            return;
        }

        alert(`Generating route from Driver (${driverLocation.lat}, ${driverLocation.lng}) to Selected Location (${selectedLocation.lat}, ${selectedLocation.lng})`);
        calculateRoute(driverLocation, selectedLocation);
    });

    // ✅ Toast Message Function
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
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 500);
        }, 3000);
    }

    // ✅ GPS Locator - Uses Selected Location from Map
    document.getElementById("gpsLocator").addEventListener("click", function () {
        if (!selectedLocation) {
            alert("Please select a location on the map first.");
            return;
        }

        // Center the map on the selected location
        map.setCenter({ lat: selectedLocation.lat, lng: selectedLocation.lng });
        map.setZoom(15); // Adjust zoom level if needed
    });

    // ✅ Zoom Controls
    document.getElementById("zoomIn").addEventListener("click", function () {
        let currentZoom = map.getZoom();
        map.setZoom(currentZoom + 1);
    });

    document.getElementById("zoomOut").addEventListener("click", function () {
        let currentZoom = map.getZoom();
        map.setZoom(currentZoom - 1);
    });

    // ✅ Current Time Updater
    function updateCurrentTime() {
        let now = new Date();
        let formattedTime = now.toLocaleTimeString();
        document.getElementById("currentTime").innerText = formattedTime;
    }

    setInterval(updateCurrentTime, 1000);
    updateCurrentTime();  // Call immediately to set initial time

});
