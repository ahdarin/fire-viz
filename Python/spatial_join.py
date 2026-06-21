"""
spatial_join.py
Menempelkan informasi wilayah (Provinsi & Kabupaten) ke setiap titik api
melalui operasi Point-in-Polygon (Spatial Join).
"""

import geopandas as gpd
import pandas as pd

CSV_PATH     = "data/fire_hotspot_clean.csv"
GEOJSON_PATH = "data/kab_kota_indo.json"
OUTPUT_PATH  = "data/fire_hotspot_with_region.parquet"  # Parquet jauh lebih cepat & ringkas daripada CSV

# ---------------------------------------------------------------------------
# 1. Muat data titik api (tabular)
# ---------------------------------------------------------------------------
# Hanya muat kolom yang benar-benar dibutuhkan agar hemat RAM.
usecols = [
    "latitude", "longitude", "frp", "frp_category",
    "confidence_label", "datetime", "acq_date",
    "year", "month", "daynight_label",
]
df = pd.read_csv(CSV_PATH, usecols=usecols, parse_dates=["datetime"])

# Downcast numerik untuk menghemat memori (penting pada dataset besar)
df["frp"]       = pd.to_numeric(df["frp"], downcast="float")
df["latitude"]  = pd.to_numeric(df["latitude"], downcast="float")
df["longitude"] = pd.to_numeric(df["longitude"], downcast="float")

# ---------------------------------------------------------------------------
# 2. Konversi DataFrame -> GeoDataFrame (geometri Titik)
# ---------------------------------------------------------------------------
# points_from_xy membuat objek geometri Point dari kolom lon/lat.
# CRS WAJIB EPSG:4326 (WGS84) agar cocok dengan data GeoJSON.
gdf_points = gpd.GeoDataFrame(
    df,
    geometry=gpd.points_from_xy(df.longitude, df.latitude),
    crs="EPSG:4326",
)

# ---------------------------------------------------------------------------
# 3. Muat batas wilayah (poligon)
# ---------------------------------------------------------------------------
gdf_regions = gpd.read_file(GEOJSON_PATH)

# Selaraskan CRS. Jika GeoJSON tidak punya metadata CRS, set manual ke 4326.
if gdf_regions.crs is None:
    gdf_regions = gdf_regions.set_crs("EPSG:4326")
else:
    gdf_regions = gdf_regions.to_crs("EPSG:4326")

# Bawa hanya atribut yang relevan + geometry (mengurangi lebar tabel hasil join).
gdf_regions = gdf_regions[["ADM1_EN", "ADM2_EN", "ADM2_PCODE", "geometry"]]

# ---------------------------------------------------------------------------
# 4. Spatial Join: Point-in-Polygon
# ---------------------------------------------------------------------------
# predicate="within" -> titik berada DI DALAM poligon. Ini logika yang benar
# untuk point-in-polygon (bukan "intersects" yang lebih longgar).
# Geopandas modern otomatis membangun R-tree spatial index, jadi operasi ini
# tetap cepat meski jutaan titik.
gdf_joined = gpd.sjoin(
    gdf_points,
    gdf_regions,
    how="left",          # "left" agar titik yang gagal dipetakan tetap dipertahankan
    predicate="within",
)

# ---------------------------------------------------------------------------
# 5. Bersihkan & validasi hasil
# ---------------------------------------------------------------------------
gdf_joined = gdf_joined.drop(columns=["index_right"])

# Titik yang berada di laut / di luar batas poligon akan punya ADM kosong (NaN).
# Penting untuk diketahui sebelum agregasi — bisa jadi indikasi koordinat noise.
unmatched = gdf_joined["ADM2_EN"].isna().sum()
total = len(gdf_joined)
print(f"Total titik          : {total:,}")
print(f"Tidak terpetakan (NaN): {unmatched:,} ({unmatched/total:.2%})")

# ---------------------------------------------------------------------------
# 6. Simpan dataset siap pakai
# ---------------------------------------------------------------------------
# Buang kolom geometry sebelum simpan ke Parquet karena lat/lon sudah ada
# sebagai kolom biasa, dan backend API lebih mudah membaca tabular murni.
df_out = pd.DataFrame(gdf_joined.drop(columns="geometry"))
df_out.to_parquet(OUTPUT_PATH, index=False)
print(f"Tersimpan ke: {OUTPUT_PATH}")