<aside id="main-sidebar" class="flex flex-col h-screen py-lg px-sm overflow-y-auto w-full lg:w-[30%] flex-shrink-0 bg-white border-r border-outline-variant z-[60] custom-scrollbar transition-all duration-300 ease-in-out">
    
    <div class="mb-lg px-sm flex justify-between items-center mt-1">
        <h1 class="text-headline-md font-bold text-primary tracking-tight">Visualisasi Hotspot Karhutla</h1>
        
        <button onclick="toggleSidebar()" class="w-8 h-8 flex items-center justify-center text-outline hover:text-primary hover:bg-surface-container rounded-lg transition-colors" title="Sembunyikan Menu">
            <span class="material-symbols-outlined text-[20px]">keyboard_double_arrow_left</span>
        </button>
    </div>

    <div class="flex flex-col gap-lg px-sm">
        <div class="space-y-sm">
            <label class="text-label-md font-bold text-on-surface-variant uppercase tracking-wider">Mode Tampilan</label>
            <div class="bg-surface-container p-1 rounded-xl flex effect-3d-pressed">
                <button id="btn-historis" class="flex-1 py-2.5 px-md rounded-lg text-label-md font-bold transition-all duration-200 bg-white effect-3d-raised text-secondary" onclick="appState.setMode('historical')">
                    Titik Historis
                </button>
                <button id="btn-prediksi" class="flex-1 py-2.5 px-md rounded-lg text-label-md font-medium transition-all duration-200 text-on-surface-variant hover:text-on-surface" onclick="appState.setMode('prediction')">
                    Prediksi Kerawanan
                </button>
            </div>
        </div>

        <div class="space-y-sm">
            <label class="text-label-md font-bold text-on-surface-variant uppercase tracking-wider">Eksplorasi Wilayah</label>
            <div class="grid grid-cols-2 gap-sm">
                <div class="relative">
                    <select id="provinsi-filter" onchange="appState.onProvinsiChange(this.value)" class="w-full appearance-none bg-white border border-outline-variant rounded-xl px-sm py-2 text-[12px] text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all cursor-pointer shadow-sm">
                        <option value="">Semua Provinsi</option>
                    </select>
                    <span class="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-outline text-sm">expand_more</span>
                </div>
                <div class="relative">
                    <select id="kabupaten-filter" onchange="appState.onKabupatenChange(this.value)" disabled class="w-full appearance-none bg-white border border-outline-variant rounded-xl px-sm py-2 text-[12px] text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all cursor-pointer shadow-sm disabled:opacity-50">
                        <option value="">Semua Kab/Kota</option>
                    </select>
                    <span class="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-outline text-sm">expand_more</span>
                </div>
            </div>
        </div>

        <div class="space-y-sm" id="time-player-container">
            <label class="text-label-md font-bold text-on-surface-variant uppercase tracking-wider">Navigasi Waktu</label>
            <div class="bg-white border border-outline-variant/30 rounded-xl p-md effect-3d-raised flex items-center gap-sm">
                <button id="play-pause-btn" class="w-10 h-10 flex items-center justify-center bg-secondary text-white rounded-lg btn-3d flex-shrink-0">
                    <span class="material-symbols-outlined" id="play-icon">play_arrow</span>
                </button>
                <div class="flex-1 flex flex-col gap-1">
                    <input id="time-slider" class="w-full h-1.5" max="100" min="0" type="range" value="0"/>
                    <div class="flex justify-between items-center mt-1">
                        <span class="text-[10px] text-outline font-medium">Jan 2019</span>
                        <span id="current-time-display" class="text-label-sm font-bold text-secondary">2019-01-01</span>
                        <span class="text-[10px] text-outline font-medium">Des 2025</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="space-y-sm mt-4">
            <div class="flex justify-between items-center">
                <label id="chart-title" class="text-label-md font-bold text-on-surface-variant uppercase tracking-wider"></label>
                <span class="text-[10px] bg-secondary-container text-white px-2 py-0.5 rounded-full font-bold">Model SARIMA</span>
            </div>
            <div class="bg-white p-sm rounded-xl border border-outline-variant/30 effect-3d-raised h-[360px] flex flex-col relative">
                
                <div id="chart-placeholder" class="text-center text-outline text-[11px] font-medium m-auto px-2">
                    Silakan pilih Provinsi pada filter di atas untuk melihat prediksi data deret waktu.
                </div>

                <div id="chart-wrapper" class="relative w-full h-full" style="display: none;">
                    <canvas id="forecastChart"></canvas>
                </div>

            </div>
        </div>
    </div>
</aside>