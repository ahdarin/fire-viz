"""
forecast_precompute.py
Skrip BATCH (jalankan offline / terjadwal). Memasang SARIMA per wilayah,
lalu menyimpan dua artefak yang nantinya hanya "disajikan" oleh API:
  1. forecasts_adm1.json  -> untuk ForecastChart (per provinsi)
  2. choropleth_2026.geojson -> untuk ChoroplethLayer (prediksi per kabupaten)
"""

import json
import pandas as pd
import geopandas as gpd
from statsmodels.tsa.statespace.sarimax import SARIMAX

DATA_PATH    = "data/fire_hotspot_with_region.parquet"  # output dari spatial_join.py
GEOJSON_PATH = "data/kab_kota_indo.json"

# ---------------------------------------------------------------------------
# Helper 1: bentuk deret waktu BULANAN per wilayah (gap-free)
# ---------------------------------------------------------------------------
def build_monthly_ts(df, region_col, region):
    sub = df[df[region_col] == region]
    ts = (
        sub.set_index("datetime")
           .resample("MS")              # "MS" = awal bulan
           .size()                      # jumlah titik api per bulan
           .asfreq("MS", fill_value=0)  # KUNCI: bulan tanpa kebakaran diisi 0
    )
    # Latih hanya pada 2019–2025 (buang data stub awal Jan 2026)
    return ts.loc[:"2025-12-31"]

# ---------------------------------------------------------------------------
# Helper 2: pasang SARIMA & ramalkan 12 bulan (sepanjang 2026)
# ---------------------------------------------------------------------------
def forecast_region(ts, periods=12, m=12):
    model = SARIMAX(
        ts,
        order=(1, 1, 1),
        seasonal_order=(1, 1, 0, m),
        enforce_stationarity=False,
        enforce_invertibility=False,
    )
    res = model.fit(disp=False)

    fc   = res.get_forecast(steps=periods)
    mean = fc.predicted_mean.clip(lower=0)         # jumlah titik tak mungkin negatif
    ci   = fc.conf_int(alpha=0.05).clip(lower=0)   # interval keyakinan 95%, juga ≥ 0
    return mean, ci

# Catatan: jika ingin pemilihan ordo otomatis, ganti forecast_region dengan
# pmdarima.auto_arima(ts, seasonal=True, m=12, ...). Lebih akurat tapi lebih lambat.

def serialize(ts_hist, mean, ci):
    """Susun ke kontrak JSON yang dibaca ForecastChart di frontend."""
    return {
        "historical": [
            {"date": d.strftime("%Y-%m-%d"), "value": float(v)}
            for d, v in ts_hist.items()
        ],
        "forecast": [
            {
                "date": d.strftime("%Y-%m-%d"),
                "value": float(mean.loc[d]),
                "ci_lower": float(ci.iloc[i, 0]),
                "ci_upper": float(ci.iloc[i, 1]),
            }
            for i, d in enumerate(mean.index)
        ],
    }

# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------
def main():
    df = pd.read_parquet(DATA_PATH)
    df["datetime"] = pd.to_datetime(df["datetime"])

    # ===== 1. Ramalan per PROVINSI (untuk grafik dashboard) =====
    forecasts = {}
    for prov in df["ADM1_EN"].dropna().unique():
        ts = build_monthly_ts(df, "ADM1_EN", prov)
        if ts.sum() < 24:        # lewati wilayah dengan data terlalu sedikit
            continue
        try:
            mean, ci = forecast_region(ts)
            forecasts[prov] = {"region": prov, **serialize(ts, mean, ci)}
        except Exception as e:
            print(f"[skip] {prov}: {e}")

    with open("data/forecasts_adm1.json", "w") as f:
        json.dump(forecasts, f)
    print(f"Tersimpan {len(forecasts)} ramalan provinsi.")

    # ===== 2. Total prediksi 2026 per KABUPATEN (untuk choropleth) =====
    # Memfit 500+ kabupaten itu mahal; ini sekali jalan offline, jadi tak masalah.
    # Tip: paralelkan dengan joblib bila perlu mempercepat.
    predicted_by_pcode = {}
    for (pcode, name), grp in df.dropna(subset=["ADM2_PCODE"]).groupby(["ADM2_PCODE", "ADM2_EN"]):
        ts = build_monthly_ts(df, "ADM2_PCODE", pcode)
        if ts.sum() < 24:
            predicted_by_pcode[pcode] = 0.0
            continue
        try:
            mean, _ = forecast_region(ts)
            predicted_by_pcode[pcode] = float(mean.sum())  # total prediksi setahun
        except Exception:
            predicted_by_pcode[pcode] = 0.0

    # Tempelkan angka prediksi ke GeoJSON sebagai properties.predicted
    gdf = gpd.read_file(GEOJSON_PATH)
    gdf["predicted"] = gdf["ADM2_PCODE"].map(predicted_by_pcode).fillna(0.0)
    gdf[["ADM1_EN", "ADM2_EN", "ADM2_PCODE", "predicted", "geometry"]].to_file(
        "data/choropleth_2026.geojson", driver="GeoJSON"
    )
    print("Choropleth GeoJSON tersimpan.")

if __name__ == "__main__":
    main()