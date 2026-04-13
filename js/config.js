/**
 * Application Configuration
 */

const CONFIG = {
    // Default map center (can be changed based on parameters)
    map: {
        defaultCenter: [51.505, -0.09],
        defaultZoom: 13,
        minZoom: 1,
        maxZoom: 19
    },
    
    // Overpass API Configuration
    overpass: {
        defaultServer: 'https://overpass-api.de/api/interpreter',
        timeout: 30000, // 30 seconds
        maxDataZoom: 13 // Only load data at this zoom level or lower
    },
    
    // Tile Layers (OpenStreetMap Standard)
    tiles: {
        standard: {
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }
    },
    
    // Parking Capacity Categories and Styling
    categories: {
        main: {
            name: 'Main Parking',
            color: '#2196F3',
            tags: ['capacity']
        },
        disabled: {
            name: 'Disabled Parking',
            color: '#4CAF50',
            tags: ['capacity:disabled']
        },
        parent: {
            name: 'Parent/Baby Parking',
            color: '#FF9800',
            tags: ['capacity:parent', 'capacity:baby']
        },
        charging: {
            name: 'Charging Parking',
            color: '#9C27B0',
            tags: ['capacity:charging']
        },
        woman: {
            name: 'Woman Parking',
            color: '#E91E63',
            tags: ['capacity:woman']
        },
        man: {
            name: 'Man Parking',
            color: '#00BCD4',
            tags: ['capacity:man']
        },
        other: {
            name: 'Other/Tagged',
            color: '#4a4a4a',
            tags: ['capacity:*']
        },
        no_capacity: {
            name: 'Parking (No Info)',
            color: '#BDBDBD',
            tags: []
        }
    },
    
    // Color intensity mapping for low/medium/high capacity
    intensityLevels: {
        low: 0.5,      // 50% opacity for low
        medium: 0.75,  // 75% opacity for medium
        high: 1.0      // 100% opacity for high
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
