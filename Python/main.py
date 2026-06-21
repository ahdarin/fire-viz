"""
main.py — API penyaji (FastAPI). Jalankan: uvicorn main:app --reload
"""
import json
import pandas as pd
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Fire Hotspot Spatio-Temporal API")

# CORS: Izinkan semua origin selama development agar tidak diblokir browser
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Muat semua artefak SEKALI saat startup (bukan tiap request) ---
DF = pd.read_parquet("data/fire_hotspot_with_region.parquet")
DF["datetime"] = pd.to_datetime(DF["datetime"])

with open("data/forecasts_adm1.json") as f:
    FORECASTS = json.load(f)

with open("data/choropleth_2026.geojson") as f:
    CHOROPLETH = json.load(f)

with open("data/kab_kota_indo.json") as f:
    REGIONS = json.load(f)

# ---------------------------------------------------------------------------
# 1. Titik historis dalam jendela waktu & filter wilayah (Time Player & Filter)
# ---------------------------------------------------------------------------
@app.get("/api/hotspots")
def get_hotspots(
    date: str = Query(..., description="Tanggal acuan YYYY-MM-DD"),
    window_days: int = 7,
    region: str = Query(None, description="Filter wilayah opsional")
):
    end = pd.to_datetime(date)
    start = end - pd.Timedelta(days=window_days)
    
    # Filter rentang waktu
    mask = (DF["datetime"] > start) & (DF["datetime"] <= end)
    
    # Jika dropdown provinsi/kabupaten dipilih, tambahkan filter wilayah
    if region:
        # Pengecekan dilakukan di kolom ADM1_EN (Provinsi) atau ADM2_EN (Kabupaten)
        mask = mask & ((DF["ADM1_EN"] == region) | (DF["ADM2_EN"] == region))
        
    sub = DF.loc[mask, ["latitude", "longitude", "frp", "datetime", "confidence_label"]]

    # Kirim ramping; format datetime jadi string agar JSON bersih
    sub = sub.copy()
    sub["datetime"] = sub["datetime"].dt.strftime("%Y-%m-%d %H:%M")
    
    # Mengembalikan format Array of Objects (akan diubah jadi GeoJSON oleh api.js)
    return sub.to_dict(orient="records")

# ---------------------------------------------------------------------------
# 2A. Ramalan SARIMA Seluruh Indonesia (Default Dashboard)
# ---------------------------------------------------------------------------
@app.get("/api/forecast/indonesia")
def get_forecast_indonesia():
    # Asumsi key untuk seluruh Indonesia di file JSON Anda adalah "Indonesia" atau "Nasional"
    # Sesuaikan dengan format data Data Engineering Anda
    if "Indonesia" in FORECASTS:
        return FORECASTS["Indonesia"]
    elif "Nasional" in FORECASTS:
        return FORECASTS["Nasional"]
    else:
        # Jika tidak ada key global, kembalikan data kosong yang aman untuk chart
        return {"labels": [], "history": [], "prediction": []}

# ---------------------------------------------------------------------------
# 2B. Ramalan SARIMA per wilayah spesifik (Dipanggil saat Dropdown berubah)
# ---------------------------------------------------------------------------
@app.get("/api/forecast/region/{region}")
def get_forecast_region(region: str):
    if region not in FORECASTS:
        raise HTTPException(404, f"Ramalan untuk '{region}' tidak tersedia")
    return FORECASTS[region]

# ---------------------------------------------------------------------------
# 3. GeoJSON batas wilayah (Dipanggil untuk Dropdown & FlyTo Polygon)
# ---------------------------------------------------------------------------
@app.get("/api/regions")
def get_regions():
    return REGIONS

# ---------------------------------------------------------------------------
# 4. GeoJSON choropleth dengan angka prediksi
# ---------------------------------------------------------------------------
@app.get("/api/choropleth")
def get_choropleth():
    return CHOROPLETH