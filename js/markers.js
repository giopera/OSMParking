/**
 * Marker Handler
 * Manages marker creation, styling, and popup content for parking features
 */

class MarkerHandler {
    constructor() {
        this.markers = new Map(); // Store markers by ID
        this.markerLayer = null;
        this.stylesInjected = false; // Avoid re-injecting styles
        this.visibleMarkers = new Set(); // Track currently visible markers
        this.isViewportOptimizationEnabled = true;
        this.viewportUpdateTimeout = null;
        this.lastVisibleBounds = null;
    }
    
    /**
     * Initialize marker layer group
     */
    initializeLayer(map) {
        this.map = map;
        this.markerLayer = L.featureGroup().addTo(map);
        return this.markerLayer;
    }
    
    /**
     * Create marker for a parking feature or parking space element
     */
    create(feature) {
        // Handle parking space elements differently
        if (feature.isParkingSpace) {
            return this.createParkingSpaceMarker(feature);
        }
        
        const primaryCategory = overpassHandler.getPrimaryCategory(feature.capacity);
        const allCategories = overpassHandler.getAllCategories(feature.capacity);
        
        // Calculate capacity utilization for opacity
        const opacity = this.calculateOpacity(feature.capacity);
        
        // Create custom icon with all categories
        const icon = this.createMultiColorIcon(allCategories, opacity, primaryCategory);
        
        // Create marker
        const marker = L.marker([feature.lat, feature.lng], { icon: icon });
        
        // Attach data
        marker.data = feature;
        marker.category = primaryCategory;
        marker.categories = allCategories;
        marker.featureId = feature.id;
        
        // Lazy-load popup on demand for better performance
        marker.on('popupopen', () => {
            if (!marker._popupContent) {
                marker._popupContent = this.createPopupContent(feature);
                marker.setPopupContent(marker._popupContent);
            }
        });
        
        // Bind empty popup initially (content loaded on open)
        marker.bindPopup('');
        
        // NO longer add to layer here - viewport manager will handle it
        // This allows us to control visibility based on viewport
        
        // Store marker
        this.markers.set(feature.id, marker);
        
        return marker;
    }
    
    /**
     * Create a small colored point marker for parking space elements
     */
    createParkingSpaceMarker(feature) {
        const spaceType = feature.parkingSpaceType;
        const spaceConfig = CONFIG.parkingSpaces[spaceType];
        
        if (!spaceConfig) {
            return null; // Unknown parking space type
        }
        
        // Create small point marker
        const icon = L.divIcon({
            html: `<div class="parking-space-marker" style="background-color: ${spaceConfig.color};"><span class="parking-space-icon">${spaceConfig.icon}</span></div>`,
            className: 'parking-space-point',
            iconSize: [12, 12],
            iconAnchor: [6, 6],
            popupAnchor: [0, -20]
        });
        
        // Create marker
        const marker = L.marker([feature.lat, feature.lng], { icon: icon });
        marker.data = feature;
        marker.spaceType = spaceType;
        
        // Lazy-load popup on demand
        marker.on('popupopen', () => {
            if (!marker._popupContent) {
                const popupContent = `<div class="marker-popup"><h3>${spaceConfig.name}</h3><p style="color: ${spaceConfig.color}; font-weight: bold;">${spaceConfig.name}</p><div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e0e0e0;"><a href="https://www.openstreetmap.org/${feature.type}/${feature.id}" target="_blank" style="color: #999; text-decoration: none; font-size: 10px;">View on OSM →</a></div></div>`;
                marker._popupContent = popupContent;
                marker.setPopupContent(popupContent);
            }
        });
        
        // Bind empty popup initially (content loaded on open)
        marker.bindPopup('');
        
        // Add to layer
        if (this.markerLayer) {
            marker.addTo(this.markerLayer);
        }
        
        // Store marker
        this.markers.set(feature.id, marker);
        
        return marker;
    }
    
    /**
     * Create multi-colored icon based on all categories
     */
    createMultiColorIcon(categories, opacity, primaryCategory) {
        // Create SVG with segmented circle
        const svgHtml = this.createSegmentedSVG(categories, opacity);
        
        const icon = L.divIcon({
            html: svgHtml,
            className: 'parking-marker-multi',
            iconSize: [35, 35],
            iconAnchor: [17, 17],
            popupAnchor: [0, -45]
        });
        
        return icon;
    }
    
    /**
     * Create segmented circle SVG for multiple categories
     * Shows color segments for each parking category present
     */
    createSegmentedSVG(categories, opacity) {
        const size = 32;
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = 14;
        
        if (categories.length === 0) {
            categories = ['no_capacity'];
        }
        
        // Single category - simple circle with symbol
        if (categories.length === 1) {
            const color = this.getCategoryColor(categories[0]);
            const symbol = this.getCategorySymbol(categories[0]);
            return `
                <div style="position: relative; width: ${size}px; height: ${size}px; margin-bottom: 4px;">
                    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.25))">
                        <defs>
                            <filter id="textOutline">
                                <feMorphology operator="dilate" radius="0.5" in="SourceGraphic" result="expanded" />
                            </filter>
                        </defs>
                        <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="${color}" opacity="${opacity}" stroke="white" stroke-width="1.5"/>
                        <text x="${centerX}" y="${centerY + 4}" text-anchor="middle" font-size="14" font-weight="bold" fill="white" stroke="rgba(0,0,0,0.2)" stroke-width="0.4">
                            ${symbol}
                        </text>
                    </svg>
                </div>
            `;
        }
        
        // Multiple categories - segmented circle
        const segments = categories.map((cat, index) => {
            const angle = (360 / categories.length) * index;
            const nextAngle = (360 / categories.length) * (index + 1);
            const color = this.getCategoryColor(cat);
            
            // Convert degrees to radians
            const startRad = (angle * Math.PI) / 180;
            const endRad = (nextAngle * Math.PI) / 180;
            
            // Calculate points for arc
            const x1 = centerX + radius * Math.cos(startRad);
            const y1 = centerY + radius * Math.sin(startRad);
            const x2 = centerX + radius * Math.cos(endRad);
            const y2 = centerY + radius * Math.sin(endRad);
            
            const largeArc = nextAngle - angle > 180 ? 1 : 0;
            
            return `<path d="M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${color}" opacity="${opacity}" stroke="white" stroke-width="0.5"/>`;
        }).join('');
        
        // Center circle for symbol
        const centerColor = this.getCategoryColor(categories[0]);
        
        return `
            <div style="position: relative; width: ${size}px; height: ${size}px; margin-bottom: 4px;">
                <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.25))">
                    ${segments}
                    <circle cx="${centerX}" cy="${centerY}" r="7" fill="white" stroke="${centerColor}" stroke-width="1.5" opacity="0.95"/>
                    <text x="${centerX}" y="${centerY + 3}" text-anchor="middle" font-size="11" font-weight="bold" fill="${centerColor}">
                        ${categories.length}
                    </text>
                </svg>
            </div>
        `;
    }
    

    
    /**
     * Get category symbol for marker
     */
    getCategorySymbol(category) {
        const symbols = {
            main: 'P',
            disabled: '♿',
            parent: '👶',
            charging: '⚡',
            emergency: '🚨',
            woman: '♀',
            man: '♂',
            no_capacity: '?',
            other: '•'
        };
        return symbols[category] || '•';
    }
    
    /**
     * Get color for category
     */
    getCategoryColor(category) {
        return CONFIG.categories[category]?.color || CONFIG.categories.other.color;
    }
    
    /**
     * Calculate opacity based on capacity
     */
    calculateOpacity(capacityInfo) {
        if (Object.keys(capacityInfo).length === 0) return 0.6; // No capacity data
        
        const mainCapacity = parseInt(capacityInfo['capacity']) || 0;
        
        if (mainCapacity === 0) return 0.5;
        if (mainCapacity < 50) return 0.6;
        if (mainCapacity < 100) return 0.75;
        return 1.0;
    }
    
    /**
     * Create popup content HTML
     */
    createPopupContent(feature) {
        const allCategories = overpassHandler.getAllCategories(feature.capacity);
        
        let html = `
            <div class="marker-popup">
                <h3>${this.escapeHtml(feature.name)}</h3>
        `;
        
        if (feature.address) {
            html += `<p style="margin: 5px 0; color: #999; font-size: 11px;">${this.escapeHtml(feature.address)}</p>`;
        }
        
        html += `<div style="margin-top: 10px;">`;
        
        // Display capacity items or no capacity info
        if (Object.keys(feature.capacity).length === 0) {
            html += `<p style="color: #999; font-style: italic; font-size: 12px;">No capacity information available</p>`;
        } else {
            for (const [key, value] of Object.entries(feature.capacity)) {
                const label = this.formatCapacityLabel(key);
                html += `
                    <div class="capacity-item">
                        <strong>${label}:</strong>
                        <span>${value}</span>
                    </div>
                `;
            }
        }
        
        html += `</div>`;
        
        // Add category badges
        html += `<div style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 4px;">`;
        allCategories.forEach(cat => {
            const color = this.getCategoryColor(cat);
            html += `
                <span style="
                    display: inline-block;
                    background-color: ${color};
                    color: white;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 10px;
                    font-weight: 600;
                ">
                    ${CONFIG.categories[cat]?.name || cat}
                </span>
            `;
        });
        html += `</div>`;
        
        if (feature.url) {
            html += `
                <div style="margin-top: 10px;">
                    <a href="${this.escapeHtml(feature.url)}" target="_blank" style="
                        color: #667eea;
                        text-decoration: none;
                        font-size: 12px;
                    ">
                        Visit Website →
                    </a>
                </div>
            `;
        }
        
        html += `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e0e0e0;">
                    <a href="https://www.openstreetmap.org/${feature.type}/${feature.id}" target="_blank" style="
                        color: #999;
                        text-decoration: none;
                        font-size: 10px;
                    ">
                        View on OSM →
                    </a>
                </div>`;
        
        html += `</div>`;
        
        return html;
    }
    
    /**
     * Format capacity label for display
     */
    formatCapacityLabel(key) {
        const labels = {
            'capacity': 'Total Capacity',
            'capacity:disabled': 'Disabled Spaces',
            'capacity:parent': 'Parent Spaces',
            'capacity:baby': 'Baby Spaces',
            'capacity:charging': 'Charging Points',
            'capacity:woman': 'Women Spaces',
            'capacity:man': 'Men Spaces'
        };
        return labels[key] || key.replace('capacity:', '').replace(/_/g, ' ');
    }
    
    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text ? text.replace(/[&<>"']/g, m => map[m]) : '';
    }
    
    /**
     * Add many markers at once with batching for better performance
     */
    addMarkers(features) {
        const BATCH_SIZE = 50; // Process 50 markers per animation frame
        let batchIndex = 0;
        
        const processBatch = () => {
            const end = Math.min(batchIndex + BATCH_SIZE, features.length);
            for (let i = batchIndex; i < end; i++) {
                try {
                    this.create(features[i]);
                } catch (error) {
                    console.error('Error creating marker for feature:', features[i], error);
                }
            }
            batchIndex = end;
            
            if (batchIndex < features.length) {
                requestAnimationFrame(processBatch);
            }
        };
        
        requestAnimationFrame(processBatch);
    }

    /**
     * Add many markers at once and return array of marker objects
     * Used for clustering integration
     */
    async addMarkersAndGetArray(features) {
        const markers = [];
        const BATCH_SIZE = 50;
        
        return new Promise((resolve) => {
            let batchIndex = 0;
            
            const processBatch = () => {
                const end = Math.min(batchIndex + BATCH_SIZE, features.length);
                for (let i = batchIndex; i < end; i++) {
                    try {
                        const marker = this.create(features[i]);
                        if (marker) {
                            markers.push(marker);
                        }
                    } catch (error) {
                        console.error('Error creating marker for feature:', features[i], error);
                    }
                }
                batchIndex = end;
                
                if (batchIndex < features.length) {
                    requestAnimationFrame(processBatch);
                } else {
                    // All markers processed, resolve promise
                    resolve(markers);
                }
            };
            
            requestAnimationFrame(processBatch);
        });
    }

    /**
     * Add or update markers - merges new data with existing data
     * Returns { added: [], updated: [] } arrays of markers
     */
    async addOrUpdateMarkers(features) {
        const added = [];
        const updated = [];
        const BATCH_SIZE = 50;
        
        return new Promise((resolve) => {
            let batchIndex = 0;
            
            const processBatch = () => {
                const end = Math.min(batchIndex + BATCH_SIZE, features.length);
                for (let i = batchIndex; i < end; i++) {
                    try {
                        const feature = features[i];
                        
                        if (this.markers.has(feature.id)) {
                            // Update existing marker
                            const marker = this.markers.get(feature.id);
                            this.updateMarkerData(marker, feature);
                            updated.push(marker);
                        } else {
                            // Create new marker
                            const marker = this.create(feature);
                            if (marker) {
                                added.push(marker);
                            }
                        }
                    } catch (error) {
                        console.error('Error processing feature:', features[i], error);
                    }
                }
                batchIndex = end;
                
                if (batchIndex < features.length) {
                    requestAnimationFrame(processBatch);
                } else {
                    // All features processed
                    resolve({ added, updated });
                }
            };
            
            requestAnimationFrame(processBatch);
        });
    }

    /**
     * Update marker data and visuals
     */
    updateMarkerData(marker, feature) {
        // Check if data actually changed
        const oldCapacity = marker.data.capacity;
        const newCapacity = feature.capacity;
        const dataChanged = JSON.stringify(oldCapacity) !== JSON.stringify(newCapacity);
        
        if (!dataChanged) {
            return; // No update needed
        }
        
        // Update marker data
        marker.data = feature;
        
        // Recalculate categories
        const primaryCategory = overpassHandler.getPrimaryCategory(feature.capacity);
        const allCategories = overpassHandler.getAllCategories(feature.capacity);
        const opacity = this.calculateOpacity(feature.capacity);
        
        // Update marker visual
        const icon = this.createMultiColorIcon(allCategories, opacity, primaryCategory);
        marker.setIcon(icon);
        marker.category = primaryCategory;
        marker.categories = allCategories;
        
        // Clear cached popup content so it regenerates
        marker._popupContent = null;
    }

    /**
     * Get array of all markers
     */
    getAllMarkers() {
        return Array.from(this.markers.values());
    }
    
    /**
     * Get all unique categories present in current markers
     * Optionally filtered by bounds to show only visible categories in viewport
     */
    getAllCategoriesInMarkers(bounds = null) {
        const categoriesSet = new Set();
        
        // Collect all categories from markers
        for (const marker of this.markers.values()) {
            // If bounds are provided, only include markers within the viewport
            if (bounds && !bounds.contains(marker.getLatLng())) {
                continue;
            }
            
            if (marker.categories && Array.isArray(marker.categories)) {
                marker.categories.forEach(cat => categoriesSet.add(cat));
            } else if (marker.category) {
                categoriesSet.add(marker.category);
            }
        }
        
        return Array.from(categoriesSet);
    }

    /**
     * Get statistics for each category based on presence of tag in parking features
     * Calculates percentage of parking spaces that have tags for each category
     * Optionally filtered by bounds to show only visible categories in viewport
     * Returns object with category as key and {count, percentage} as value
     */
    getCategoryStatistics(bounds = null) {
        const stats = {};
        let totalMarkers = 0;
        
        // Count total markers (for percentage calculation)
        for (const marker of this.markers.values()) {
            // If bounds are provided, only include markers within the viewport
            if (bounds && !bounds.contains(marker.getLatLng())) {
                continue;
            }
            totalMarkers++;
        }
        
        // Count markers that have each category's tags
        for (const [categoryKey, categoryConfig] of Object.entries(CONFIG.categories)) {
            let countWithTag = 0;
            
            for (const marker of this.markers.values()) {
                // If bounds are provided, only include markers within the viewport
                if (bounds && !bounds.contains(marker.getLatLng())) {
                    continue;
                }
                
                // Check if this marker has any of the tags for this category
                const feature = marker.data;
                const hasTag = categoryConfig.tags.some(tag => {
                    // Check if the tag exists in the feature's capacity object
                    if (tag === 'capacity:*') {
                        // Wildcard - has any capacity tag
                        return feature.capacity && Object.keys(feature.capacity).length > 0;
                    }
                    return feature.capacity && feature.capacity[tag] !== undefined;
                });
                
                if (hasTag) {
                    countWithTag++;
                }
            }
            
            stats[categoryKey] = {
                count: countWithTag,
                percentage: totalMarkers > 0 ? Math.round((countWithTag / totalMarkers) * 100) : 0
            };
        }
        
        return stats;
    }
    
    /**
     * Clear all markers
     */
    clear() {
        if (this.markerLayer) {
            this.markerLayer.clearLayers();
        }
        this.markers.clear();
        this.visibleMarkers.clear();
        this.lastVisibleBounds = null;
    }

    /**
     * Update which markers are visible based on current map bounds
     * This enables viewport-based rendering for performance optimization
     * Primarily useful at zoom 13+ when clustering is disabled
     */
    updateVisibleMarkers(map) {
        // Only apply viewport optimization at high zoom levels where clustering is disabled
        // At zoom 1-12, clustering already handles optimization
        const zoom = map.getZoom();
        if (zoom <= 12) {
            // Clustering handles visibility at these zoom levels
            return;
        }

        if (!this.isViewportOptimizationEnabled || this.markers.size === 0 || !map) {
            return;
        }

        const bounds = map.getBounds();
        
        // Skip if bounds haven't changed significantly
        if (this.lastVisibleBounds && this._boundsSimilar(bounds, this.lastVisibleBounds)) {
            return;
        }
        
        this.lastVisibleBounds = bounds;

        // Find markers in current bounds
        const markersInBounds = new Set();
        const padding = 0.05; // Add 5% padding to reduce flickering at edges
        const paddedBounds = bounds.pad(padding);
        
        for (const [featureId, marker] of this.markers) {
            const markerLatLng = marker.getLatLng();
            
            if (paddedBounds.contains(markerLatLng)) {
                markersInBounds.add(featureId);
                
                // Add marker to layer if not already visible
                if (!this.visibleMarkers.has(featureId)) {
                    marker.addTo(this.markerLayer);
                    this.visibleMarkers.add(featureId);
                }
            }
        }

        // Remove markers outside bounds
        for (const featureId of this.visibleMarkers) {
            if (!markersInBounds.has(featureId)) {
                const marker = this.markers.get(featureId);
                if (marker) {
                    this.markerLayer.removeLayer(marker);
                }
                this.visibleMarkers.delete(featureId);
            }
        }
    }

    /**
     * Check if two bounds are similar enough to skip update
     */
    _boundsSimilar(bounds1, bounds2) {
        if (!bounds1 || !bounds2) return false;
        
        const ne1 = bounds1.getNorthEast();
        const ne2 = bounds2.getNorthEast();
        const sw1 = bounds1.getSouthWest();
        const sw2 = bounds2.getSouthWest();
        
        // Use 0.001 degree tolerance (~111 meters)
        const tolerance = 0.001;
        
        return Math.abs(ne1.lat - ne2.lat) < tolerance &&
               Math.abs(ne1.lng - ne2.lng) < tolerance &&
               Math.abs(sw1.lat - sw2.lat) < tolerance &&
               Math.abs(sw1.lng - sw2.lng) < tolerance;
    }

    /**
     * Toggle viewport optimization on/off
     */
    setViewportOptimization(enabled) {
        this.isViewportOptimizationEnabled = enabled;
        
        if (!enabled) {
            // If disabling, add all markers to layer
            for (const [featureId, marker] of this.markers) {
                if (!this.visibleMarkers.has(featureId)) {
                    marker.addTo(this.markerLayer);
                    this.visibleMarkers.add(featureId);
                }
            }
        }
    }

    
    /**
     * Inject marker CSS styles
     */
    injectMarkerStyles() {
        if (this.stylesInjected) {
            return; // Already injected
        }
        this.stylesInjected = true;
        
        const style = document.createElement('style');
        style.textContent = `
            /* Single color marker (legacy) */
            .parking-marker .marker-icon {
                width: 100%;
                height: 100%;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid white;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
                cursor: pointer;
                transition: transform 0.2s ease;
            }
            
            .parking-marker:hover .marker-icon {
                transform: rotate(-45deg) scale(1.15);
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
            }
            
            .parking-marker .marker-icon-inner {
                transform: rotate(45deg);
                color: white;
                font-weight: bold;
                font-size: 16px;
                text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
            }
            
            /* Multi-color marker */
            .parking-marker-multi {
                display: flex;
                flex-direction: column;
                align-items: center;
                cursor: pointer;
            }
            
            .parking-marker-multi svg {
                transition: transform 0.2s ease, filter 0.2s ease;
            }
            
            .parking-marker-multi:hover svg {
                transform: scale(1.15);
                filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35)) !important;
            }
            
            /* Parking space point markers */
            .parking-space-point {
                cursor: pointer;
            }
            
            .parking-space-marker {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                border: 1.5px solid white;
                box-shadow: 0 1.5px 4px rgba(0, 0, 0, 0.4);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.15s ease, box-shadow 0.15s ease;
            }
            
            .parking-space-point:hover .parking-space-marker {
                transform: scale(1.5);
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
            }
            
            .parking-space-icon {
                font-size: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                line-height: 1;
            }
            
            /* Leaflet popup styling */
            .leaflet-popup-content-wrapper {
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
        `;
        document.head.appendChild(style);
    }
}

// Create global instance
const markerHandler = new MarkerHandler();
