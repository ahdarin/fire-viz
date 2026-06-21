// assets/js/api.js

const api = {
    // 1. Mengambil data GeoJSON batas wilayah Indonesia
    fetchRegionsGeoJSON: async () => {
        try {
            // Karena ini file statis besar, kita ambil dari lokal
            const response = await axios.get('data/kab_kota_indo.json');
            return response.data;
        } catch (error) {
            console.error("Gagal memuat batas wilayah:", error);
            return null;
        }
    },

    // 2. Mengambil data titik api historis berdasarkan wilayah dan waktu
    fetchHotspots: async (regionName, dateStr) => {
        try {
            let endpoint = `${API_BASE_URL}/hotspots`;
            let params = {};
            if (regionName) params.region = regionName;
            if (dateStr) params.date = dateStr;

            const response = await axios.get(endpoint, { params });
            const rawData = response.data; // Array of objects dari FastAPI/Pandas

            // Transformasi ringan (O(n)) dari Array ke format GeoJSON untuk Leaflet
            const geoJson = {
                type: "FeatureCollection",
                features: rawData.map(item => ({
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        // Catatan spasial: GeoJSON selalu menggunakan urutan [Longitude, Latitude]
                        coordinates: [item.longitude, item.latitude] 
                    },
                    properties: {
                        ...item // Masukkan data seperti frp, datetime, dll ke dalam properties
                    }
                }))
            };

            return geoJson; 
        } catch (error) {
            console.error("Gagal memuat data titik api:", error);
            return { type: "FeatureCollection", features: [] };
        }
    },

    // 3. Mengambil hasil agregasi dan prediksi SARIMA
    fetchForecast: async (regionName) => {
        try {
            let endpoint = regionName 
                ? `${API_BASE_URL}/forecast/region/${regionName}`
                : `${API_BASE_URL}/forecast/indonesia`;
            
            const response = await axios.get(endpoint);
            return response.data;
        } catch (error) {
            console.error("Gagal memuat data prediksi:", error);
            return null;
        }
    },

    // 4. Mengambil GeoJSON khusus Choropleth Prediksi 2026
    fetchChoropleth: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/choropleth`);
            return response.data;
        } catch (error) {
            console.error("Gagal memuat peta choropleth:", error);
            return null;
        }
    }
};