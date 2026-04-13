/**
 * Marker Handler
 * Manages marker creation, styling, and popup content for parking features
 */

class MarkerHandler {
    constructor() {
        this.markers = new Map(); // Store markers by ID
        this.markerLayer = null;
    }
    
    /**
     * Initialize marker layer group
     */
    initializeLayer(map) {
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
        
        // Add popup
        const popupContent = this.createPopupContent(feature);
        marker.bindPopup(popupContent);
        
        // Add to layer
        if (this.markerLayer) {
            marker.addTo(this.markerLayer);
        }
        
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
            html: `
                <div class="parking-space-marker" style="background-color: ${spaceConfig.color};">
                    <span class="parking-space-icon">${spaceConfig.icon}</span>
                </div>
            `,
            className: 'parking-space-point',
            iconSize: [12, 12],
            iconAnchor: [6, 6],
            popupAnchor: [0, -20]
        });
        
        // Create marker
        const marker = L.marker([feature.lat, feature.lng], { icon: icon });
        marker.data = feature;
        marker.spaceType = spaceType;
        
        // Add popup
        const popupContent = `
            <div class="marker-popup">
                <h3>${spaceConfig.name}</h3>
                <p style="color: ${spaceConfig.color}; font-weight: bold;">${spaceConfig.name}</p>
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e0e0e0;">
                    <a href="https://www.openstreetmap.org/${feature.type}/${feature.id}" target="_blank" style="color: #999; text-decoration: none; font-size: 10px;">
                        View on OSM →
                    </a>
                </div>
            </div>
        `;
        marker.bindPopup(popupContent);
        
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
        
        // Insert CSS if not present
        this.injectMarkerStyles();
        
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
     * Create custom icon with category color (legacy - single color)
     */
    createCustomIcon(color, opacity, category) {
        const icon = L.divIcon({
            html: `
                <div class="marker-icon" style="background-color: ${color}; opacity: ${opacity};">
                    <span class="marker-icon-inner">
                        ${this.getCategorySymbol(category)}
                    </span>
                </div>
            `,
            className: 'parking-marker',
            iconSize: [30, 30],
            iconAnchor: [15, 35],
            popupAnchor: [0, -45]
        });
        
        // Insert CSS if not present
        this.injectMarkerStyles();
        
        return icon;
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
     * Add many markers at once
     */
    addMarkers(features) {
        features.forEach(feature => {
            try {
                this.create(feature);
            } catch (error) {
                console.error('Error creating marker for feature:', feature, error);
            }
        });
    }
    
    /**
     * Clear all markers
     */
    clear() {
        if (this.markerLayer) {
            this.markerLayer.clearLayers();
        }
        this.markers.clear();
    }
    
    /**
     * Get marker by ID
     */
    getMarker(id) {
        return this.markers.get(id);
    }
    
    /**
     * Get all markers
     */
    getAllMarkers() {
        return Array.from(this.markers.values());
    }
    
    /**
     * Inject marker CSS styles
     */
    injectMarkerStyles() {
        if (document.getElementById('marker-styles')) {
            return; // Already injected
        }
        
        const style = document.createElement('style');
        style.id = 'marker-styles';
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
