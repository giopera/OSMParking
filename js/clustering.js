/**
 * Clustering Handler
 * Manages marker clustering with pie chart visualization for zoom levels 1-12
 */

class ClusteringHandler {
    constructor() {
        this.markerClusterGroup = null;
        this.stylesInjected = false;
        this.clusterZoomThreshold = 12; // Disable clustering at zoom > 12
    }

    /**
     * Initialize clustering on the map
     */
    initializeClustering(map) {
        this.map = map;
        
        // Create marker cluster group with custom options
        this.markerClusterGroup = L.markerClusterGroup({
            maxClusterRadius: 80,
            disableClusteringAtZoom: this.clusterZoomThreshold + 1,
            iconCreateFunction: (cluster) => this.createClusterIcon(cluster),
            chunkedLoading: true,
            chunkInterval: 200,
            chunkDelay: 50
        });

        // Add cluster click listener for popups
        this.markerClusterGroup.on('clustermouseover', (e) => {
            // Show cluster tooltip on hover
            this.showClusterInfo(e.layer);
        });
        
        map.addLayer(this.markerClusterGroup);
        return this.markerClusterGroup;
    }

    /**
     * Create custom cluster icon with pie chart
     */
    createClusterIcon(cluster) {
        const markers = cluster.getAllChildMarkers();
        const count = markers.length;
        
        // Calculate category statistics
        const stats = this.calculateCategoryStats(markers);
        
        // Create pie chart SVG
        const pieSvg = this.createClusterPieIcon(stats, count);
        
        // Create div icon
        const icon = L.divIcon({
            html: pieSvg,
            className: 'cluster-pie-icon',
            iconSize: [50, 50],
            iconAnchor: [25, 25],
            popupAnchor: [0, -50]
        });

        // Store stats on cluster for popup
        cluster._clusterStats = stats;
        
        return icon;
    }

    /**
     * Calculate category statistics from markers
     * Returns object with category names and percentages
     */
    calculateCategoryStats(markers) {
        const stats = {};
        let totalWithCategories = 0;
        let noCapacityCount = 0;

        // Initialize category counts
        Object.keys(CONFIG.categories).forEach(cat => {
            stats[cat] = 0;
        });

        // Count markers by category
        markers.forEach(marker => {
            if (!marker.data) {
                return;
            }

            // Check if marker has any capacity information
            const hasCapacity = marker.data.capacity && Object.keys(marker.data.capacity).length > 0;

            if (!hasCapacity) {
                stats.no_capacity++;
                noCapacityCount++;
            } else {
                totalWithCategories++;
                // Get primary category for each marker
                if (marker.categories && marker.categories.length > 0) {
                    const primaryCategory = marker.categories[0];
                    stats[primaryCategory]++;
                } else {
                    stats.main++;
                }
            }
        });

        // Calculate percentages
        const percentages = {};
        const total = markers.length;

        Object.keys(stats).forEach(cat => {
            if (stats[cat] > 0) {
                percentages[cat] = Math.round((stats[cat] / total) * 100);
            }
        });

        return {
            stats: stats,
            percentages: percentages,
            total: total,
            noCapacityCount: noCapacityCount,
            withCapacityCount: totalWithCategories
        };
    }

    /**
     * Create pie chart SVG for cluster
     */
    createClusterPieIcon(stats, count) {
        const size = 50;
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = 17;

        // Get categories with non-zero counts, sorted by count descending
        const activeCats = Object.keys(stats.stats)
            .filter(cat => stats.stats[cat] > 0)
            .sort((a, b) => stats.stats[b] - stats.stats[a]);

        if (activeCats.length === 0) {
            activeCats.push('no_capacity');
        }

        // Create pie slices (consistent for all clusters, including single-category)
        let currentAngle = -90; // Start at top
        const slices = [];

        activeCats.forEach(cat => {
            const catCount = stats.stats[cat];
            let sliceAngle = (catCount / stats.total) * 360;
            const color = CONFIG.categories[cat]?.color || CONFIG.categories.other.color;

            // Calculate angles in radians
            const startRad = (currentAngle * Math.PI) / 180;
            const endAngle = currentAngle + sliceAngle;
            const endRad = (endAngle * Math.PI) / 180;

            // Calculate arc end points
            const x1 = centerX + radius * Math.cos(startRad);
            const y1 = centerY + radius * Math.sin(startRad);
            const x2 = centerX + radius * Math.cos(endRad);
            const y2 = centerY + radius * Math.sin(endRad);

            // Special handling for 360° (full circle at 100%)
            if (sliceAngle >= 359.9) {
                // Draw full circle as two 180° arcs to avoid SVG degenerate case
                const mid1Rad = ((currentAngle + 180) * Math.PI) / 180;
                const xMid1 = centerX + radius * Math.cos(mid1Rad);
                const yMid1 = centerY + radius * Math.sin(mid1Rad);
                
                // First half circle
                const path1 = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 1 1 ${xMid1} ${yMid1} Z`;
                slices.push(`<path d="${path1}" fill="${color}" stroke="white" stroke-width="1.2"/>`);
                
                // Second half circle
                const path2 = `M ${centerX} ${centerY} L ${xMid1} ${yMid1} A ${radius} ${radius} 0 1 1 ${x1} ${y1} Z`;
                slices.push(`<path d="${path2}" fill="${color}" stroke="white" stroke-width="1.2"/>`);
            } else {
                // Normal pie slice for angles < 360°
                const largeArc = sliceAngle > 180 ? 1 : 0;
                const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
                slices.push(`<path d="${pathData}" fill="${color}" stroke="white" stroke-width="1.2"/>`);
            }

            currentAngle += sliceAngle;
        });

        // Create SVG
        const svg = `
            <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
                ${slices.join('')}
                <!-- Center circle with count -->
                <circle cx="${centerX}" cy="${centerY}" r="11" fill="white" stroke="#333" stroke-width="1.5"/>
                <text x="${centerX}" y="${centerY + 4}" text-anchor="middle" font-size="13" font-weight="bold" fill="#333">${count}</text>
            </svg>
        `;

        return svg;
    }

    /**
     * Add markers to the cluster group
     */
    addMarkersToCluster(markers) {
        if (!this.markerClusterGroup) {
            console.error('Clustering not initialized');
            return;
        }

        // For large numbers of markers, chunk the additions to show progress
        const CHUNK_SIZE = 100;
        let chunkIndex = 0;
        
        const addChunk = () => {
            const end = Math.min(chunkIndex + CHUNK_SIZE, markers.length);
            const chunk = markers.slice(chunkIndex, end);
            this.markerClusterGroup.addLayers(chunk);
            chunkIndex = end;
            
            if (chunkIndex < markers.length) {
                // Use requestAnimationFrame to keep UI responsive
                requestAnimationFrame(addChunk);
            }
        };
        
        addChunk();
    }

    /**
     * Clear all clustered markers
     */
    clear() {
        if (this.markerClusterGroup) {
            this.markerClusterGroup.clearLayers();
        }
    }

    /**
     * Show cluster info/breakdown when hovering or clicking
     */
    showClusterInfo(cluster) {
        const stats = cluster._clusterStats;
        if (!stats) return;

        // Create popup content with category breakdown
        let popupContent = `
            <div style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; min-width: 200px;">
                <h4 style="margin-top: 0; margin-bottom: 8px; text-align: center;">
                    Cluster: ${stats.total} locations
                </h4>
                <div style="border-top: 1px solid #ddd; padding-top: 8px;">
        `;

        // Get sorted categories by count
        const sortedCats = Object.keys(stats.stats)
            .filter(cat => stats.stats[cat] > 0)
            .sort((a, b) => stats.stats[b] - stats.stats[a]);

        sortedCats.forEach(cat => {
            const count = stats.stats[cat];
            const percentage = Math.round((count / stats.total) * 100);
            const color = CONFIG.categories[cat]?.color || CONFIG.categories.other.color;
            const name = CONFIG.categories[cat]?.name || cat;
            
            popupContent += `
                <div style="display: flex; align-items: center; margin-bottom: 6px; font-size: 12px;">
                    <div style="width: 14px; height: 14px; background-color: ${color}; border-radius: 2px; margin-right: 8px;"></div>
                    <span style="flex: 1;">${name}</span>
                    <span style="font-weight: bold; text-align: right; min-width: 30px;">${count}</span>
                    <span style="color: #999; margin-left: 4px; min-width: 35px; text-align: right;">(${percentage}%)</span>
                </div>
            `;
        });

        popupContent += `
                </div>
            </div>
        `;

        cluster.bindPopup(popupContent);
        cluster.openPopup();
    }

    /**
     * Inject cluster CSS styles
     */
    injectClusterStyles() {
        if (this.stylesInjected) {
            return;
        }

        const styles = `
            /* Cluster pie chart icon styles */
            .cluster-pie-icon {
                background-color: transparent !important;
                border: none !important;
            }

            /* Default cluster styles (backup for non-pie clusters) */
            .marker-cluster {
                background-clip: padding-box;
                border-radius: 50%;
                cursor: pointer;
            }

            .marker-cluster div {
                width: 100%;
                height: 100%;
                margin: 0;
                position: absolute;
                top: 0;
                left: 0;
                text-align: center;
                border-radius: 50%;
                font: 12px "Helvetica Neue", Arial, Helvetica, sans-serif;
                font-weight: bold;
                line-height: 25px;
            }

            .marker-cluster span {
                width: 100%;
                display: inline-block;
            }

            .marker-cluster span:first-child {
                position: relative;
                z-index: 2;
            }

            /* Cluster sizes (backup styles) */
            .marker-cluster-small {
                background-color: rgba(181, 226, 140, 0.6);
            }

            .marker-cluster-small div {
                background-color: rgba(110, 204, 57, 0.6);
            }

            .marker-cluster-medium {
                background-color: rgba(241, 211, 87, 0.6);
            }

            .marker-cluster-medium div {
                background-color: rgba(240, 194, 12, 0.6);
            }

            .marker-cluster-large {
                background-color: rgba(253, 156, 115, 0.6);
            }

            .marker-cluster-large div {
                background-color: rgba(241, 128, 23, 0.6);
            }
        `;

        const styleElement = document.createElement('style');
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
        this.stylesInjected = true;
    }
}

// Create global instance
const clusteringHandler = new ClusteringHandler();
