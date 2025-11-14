<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Driver Live Tracker</title>
  <!-- ✅ Leaflet CSS + JS -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <link rel="stylesheet" href="styles.css" />
  <style>
    #map {
      height: 75vh;
      width: 100%;
      margin-top: 10px;
    }
    .controls, .info-table {
      margin: 10px;
    }
    button {
      margin: 3px;
      padding: 8px 12px;
      border: none;
      border-radius: 6px;
      background-color: #007bff;
      color: white;
      cursor: pointer;
    }
    button:hover {
      background-color: #0056b3;
    }
    .toast-container {
      position: fixed;
      bottom: 10px;
      right: 10px;
      z-index: 9999;
    }
    .toast {
      margin-top: 5px;
      padding: 10px 15px;
      border-radius: 5px;
      background: #333;
      color: white;
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.3s;
    }
    .toast.show {
      opacity: 1;
      transform: translateY(0);
    }
  </style>
</head>
<body>
  <h2>🚗 Driver Route & Location Tracker</h2>
  <div class="controls">
    <label>Start Point:</label>
    <select id="startPoint">
            <option value="12.9172,74.8560">🚌 Mangalore KSRTC</option>
            <option value="12.9716,77.5946">🚌 Majestic, Bengaluru</option>
            <option value="13.3409,74.7421">🚌 Udupi</option>
            <option value="14.4530,75.9215">🚌 Shivamogga</option>
            <option value="15.3647,75.1239">🚌 Hubli</option>
            <option value="15.8497,74.4977">🚌 Belagavi</option>
            <option value="12.2958,76.6394">🚌 Mysuru</option>
        </select>
        <select id="endPoint">
            <option value="12.9172,74.8560">🚌 Mangalore KSRTC</option>
            <option value="12.9716,77.5946">🚌 Majestic, Bengaluru</option>
            <option value="13.3409,74.7421">🚌 Udupi</option>
            <option value="14.4530,75.9215">🚌 Shivamogga</option>
            <option value="15.3647,75.1239">🚌 Hubli</option>
            <option value="15.8497,74.4977">🚌 Belagavi</option>
            <option value="12.2958,76.6394">🚌 Mysuru</option>
        </select>
  </div>
  <div class="controls">
    <button id="enableLocation">Enable Location</button>
    <button id="disableLocation">Disable Location</button>
    <button id="routeBtn">Generate Route</button>
    <button id="gpsLocator">📍</button>
    <button id="zoomIn">+</button>
    <button id="zoomOut">−</button>
  </div>
  <div id="map"></div>
  <div class="info-table">
    <table>
      <tr><td>⏰ Current Time:</td><td id="currentTime">--:--:--</td></tr>
      <tr><td>📏 Distance:</td><td id="distance">-- km</td></tr>
      <tr><td>⏳ ETA:</td><td id="estimatedTime">-- min</td></tr>
    </table>
  </div>
  <div id="toastContainer" class="toast-container"></div>
  <script src="script.js"></script>
</body>
</html>
