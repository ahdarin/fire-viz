// assets/js/utils.js

// Konstanta API Backend Anda (FastAPI)
const API_BASE_URL = 'https://ahdarin-fire-viz.hf.space/api';

// Palet warna untuk kategori FRP (Fire Radiative Power)
const FRP_COLORS = {
    'Low (< 10 MW)': '#ffb74d',
    'Moderate (10-100 MW)': '#f57c00',
    'High (100-500 MW)': '#d32f2f',
    'Extreme (> 500 MW)': '#7f0000',
};

// Palet warna untuk Choropleth Kerawanan Prediksi (SARIMA)
function getChoroplethColor(value) {
    // Sesuaikan rentang threshold ini dengan output model SARIMA Anda
    return value > 1000 ? '#800026' :
           value > 500  ? '#BD0026' :
           value > 200  ? '#E31A1C' :
           value > 100  ? '#FC4E2A' :
           value > 50   ? '#FD8D3C' :
           value > 20   ? '#FEB24C' :
           value > 10   ? '#FED976' :
                          '#FFEDA0';
}