document.addEventListener("DOMContentLoaded", function () {
    const apiKey = "722df4584b57104bba14c7cd877490ce"; // ✅ ipstack API key
    const locationDisplay = document.getElementById("locationDisplay");
    const coordsDisplay = document.getElementById("coordsDisplay");
    const currentTimeDisplay = document.getElementById("currentTime");

    // ✅ Function to show toast messages
    function showToast(message, type) {
        const toastContainer = document.getElementById("toastContainer");
        if (!toastContainer) return;
        const toast = document.createElement("div");
        toast.className = `toast ${type} show`;
        toast.innerText = message;
        toastContainer.appendChild(toast);
        setTimeout(() => { 
            toast.classList.remove("show"); 
            setTimeout(() => toast.remove(), 500); 
        }, 4000);
    }

    // ✅ Get user location via IPStack
    async function fetchLocation() {
        try {
            const response = await fetch(`https://api.ipstack.com/check?access_key=${apiKey}`);
            const data = await response.json();

            if (data && data.latitude && data.longitude) {
                const { city, region_name, country_name, latitude, longitude } = data;

                if (locationDisplay)
                    locationDisplay.innerText = `${city}, ${region_name}, ${country_name}`;

                if (coordsDisplay)
                    coordsDisplay.innerText = `Lat: ${latitude}, Lng: ${longitude}`;

                showToast("✅ Location fetched successfully!", "success");
            } else {
                showToast("❌ Failed to fetch location data.", "error");
            }
        } catch (error) {
            console.error("Error fetching location:", error);
            showToast("❌ Error fetching location.", "error");
        }
    }

    // ✅ Update current time every second
    function updateTime() {
        let now = new Date();
        if (currentTimeDisplay)
            currentTimeDisplay.innerText = now.toLocaleTimeString();
    }
    setInterval(updateTime, 1000);
    updateTime();

    // ✅ Event listener for button click
    document.getElementById("getLocationBtn").addEventListener("click", fetchLocation);
});
