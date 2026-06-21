// assets/js/map_layers.js

let map;
let hotspotClusterLayer;
let choroplethLayer;
let boundaryLayer;

// Inisialisasi Peta (Dipanggil dari app.js nanti)
function initMap() {
    // Matikan zoomControl bawaan (kiri atas)
    map = L.map('map', { zoomControl: false }).setView([-2.5, 118], 5);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    // Konfigurasi Cluster dengan Kustomisasi Tampilan "Lingkaran Choropleth"
    hotspotClusterLayer = L.markerClusterGroup({
        iconCreateFunction: function(cluster) {
            // Dapatkan jumlah titik dalam satu cluster
            const childCount = cluster.getChildCount();
            
            // Logika untuk menentukan ukuran dan warna (Choropleth logic)
            let size, bgColor, borderColor;
            
            if (childCount < 10) {
                size = 40;
                bgColor = 'rgba(254, 217, 118, 0.8)'; // Kuning
                borderColor = '#FEB24C';
            } else if (childCount < 50) {
                size = 55;
                bgColor = 'rgba(253, 141, 60, 0.8)';  // Oranye
                borderColor = '#FC4E2A';
            } else if (childCount < 150) {
                size = 70;
                bgColor = 'rgba(227, 26, 28, 0.8)';   // Merah
                borderColor = '#BD0026';
            } else {
                size = 85;
                bgColor = 'rgba(128, 0, 38, 0.9)';    // Merah Gelap/Maroon
                borderColor = '#4d0017';
            }

            // Kembalikan custom DivIcon HTML
            return new L.DivIcon({
                html: `
                    <div style="
                        background-color: ${bgColor}; 
                        width: ${size}px; 
                        height: ${size}px; 
                        border-radius: 50%; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        border: 3px solid ${borderColor};
                        box-shadow: 0 0 10px rgba(0,0,0,0.3);
                        transition: all 0.3s ease;
                    ">
                        <span style="color: white; font-weight: bold; font-size: ${size/3}px;">
                            ${childCount}
                        </span>
                    </div>
                `,
                className: 'custom-choropleth-cluster',
                iconSize: new L.Point(size, size)
            });
        }
    });

    map.addLayer(hotspotClusterLayer);
}

// Fungsi untuk me-render titik-titik tunggal (saat di-zoom in)
function renderHotspots(geojsonData) {
    hotspotClusterLayer.clearLayers(); // Bersihkan titik lama
    
    const geoJsonLayer = L.geoJSON(geojsonData, {
        pointToLayer: function(feature, latlng) {
            // Styling titik individu berdasarkan frp (Fire Radiative Power)
            let color = '#ffb74d'; // Default low
            if (feature.properties.frp > 100) color = '#d32f2f'; // High
            
            return L.circleMarker(latlng, {
                radius: 6,
                fillColor: color,
                color: '#fff',
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            }).bindPopup(`
                <div class="leaflet-popup-card">
                    <div class="popup-title">Detail Hotspot</div>

                    <div class="popup-item">
                        <span class="popup-label">Tanggal</span>
                        <span class="popup-data">${feature.properties.datetime}</span>
                    </div>

                    <div class="popup-item">
                        <span class="popup-label">FRP</span>
                        <span class="popup-data">${feature.properties.frp_category}</span>
                    </div>

                    <div class="popup-item">
                        <span class="popup-label">Confidence</span>
                        <span class="popup-data">${feature.properties.confidence_label}</span>
                    </div>
                </div>
            `, {
                minWidth: 240,
                maxWidth: 300,
                className: 'custom-popup'
            });
        }
    });

    hotspotClusterLayer.addLayer(geoJsonLayer);
}