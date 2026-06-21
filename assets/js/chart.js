// assets/js/chart.js

let forecastChartInstance = null;

function initChart() {
    const ctx = document.getElementById('forecastChart').getContext('2d');
    
    forecastChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [], // Akan diisi bulan/tahun
            datasets: [
                {
                    label: 'Historis (2019-2025)',
                    data: [],
                    borderColor: '#333',
                    backgroundColor: 'rgba(51, 51, 51, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.2
                },
                {
                    label: 'Prediksi SARIMA (2026)',
                    data: [],
                    borderColor: '#d32f2f', // Merah
                    borderDash: [5, 5], // Garis putus-putus
                    borderWidth: 2,
                    backgroundColor: 'rgba(211, 47, 47, 0.2)',
                    fill: true,
                    tension: 0.2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            },
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Jumlah Titik Api' } },
                x: { title: { display: true, text: 'Waktu' } }
            }
        }
    });
}

function updateChartData(forecastData) {
    if (!forecastChartInstance) return;

    // Jika data kosong atau format salah (misal gagal ambil data), bersihkan grafik
    if (!forecastData || !forecastData.historical) {
        forecastChartInstance.data.labels = [];
        forecastChartInstance.data.datasets[0].data = [];
        forecastChartInstance.data.datasets[1].data = [];
        forecastChartInstance.update();
        return;
    }

    let labels = [];
    let history = [];
    let prediction = [];

    // 1. Ekstrak Data Historis (2019 - 2025)
    if (Array.isArray(forecastData.historical)) {
        forecastData.historical.forEach(item => {
            labels.push(item.date);
            history.push(item.value);
            prediction.push(null); // Isi null agar garis prediksi tidak muncul di masa lalu
        });
    }

    // Trik Visual: Salin nilai historis terakhir ke array prediksi 
    // agar garis hitam dan merah tersambung sempurna tanpa ada celah kosong
    if (history.length > 0) {
        prediction[prediction.length - 1] = history[history.length - 1];
    }

    // 2. Ekstrak Data Prediksi (2026)
    if (Array.isArray(forecastData.forecast)) {
        forecastData.forecast.forEach(item => {
            labels.push(item.date);
            history.push(null); // Isi null agar garis historis berhenti di tahun 2025
            prediction.push(item.value);
        });
    }

    // 3. Masukkan data yang sudah di-mapping ke dalam instance Chart.js
    forecastChartInstance.data.labels = labels;
    forecastChartInstance.data.datasets[0].data = history;
    forecastChartInstance.data.datasets[1].data = prediction;
    
    // 4. Perintahkan Chart.js menggambar ulang layar
    forecastChartInstance.update();
}