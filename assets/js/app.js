// assets/js/app.js

// Fungsi Utilitas: Menghasilkan array tanggal harian (YYYY-MM-DD)
function generateDailyLabels(startDate, endDate) {
    let dates = [];
    let currDate = new Date(startDate);
    let lastDate = new Date(endDate);
    while(currDate <= lastDate) {
        dates.push(currDate.toISOString().split('T')[0]);
        currDate.setDate(currDate.getDate() + 1); // Tambah 1 hari
    }
    return dates;
}

const appState = {
    mode: 'historical',
    selectedProvinsi: '',
    selectedKabupaten: '',
    timeIndex: 0,
    timeLabels: [], // Akan diisi YYYY-MM-DD
    geoJsonIndo: null,
    isPlaying: false,
    playInterval: null,

    setMode: function(newMode) {
        this.mode = newMode;
        const btnHist = document.getElementById('btn-historis');
        const btnPred = document.getElementById('btn-prediksi');

        if (newMode === 'historical') {
            btnHist.className = "flex-1 py-2.5 px-md rounded-lg text-label-md font-bold transition-all duration-200 bg-white effect-3d-raised text-secondary";
            btnPred.className = "flex-1 py-2.5 px-md rounded-lg text-label-md font-medium transition-all duration-200 text-on-surface-variant hover:text-on-surface";
            document.getElementById('time-player-container').style.display = 'block';
        } else {
            btnPred.className = "flex-1 py-2.5 px-md rounded-lg text-label-md font-bold transition-all duration-200 bg-white effect-3d-raised text-secondary";
            btnHist.className = "flex-1 py-2.5 px-md rounded-lg text-label-md font-medium transition-all duration-200 text-on-surface-variant hover:text-on-surface";
            document.getElementById('time-player-container').style.display = 'none';
        }

        if (newMode === 'prediction') {
            map.removeLayer(hotspotClusterLayer);
            this.renderChoropleth();
        } else {
            if(choroplethLayer) map.removeLayer(choroplethLayer);
            map.addLayer(hotspotClusterLayer);
            this.loadMapData();
        }
    },

    // EVENT KETIKA PROVINSI BERUBAH
    onProvinsiChange: function(provName) {
        this.selectedProvinsi = provName;
        this.selectedKabupaten = ''; // Reset kabupaten
        
        const kabSelect = document.getElementById('kabupaten-filter');
        kabSelect.innerHTML = '<option value="">Semua Kab/Kota</option>';
        
        if (provName === '') {
            kabSelect.disabled = true;
            this.flyToRegion(''); // Kembali ke Indonesia
        } else {
            kabSelect.disabled = false;
            // Filter kabupaten yang ada di dalam provinsi ini (Logika ADM2_EN)
            const kabupatens = this.geoJsonIndo.features
                .filter(f => f.properties.ADM1_EN === provName)
                .map(f => f.properties.ADM2_EN)
                .sort();
            
            kabupatens.forEach(kab => {
                let option = document.createElement('option');
                option.value = kab; option.text = kab;
                kabSelect.appendChild(option);
            });
            
            // Zoom ke batas seluruh provinsi (gabungan poligon kabupaten)
            this.flyToRegion(provName, 'ADM1_EN');
        }

        this.loadChartData();
        this.mode === 'historical' ? this.loadMapData() : this.renderChoropleth();
    },

    // EVENT KETIKA KABUPATEN BERUBAH
    onKabupatenChange: function(kabName) {
        this.selectedKabupaten = kabName;
        
        if (kabName === '') {
            // Jika dikembalikan ke "Semua Kabupaten", zoom kembali ke Provinsi
            this.flyToRegion(this.selectedProvinsi, 'ADM1_EN');
        } else {
            // Zoom spesifik ke satu poligon Kabupaten
            this.flyToRegion(kabName, 'ADM2_EN');
        }

        this.loadChartData();
        this.mode === 'historical' ? this.loadMapData() : this.renderChoropleth();
    },

    // FUNGSI INTI FLY-TO & MENGGAMBAR BATAS (Sama persis seperti RegionBoundary.jsx)
    flyToRegion: function(regionName, level) {
        if (!this.geoJsonIndo) return;
        
        if(boundaryLayer) map.removeLayer(boundaryLayer);

        if (regionName === '') {
            map.flyTo([-2.5, 118], 5, { duration: 1.5 });
            return;
        }

        const regionFeatures = this.geoJsonIndo.features.filter(f => f.properties[level] === regionName);
        
        if (regionFeatures.length > 0) {
            boundaryLayer = L.geoJSON(regionFeatures, {
                style: { color: '#000', weight: 2, fillOpacity: 0 }
            }).addTo(map);

            const bounds = boundaryLayer.getBounds();
            map.flyToBounds(bounds, { duration: 1.5, padding: [50, 50] });
        }
    },

    loadMapData: async function() {
        const currentDate = this.timeLabels[this.timeIndex];
        document.getElementById('current-time-display').innerText = currentDate || 'Memuat...';
        
        // Prioritaskan filter kabupaten jika ada, kalau tidak gunakan provinsi
        const regionQuery = this.selectedKabupaten || this.selectedProvinsi;
        const data = await api.fetchHotspots(regionQuery, currentDate);
        if(typeof renderHotspots === 'function') renderHotspots(data);
    },

    loadChartData: async function() {
        const titleEl = document.getElementById('chart-title');
        const placeholderEl = document.getElementById('chart-placeholder');
        const wrapperEl = document.getElementById('chart-wrapper');

        // Jika filter masih di "Seluruh Indonesia"
        if (this.selectedProvinsi === '') {
            titleEl.innerText = 'Grafik Prediksi';
            placeholderEl.style.display = 'block'; // Tampilkan teks suruhan
            wrapperEl.style.display = 'none';      // Sembunyikan kanvas grafik
            return; // Hentikan fungsi di sini, jangan menembak API
        } 
        // Jika filter sudah memilih Provinsi (atau sampai Kabupaten)
        else {
            titleEl.innerText = `Prediksi Provinsi ${this.selectedProvinsi}`;
            placeholderEl.style.display = 'none';  // Sembunyikan teks suruhan
            wrapperEl.style.display = 'block';     // Munculkan kanvas grafik

            // PENTING: Walaupun kabupaten yang dipilih, untuk grafik kita TETAP 
            // menembak API menggunakan nama Provinsi, karena model SARIMA 
            // _time-series_ di backend dibuat pada level ADM1.
            const forecastData = await api.fetchForecast(this.selectedProvinsi);
            updateChartData(forecastData);
        }
    },

    renderChoropleth: async function() {
        // Ambil GeoJSON khusus choropleth yang sudah diproses oleh Python
        const choroplethData = await api.fetchChoropleth(); 
        if (!choroplethData) return;
        
        if(choroplethLayer) map.removeLayer(choroplethLayer);

        choroplethLayer = L.geoJSON(choroplethData, {
            style: function(feature) {
                const props = feature.properties;
                
                const score = feature.properties.predicted || 0;
                
                return { 
                    fillColor: getChoroplethColor(score), 
                    weight: 1, 
                    opacity: 1, 
                    color: 'white', 
                    fillOpacity: 0.7 
                };
            },
            onEachFeature: function(feature, layer) {
                const props = feature.properties;
                const areaName = props.ADM2_EN || props.ADM1_EN || "Wilayah";
                const score = feature.properties.predicted || 0;
                
                // Format angka agar menjadi 1 desimal jika berupa float
                const displayScore = typeof score === 'number' ? score.toFixed(1) : score;

                layer.bindPopup(`
                    <div class="leaflet-popup-card">
                        <div class="popup-title">${areaName}</div>
                        <div class="popup-row">
                            <span>Total Ramalan Titik Api (2026)</span>
                        </div>
                        <div class="popup-value">${displayScore}</div>
                    </div>
                `, {
                    minWidth: 220,
                    maxWidth: 280,
                    className: 'custom-popup'
                });
            }
        });
        
        choroplethLayer.addTo(map);

        if (boundaryLayer) {
            boundaryLayer.bringToFront();
        }
    }
};

// INITIALIZATION
document.addEventListener('DOMContentLoaded', async () => {
    initMap();
    initChart();

    setTimeout(() => {
        if(map) map.invalidateSize();
    }, 500);

    appState.geoJsonIndo = await api.fetchRegionsGeoJSON();
    
    if (appState.geoJsonIndo) {
        // Ambil array unik nama provinsi (ADM1_EN)
        const provinces = [...new Set(appState.geoJsonIndo.features.map(f => f.properties.ADM1_EN))].sort();
        const provSelect = document.getElementById('provinsi-filter');
        provinces.forEach(prov => {
            let option = document.createElement('option');
            option.value = prov; option.text = prov;
            provSelect.appendChild(option);
        });
    }

    // Buat deret harian untuk Time Player (2019-01-02 hingga 2026-01-02)
    appState.timeLabels = generateDailyLabels('2019-01-02', '2026-01-02');
    
    const slider = document.getElementById('time-slider');
    slider.max = appState.timeLabels.length - 1;
    
    slider.addEventListener('input', (e) => {
        appState.timeIndex = e.target.value;
        appState.loadMapData();
    });

    const playBtn = document.getElementById('play-pause-btn');
    playBtn.addEventListener('click', () => {
        appState.isPlaying = !appState.isPlaying;
        playBtn.innerText = appState.isPlaying ? '⏸' : '▶';
        
        if (appState.isPlaying) {
            appState.playInterval = setInterval(() => {
                if (appState.timeIndex >= slider.max) appState.timeIndex = 0;
                else appState.timeIndex++;
                
                slider.value = appState.timeIndex;
                appState.loadMapData();
            }, 2000); // Bergerak setiap 2 detik per HARI
        } else {
            clearInterval(appState.playInterval);
        }
    });

    appState.loadChartData();
    appState.loadMapData();
});

// =========================================================
// Fungsi Animasi Sidebar (Collapse & Expand)
// =========================================================
let isSidebarOpen = true;

function toggleSidebar() {
    const sidebar = document.getElementById('main-sidebar');
    const openBtn = document.getElementById('btn-open-sidebar');

    isSidebarOpen = !isSidebarOpen;

    if (isSidebarOpen) {
        // 1. Munculkan kembali sidebar (Margin ditarik ke 0)
        sidebar.style.marginLeft = "0px";
        
        // 2. Sembunyikan tombol biru di kiri atas
        openBtn.classList.add('opacity-0', 'pointer-events-none', 'scale-90');
        openBtn.classList.remove('opacity-100', 'pointer-events-auto', 'scale-100');
    } else {
        // 1. Geser sidebar ke kiri hingga menghilang di balik layar
        const currentWidth = sidebar.offsetWidth;
        sidebar.style.marginLeft = `-${currentWidth}px`;
        
        // 2. Tampilkan tombol biru di kiri atas
        openBtn.classList.remove('opacity-0', 'pointer-events-none', 'scale-90');
        openBtn.classList.add('opacity-100', 'pointer-events-auto', 'scale-100');
    }
    
    // PENTING: Perintahkan Leaflet Map menggambar ulang petanya
    // karena ukuran kanvas `<main>` telah membesar / mengecil.
    setTimeout(() => {
        if (typeof map !== 'undefined' && map != null) {
            map.invalidateSize();
        }
    }, 300); // 300ms sesuai durasi animasi Tailwind
}