// assets/js/chart.js

let forecastChartInstance = null;

function initChart() {
    const ctx = document.getElementById('forecastChart').getContext('2d');
    
    forecastChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Historis',
                    data: [],
                    borderColor: '#475569',
                    borderWidth: 2,
                    pointRadius: 1,
                    pointHoverRadius: 5,
                    fill: false,
                    tension: 0.3
                },
                {
                    label: 'Prediksi (2026)',
                    data: [],
                    borderColor: '#ba1a1a',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 1,
                    pointHoverRadius: 5,
                    fill: false,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            
            interaction: {
                mode: 'index',
                intersect: false, 
            },
            
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        font: { size: 10 }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#0b1c30',
                    bodyColor: '#434751',
                    borderColor: '#c3c6d3',
                    borderWidth: 1,
                    padding: 10,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                // Membulatkan angka desimal prediksi agar lebih enak dibaca
                                label += context.parsed.y.toFixed(1); 
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        maxTicksLimit: 6,
                        font: { size: 10 }
                    },
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    ticks: { font: { size: 10 } },
                    grid: { color: '#e5eeff' }
                }
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