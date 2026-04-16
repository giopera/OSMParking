/**
 * Parking Capacity Viewer Application
 * Main application logic
 */

class ParkingCapacityApp {
    constructor() {
        this.map = null;
        this.isLoading = false;
        this.currentBounds = null;
    }
    
    /**
     * Initialize the application
     */
    init() {
        this.mapChangeTimeout = null;
        this.setupMap();
        this.setupEventListeners();
        this.loadUserPreferences();
    }
    
    /**
     * Setup Leaflet map
     */
    setupMap() {
        // Create map
        this.map = L.map('map').setView(
            CONFIG.map.defaultCenter,
            CONFIG.map.defaultZoom
        );
        
        // Add tile layer (OpenStreetMap Standard)
        L.tileLayer(CONFIG.tiles.standard.url, {
            attribution: CONFIG.tiles.standard.attribution,
            maxZoom: CONFIG.tiles.standard.maxZoom
        }).addTo(this.map);
        
        // Initialize marker layer and inject styles
        markerHandler.initializeLayer(this.map);
        markerHandler.injectMarkerStyles();
        
        // Initialize clustering
        clusteringHandler.initializeClustering(this.map);
        clusteringHandler.injectClusterStyles();
        
        // Listen to map events with debouncing
        this.map.on('moveend', () => this.onMapChanged());
        this.map.on('zoomend', () => this.onMapChanged());
    }
    
    /**
     * Setup UI event listeners
     */
    setupEventListeners() {
        // Load data button
        const loadBtn = document.getElementById('load-data');
        loadBtn?.addEventListener('click', () => this.loadData());
        
        // Clear data button
        const clearBtn = document.getElementById('clear-data');
        clearBtn?.addEventListener('click', () => this.clearData());
        
        // Overpass server update
        const overpassBox = document.getElementById('overpass-url');
        overpassBox?.addEventListener('change', () => this.updateOverpassServer());
        
        // Panel toggle
        const toggleBtn = document.getElementById('toggle-panel');
        toggleBtn?.addEventListener('click', () => this.togglePanel());
        
        // Collapsible sections
        document.querySelectorAll('.section-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => this.toggleSection(e.currentTarget));
        });
        
        // Restore overpass URL from storage
        const overpassInput = document.getElementById('overpass-url');
        if (overpassInput) {
            overpassInput.value = localStorage.getItem('overpass-url') || CONFIG.overpass.defaultServer;
        }
    }
    
    /**
     * Handle map change events (debounced)
     */
    async onMapChanged() {
        // Debounce rapid map changes
        if (this.mapChangeTimeout) {
            clearTimeout(this.mapChangeTimeout);
        }
        
        this.mapChangeTimeout = setTimeout(() => {
            const zoom = this.map.getZoom();
            const info = document.getElementById('zoom-info');
            
            if (info) {
                info.textContent = `Zoom: ${zoom} (Data loading available at zoom ≤ ${CONFIG.overpass.maxDataZoom})`;
            }
            
            // Update visible markers based on viewport for performance
            markerHandler.updateVisibleMarkers(this.map);
            
            // Update legend to show only categories visible in current viewport
            this.updateLegend();
            
            // Auto-load data if in range and not already loading
            if (zoom <= CONFIG.overpass.maxDataZoom && !this.isLoading) {
                // Optionally auto-load could be enabled here
                // await this.loadData();
            }
        }, 300); // Debounce by 300ms
    }
    
    /**
     * Load parking data from Overpass API
     */
    async loadData() {
        const zoom = this.map.getZoom();
        
        // Check zoom level - only allow loading at zoom level > maxDataZoom
        if (zoom < CONFIG.overpass.maxDataZoom) {
            this.updateStatus(`Error: Zoom in to level ${CONFIG.overpass.maxDataZoom} or lower to load data`);
            return;
        }
        
        this.isLoading = true;
        this.showLoadingSpinner(true);
        this.updateStatus('Loading parking data...');
        
        try {
            const bounds = this.map.getBounds();
            this.currentBounds = bounds;
            
            // Fetch data
            const features = await overpassHandler.fetchParkingData(bounds);
            
            if (features.length === 0) {
                this.updateStatus('No parking data found in this area');
            } else {
                // Merge new data with existing - don't clear old data
                const result = await markerHandler.addOrUpdateMarkers(features);
                const totalMarkers = markerHandler.markers.size;
                
                // Refresh clustering with all markers (new and updated)
                clusteringHandler.clear();
                const allMarkers = markerHandler.getAllMarkers();
                clusteringHandler.addMarkersToCluster(allMarkers);
                
                // Update legend to show only categories present in data
                this.updateLegend();
                
                const statusMsg = `Loaded ${features.length} parking locations (${result.added.length} new, ${result.updated.length} updated, ${totalMarkers} total)`;
                this.updateStatus(statusMsg);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            this.updateStatus(`Error: ${error.message}`);
        } finally {
            this.isLoading = false;
            this.showLoadingSpinner(false);
        }
    }
    
    /**
     * Clear all markers
     */
    clearData() {
        markerHandler.clear();
        clusteringHandler.clear();
        this.updateLegend();
        this.updateStatus('Data cleared');
    }
    
    /**
     * Update Overpass server URL
     */
    updateOverpassServer() {
        const input = document.getElementById('overpass-url');
        const url = input?.value;
        
        if (overpassHandler.setServerUrl(url)) {
            localStorage.setItem('overpass-url', url);
            this.updateStatus('Overpass server updated');
        } else {
            this.updateStatus('Error: Invalid URL');
        }
    }
    
    /**
     * Toggle control panel
     */
    togglePanel() {
        const panel = document.getElementById('control-panel');
        const content = document.getElementById('panel-content');
        const btn = document.getElementById('toggle-panel');
        
        if (content?.style.display === 'none') {
            content.style.display = 'block';
            btn.textContent = '−';
        } else {
            content.style.display = 'none';
            btn.textContent = '+';
        }
    }
    
    /**
     * Toggle collapsible section
     */
    toggleSection(button) {
        const targetId = button.getAttribute('data-target');
        const content = document.getElementById(targetId);
        
        if (content) {
            content.classList.toggle('collapsed');
            button.classList.toggle('expanded');
        }
    }
    
    /**
     * Update status message
     */
    updateStatus(message) {
        const status = document.getElementById('data-status');
        if (status) {
            status.textContent = `Status: ${message}`;
        }
    }
    
    /**
     * Update legend to show only categories present in loaded data
     * Optionally filters by map bounds to show only visible categories in viewport
     */
    updateLegend(bounds = null) {
        // If no bounds provided, use current map bounds
        if (!bounds && this.map) {
            bounds = this.map.getBounds();
        }
        
        const visibleCategories = markerHandler.getAllCategoriesInMarkers(bounds);
        const legendItems = document.querySelectorAll('#legend .legend-item');
        
        let allHidden = true;

        legendItems.forEach(item => {
            const category = item.getAttribute('data-category');
            if (visibleCategories.includes(category)) {
                item.style.display = null;
                allHidden = false;
            } else {
                item.style.display = 'none';
            }
        });

        const info = document.getElementById('categories-panel');

        if (allHidden) {
            info.style.display = 'none';
        } else {
            info.style.display = null;
        }

    }
    
    /**
     * Show/hide loading spinner
     */
    showLoadingSpinner(show) {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            if (show) {
                spinner.classList.remove('hidden');
            } else {
                spinner.classList.add('hidden');
            }
        }
    }
    
    /**
     * Load user preferences from localStorage
     */
    loadUserPreferences() {
        // Load map center and zoom
        const savedCenter = localStorage.getItem('map-center');
        const savedZoom = localStorage.getItem('map-zoom');
        
        if (savedCenter && savedZoom) {
            try {
                const [lat, lng] = JSON.parse(savedCenter);
                this.map.setView([lat, lng], parseInt(savedZoom));
            } catch (error) {
                console.warn('Could not restore map position:', error);
            }
        }
        
        // Save map position on moveend (avoid duplicate listener)
        this.map.on('moveend', () => {
            const center = this.map.getCenter();
            localStorage.setItem('map-center', JSON.stringify([center.lat, center.lng]));
            localStorage.setItem('map-zoom', this.map.getZoom().toString());
        });
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const app = new ParkingCapacityApp();
        app.init();
        window.parkingApp = app; // Expose for debugging
    });
} else {
    const app = new ParkingCapacityApp();
    app.init();
    window.parkingApp = app;
}
