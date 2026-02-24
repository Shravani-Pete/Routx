// Mock data for 20 bins around Amravati, Maharashtra
const BIN_COUNT = 20;
const CENTER_LAT = 20.9320;
const CENTER_LNG = 77.7523;

let bins = [];
let map;
let markerCluster; // Using a cluster for 1000 bins
let markers = [];
let routeLine;

// Initialize bins with random locations and fill levels
function initBins() {
    for (let i = 1; i <= BIN_COUNT; i++) {
        bins.push({
            id: `RX-${String(i).padStart(4, '0')}`,
            lat: CENTER_LAT + (Math.random() - 0.5) * 0.08,
            lng: CENTER_LNG + (Math.random() - 0.5) * 0.08,
            fill: Math.floor(Math.random() * 101),
            lastUpdated: new Date().toLocaleTimeString(),
            priority: Math.floor(Math.random() * 10) + 1,
            prediction: Math.floor(Math.random() * 8) + 1
        });
    }
}

// Get status based on fill percentage
function getStatus(fill) {
    if (fill < 50) return { label: 'Low', color: '#22c55e', class: 'status-low' };
    if (fill < 75) return { label: 'Medium', color: '#f59e0b', class: 'status-medium' };
    return { label: 'Critical', color: '#ef4444', class: 'status-full' };
}

// Update Map Markers
function updateMap() {
    if (!map) {
        map = L.map('map').setView([CENTER_LAT, CENTER_LNG], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);

        // Final fallback for flex containers
        window.addEventListener('load', () => map.invalidateSize());
        setTimeout(() => { map.invalidateSize(); }, 500);

        const mapEl = document.getElementById('map');
        if (mapEl) {
            mapEl.style.height = '100%';
            mapEl.style.width = '100%';
            mapEl.style.filter = "invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)";
        }

        // Force refresh
        map.eachLayer(layer => {
            if (layer._url) layer.redraw();
        });
    }

    // Clear existing markers
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    // console.log("Updating markers for Amravati...", bins.length);
    bins.forEach(bin => {
        const status = getStatus(bin.fill);
        const marker = L.circleMarker([bin.lat, bin.lng], {
            radius: 12,  // Larger markers for better visibility
            fillColor: status.color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
        }).addTo(map);

        marker.bindPopup(`
            <div style="color: #333; font-family: 'Inter', sans-serif; min-width: 150px;">
                <strong style="font-size: 1rem; color: #0f172a;">Bin ID: ${bin.id}</strong><hr style="margin: 5px 0;">
                <div style="margin-bottom: 4px;"><b>Fill Level:</b> <span style="color: ${status.color}; font-weight: bold;">${bin.fill}%</span></div>
                <div style="margin-bottom: 4px;"><b>Priority:</b> ${bin.priority}/10</div>
                <div style="margin-bottom: 4px;"><b>Predicted Overflow:</b> ${bin.prediction}h</div>
                <small style="color: #666;">Updated: ${bin.lastUpdated}</small>
            </div>
        `);

        markers.push(marker);
    });
}

// Update Dashboard Stats
function updateStats() {
    const totalBinsEl = document.getElementById('total-bins');
    if (!totalBinsEl) return;

    const critical = bins.filter(b => b.fill >= 75).length;
    const medium = bins.filter(b => b.fill >= 50 && b.fill < 75).length;
    const low = bins.filter(b => b.fill < 50).length;
    const avgFill = Math.round(bins.reduce((a, b) => a + b.fill, 0) / bins.length);

    totalBinsEl.innerText = bins.length;
    if (document.getElementById('full-bins')) document.getElementById('full-bins').innerText = critical;
    if (document.getElementById('medium-bins')) document.getElementById('medium-bins').innerText = medium;
    if (document.getElementById('low-bins')) document.getElementById('low-bins').innerText = low;

    // Monitoring Page specific stats
    if (document.getElementById('critical-count')) document.getElementById('critical-count').innerText = critical;
    if (document.getElementById('avg-fill')) document.getElementById('avg-fill').innerText = avgFill + '%';
    if (document.getElementById('active-trucks')) document.getElementById('active-trucks').innerText = '12';
    if (document.getElementById('next-overflow')) document.getElementById('next-overflow').innerText = '2.5 Hours';
}

// Update Data Table
function updateTable() {
    const tableBody = document.getElementById('bin-data');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    bins.forEach(bin => {
        const status = getStatus(bin.fill);
        const row = `
            <tr>
                <td>${bin.id}</td>
                <td>${bin.fill}%</td>
                <td class="${status.class}">${status.label}</td>
                <td>${bin.lastUpdated}</td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}

// Simulate real-time data fetching
function fetchData() {
    bins = bins.map(bin => {
        const newFill = Math.min(100, Math.max(0, bin.fill + (Math.random() * 4 - 1.5)));
        return {
            ...bin,
            fill: Math.round(newFill * 10) / 10,
            lastUpdated: new Date().toLocaleTimeString()
        };
    });

    if (document.getElementById('map')) updateMap();
    if (document.getElementById('bin-data')) updateTable();
    updateStats();
}

// Simple Route Generation (Connects critical bins)
function generateRoute() {
    const criticalBins = bins.filter(b => b.fill >= 75).slice(0, 15); // Connect top 15 critical for demo
    if (criticalBins.length < 2) {
        alert("Not enough critical bins to generate a route!");
        return;
    }

    if (routeLine) map.removeLayer(routeLine);

    const latlngs = criticalBins.map(b => [b.lat, b.lng]);
    routeLine = L.polyline(latlngs, { color: '#22c55e', weight: 4, dashArray: '10, 10', opacity: 0.8 }).addTo(map);
    map.fitBounds(routeLine.getBounds());
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initBins();

    // Explicitly call updateMap for Monitoring page immediately
    if (document.getElementById('map')) {
        updateMap();
    }

    fetchData();
    setInterval(fetchData, 8000); // Slower updates for 20 bins

    const routeBtn = document.getElementById('generate-route');
    if (routeBtn) {
        routeBtn.addEventListener('click', generateRoute);
    }
});
