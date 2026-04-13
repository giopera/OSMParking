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
     * Create marker for a parking feature
     */
    create(feature) {
        const primaryCategory = overpassHandler.getPrimaryCategory(feature.capacity);
        const color = this.getCategoryColor(primaryCategory);
        
        // Calculate capacity utilization for opacity
        const opacity = this.calculateOpacity(feature.capacity);
        
        // Create custom icon
        const icon = this.createCustomIcon(color, opacity, primaryCategory);
        
        // Create marker
        const marker = L.marker([feature.lat, feature.lng], { icon: icon });
        
        // Attach data
        marker.data = feature;
        marker.category = primaryCategory;
        
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
     * Create custom icon with category color
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
