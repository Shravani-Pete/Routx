// Mock data for 20 bins (1 physical + 19 virtual) around a central point (e.g., a city center)
const BIN_COUNT = 20;
const CENTER_LAT = 18.5204;
const CENTER_LNG = 73.8567;

let bins = [];
let map;
let markers = [];
let routeLine;

// Initialize bins with random locations and fill levels
function initBins() {
    for (let i = 1; i <= BIN_COUNT; i++) {
        bins.push({
            id: `BIN-${String(i).padStart(3, '0')}`,
            lat: CENTER_LAT + (Math.random() - 0.5) * 0.02,
            lng: CENTER_LNG + (Math.random() - 0.5) * 0.02,
            fill: Math.floor(Math.random() * 101),
            lastUpdated: new Date().toLocaleTimeString()
        });
    }
}

// Get status based on fill percentage
function getStatus(fill) {
    if (fill < 50) return { label: 'Low', color: 'green', class: 'status-low' };
    if (fill < 85) return { label: 'Medium', color: 'orange', class: 'status-medium' };
    return { label: 'Full', color: 'red', class: 'status-full' };
}

// Update Map Markers
function updateMap() {
    if (!map) {
        map = L.map('map').setView([CENTER_LAT, CENTER_LNG], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
    }

    // Clear existing markers
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    bins.forEach(bin => {
        const status = getStatus(bin.fill);
        const marker = L.circleMarker([bin.lat, bin.lng], {
            radius: 10,
            fillColor: status.color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(map);

        marker.bindPopup(`
            <strong>Bin ID: ${bin.id}</strong><br>
            Fill Level: ${bin.fill}% (${status.label})<br>
            Last Updated: ${bin.lastUpdated}
        `);

        markers.push(marker);
    });
}

// Update Dashboard Stats
function updateStats() {
    if (!document.getElementById('total-bins')) return;

    const full = bins.filter(b => b.fill >= 85).length;
    const medium = bins.filter(b => b.fill >= 50 && b.fill < 85).length;
    const low = bins.filter(b => b.fill < 50).length;

    document.getElementById('total-bins').innerText = bins.length;
    document.getElementById('full-bins').innerText = full;
    document.getElementById('medium-bins').innerText = medium;
    document.getElementById('low-bins').innerText = low;
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
    // In a real app, you would use:
    // axios.get('/api/bins').then(res => { bins = res.data; ... })
    
    // Simulating updates for mock demo
    bins = bins.map(bin => ({
        ...bin,
        fill: Math.min(100, Math.max(0, bin.fill + (Math.random() * 10 - 5))),
        lastUpdated: new Date().toLocaleTimeString()
    }));

    if (document.getElementById('map')) updateMap();
    if (document.getElementById('bin-data')) updateTable();
    updateStats();
}

// Simple Route Generation (Connects full bins)
function generateRoute() {
    const fullBins = bins.filter(b => b.fill >= 85);
    if (fullBins.length < 2) {
        alert("Not enough full bins to generate a route!");
        return;
    }

    if (routeLine) map.removeLayer(routeLine);

    const latlngs = fullBins.map(b => [b.lat, b.lng]);
    routeLine = L.polyline(latlngs, { color: 'blue', weight: 4, dashArray: '10, 10' }).addTo(map);
    map.fitBounds(routeLine.getBounds());
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initBins();
    fetchData();
    setInterval(fetchData, 5000);

    const routeBtn = document.getElementById('generate-route');
    if (routeBtn) {
        routeBtn.addEventListener('click', generateRoute);
    }
});