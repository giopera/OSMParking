/**
 * Application Configuration
 */

const CONFIG = {
    // Default map center (can be changed based on parameters)
    map: {
        defaultCenter: [41.902277, 12.476349],
        defaultZoom: 13,
        minZoom: 1,
        maxZoom: 19
    },
    
    // Overpass API Configuration
    overpass: {
        defaultServer: 'https://overpass-api.de/api/interpreter',
        timeout: 120000, // 30 seconds
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
            color: '#008cff',
            tags: ['capacity']
        },
        disabled: {
            name: 'Disabled Parking',
            color: '#ffc519',
            tags: ['capacity:disabled']
        },
        parent: {
            name: 'Parent/Baby Parking',
            color: '#d600d6',
            tags: ['capacity:parent', 'capacity:baby']
        },
        charging: {
            name: 'Charging Parking',
            color: '#0ab407',
            tags: ['capacity:charging']
        },
        woman: {
            name: 'Woman Parking',
            color: '#ff61dd',
            tags: ['capacity:women']
        },
        man: {
            name: 'Man Parking',
            color: '#00BCD4',
            tags: ['capacity:man']
        },
        emergency: {
            name: 'Emergency Parking',
            color: '#f02d1f',
            tags: ['capacity:emergency']
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
    
    // Parking Space Elements (small point markers)
    parkingSpaces: {
        disabled: {
            name: 'Disabled Space',
            color: '#ffc519',
            icon: '♿'
        },
        charging: {
            name: 'Charging Point',
            color: '#0ab407',
            icon: '⚡'
        },
        parent: {
            name: 'Parent/Baby Space',
            color: '#d600d6',
            icon: '👶'
        },
        woman: {
            name: 'Woman Space',
            color: '#ff61dd',
            icon: '♀'
        },
        man: {
            name: 'Man Space',
            color: '#00BCD4',
            icon: '♂'
        },
        emergency: {
            name: 'Emergency Space',
            color: '#f02d1f',
            icon: '🚨'
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
