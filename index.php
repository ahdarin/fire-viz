<!DOCTYPE html>
<html class="light" lang="id">
<head>
    <meta charset="utf-8"/>
    <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
    <title>Visualisasi Hotspot Karhutla</title>
    <link rel="icon" href="assets/images/logo.webp" type="image/webp"/>
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
    
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />

    <script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
              "on-surface-variant": "#434751", "tertiary": "#620019", "on-background": "#0b1c30",
              "secondary-fixed": "#d8e2ff", "inverse-surface": "#213145", "surface-container": "#e5eeff",
              "background": "#f8f9ff", "secondary-container": "#0070eb", "on-tertiary-fixed-variant": "#92002a",
              "inverse-primary": "#aec6ff", "outline-variant": "#c3c6d3", "on-error-container": "#93000a",
              "on-primary-fixed-variant": "#15448d", "surface-container-low": "#eff4ff", "on-tertiary-container": "#ff919a",
              "surface-bright": "#f8f9ff", "surface-container-high": "#dce9ff", "surface-variant": "#d3e4fe",
              "surface-container-highest": "#d3e4fe", "surface-tint": "#345ca7", "on-secondary-fixed": "#001a41",
              "primary-container": "#10418a", "tertiary-container": "#8c0028", "tertiary-fixed": "#ffdadb",
              "on-tertiary": "#ffffff", "on-primary": "#ffffff", "primary-fixed-dim": "#aec6ff",
              "surface": "#f8f9ff", "error": "#ba1a1a", "outline": "#737782", "on-secondary": "#ffffff",
              "on-surface": "#0b1c30", "on-error": "#ffffff", "primary": "#002b65", "tertiary-fixed-dim": "#ffb2b7",
              "on-secondary-container": "#fefcff", "on-tertiary-fixed": "#40000d", "surface-container-lowest": "#ffffff",
              "error-container": "#ffdad6", "secondary-fixed-dim": "#adc6ff", "on-primary-fixed": "#001a42",
              "secondary": "#0058bc", "surface-dim": "#cbdbf5", "on-primary-container": "#8cb0ff",
              "on-secondary-fixed-variant": "#004493", "inverse-on-surface": "#eaf1ff", "primary-fixed": "#d8e2ff"
            },
            "borderRadius": { "DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px" },
            "spacing": { "md": "24px", "xs": "8px", "margin-mobile": "16px", "lg": "32px", "margin-desktop": "40px", "xl": "48px", "base": "4px", "gutter": "24px", "sm": "16px" },
            "fontFamily": { "headline-md": ["Inter"], "body-lg": ["Inter"], "headline-sm": ["Inter"], "display-lg": ["Inter"], "label-md": ["Inter"], "label-sm": ["Inter"], "body-md": ["Inter"] },
            "fontSize": {
              "headline-md": ["24px", {"lineHeight": "1.3", "letterSpacing": "-0.01em", "fontWeight": "600"}],
              "body-lg": ["16px", {"lineHeight": "1.6", "fontWeight": "400"}],
              "headline-sm": ["18px", {"lineHeight": "1.4", "fontWeight": "600"}],
              "display-lg": ["32px", {"lineHeight": "1.2", "letterSpacing": "-0.02em", "fontWeight": "700"}],
              "label-md": ["12px", {"lineHeight": "1", "letterSpacing": "0.02em", "fontWeight": "500"}],
              "label-sm": ["11px", {"lineHeight": "1", "fontWeight": "600"}],
              "body-md": ["14px", {"lineHeight": "1.5", "fontWeight": "400"}]
            }
          }
        }
      }
    </script>
    
    <link rel="stylesheet" href="assets/css/style.css" />
</head>
<body class="bg-surface text-on-surface flex h-screen overflow-hidden">
    
    <?php include 'includes/sidebar.php'; ?>

    <main class="flex-1 relative bg-[#e5eff1]">

        <button id="btn-open-sidebar" onclick="toggleSidebar()" class="absolute top-md left-md w-10 h-10 bg-secondary hover:bg-primary transition-all duration-300 flex items-center justify-center rounded-lg shadow-md z-[50] effect-3d-pressed text-white opacity-0 pointer-events-none scale-90">
            <span class="material-symbols-outlined text-[20px]">menu</span>
        </button>

        <div id="map" class="absolute inset-0 z-0"></div>

        <div class="absolute top-md right-md flex flex-col gap-1 z-20">
            <button onclick="map.zoomIn()" class="w-10 h-10 bg-white hover:bg-surface-container transition-colors flex items-center justify-center border-b border-outline-variant rounded-t-lg shadow-md font-bold text-xl text-on-surface effect-3d-pressed">+</button>
            <button onclick="map.zoomOut()" class="w-10 h-10 bg-white hover:bg-surface-container transition-colors flex items-center justify-center rounded-b-lg shadow-md font-bold text-xl text-on-surface effect-3d-pressed">−</button>
        </div>

        <div class="absolute bottom-md right-md bg-white/90 backdrop-blur p-sm rounded-lg border border-outline-variant shadow-lg z-20 max-w-[280px]">
            <div class="flex items-center gap-sm mb-2">
                <div class="w-8 h-8 p-1 rounded-full overflow-hidden bg-white shadow-sm flex justify-center items-center">
                    <img
                        src="assets/images/ahda.png"
                        alt="Ahda"
                        class="w-full h-full object-cover"
                    />
                </div>
                <div>
                    <p class="text-[10px] font-bold text-primary">Visualisasi oleh Ahda R. Al-Amin</p>
                    <p class="text-[9px] text-on-surface-variant">
                        Github :
                        <a href="https://github.com/ahdarin/fire-viz" class="font-bold hover:underline">
                            ahdarin
                        </a>
                    </p>
                </div>
            </div>
            <div class="border-t border-outline-variant/30 pt-1.5">
                <p class="text-[9px] text-outline italic"><strong>Sumber Data</strong>: Dataset Titik Panas (Hotspot) VIIRS S-NPP 375m yang disediakan oleh NASA melalui sistem Fire Information for Resource Management System (FIRMS).</p>
            </div>
        </div>
    </main>

    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>

    <script src="assets/js/utils.js"></script>
    <script src="assets/js/api.js"></script>
    <script src="assets/js/map_layers.js"></script>
    <script src="assets/js/chart.js"></script>
    <script src="assets/js/app.js"></script>
</body>
</html>