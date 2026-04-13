# Examples and Customization

## URL Parameters

You can pass parameters via URL to set initial map location:

```
index.html?lat=51.505&lng=-0.09&zoom=13
```

To support this, add this to `js/app.js` in the `loadUserPreferences()` method:

```javascript
// Parse URL parameters
const params = new URLSearchParams(window.location.search);
const lat = params.get('lat');
const lng = params.get('lng');
const zoom = params.get('zoom');

if (lat && lng && zoom) {
    this.map.setView([parseFloat(lat), parseFloat(lng)], parseInt(zoom));
}
```

### Examples

- **London**: `?lat=51.505&lng=-0.09&zoom=13`
- **Berlin**: `?lat=52.52&lng=13.405&zoom=13`
- **Paris**: `?lat=48.856&lng=2.3522&zoom=13`
- **Global View**: `?lat=20&lng=0&zoom=2`

## Custom Overpass Queries

Modify `buildQuery()` in `js/overpass.js` to change what data is queried:

### Query only disabled parking:
```javascript
buildQuery(bounds) {
    const { south, west, north, east } = bounds;
    
    const query = `
[bbox:${south},${west},${north},${east}];
(
  way["amenity"="parking"]["capacity:disabled"];
  node["amenity"="parking"]["capacity:disabled"];
);
out center;
`;
    return query;
}
```

### Query with additional filters:
```javascript
buildQuery(bounds) {
    const { south, west, north, east } = bounds;
    
    const query = `
[bbox:${south},${west},${north},${east}];
(
  way["amenity"="parking"]["capacity"]["capacity">50];
  way["amenity"="parking"]["capacity:charging"];
  node["amenity"="parking"]["capacity"]["capacity">50];
  node["amenity"="parking"]["capacity:charging"];
);
out center;
`;
    return query;
}
```

## Custom Color Schemes

Modify colors in `js/config.js`:

### Dark theme:
```javascript
categories: {
    main: { name: 'Main Parking', color: '#64B5F6' },
    disabled: { name: 'Disabled Parking', color: '#81C784' },
    parent: { name: 'Parent/Baby Parking', color: '#FFB74D' },
    charging: { name: 'Charging Parking', color: '#BA68C8' },
    woman: { name: 'Woman Parking', color: '#EF5350' },
    man: { name: 'Man Parking', color: '#29B6F6' },
    other: { name: 'Other/Tagged', color: '#757575' }
}
```

### Colorblind-friendly:
```javascript
categories: {
    main: { name: 'Main Parking', color: '#0173B2' },      // Blue
    disabled: { name: 'Disabled Parking', color: '#DE8F05' }, // Orange
    parent: { name: 'Parent/Baby Parking', color: '#CCB974' }, // Brown
    charging: { name: 'Charging Parking', color: '#CA9161' },  // Red
    woman: { name: 'Woman Parking', color: '#56B4E9' },        // Sky blue
    man: { name: 'Man Parking', color: '#009E73' },            // Green
    other: { name: 'Other/Tagged', color: '#999999' }          // Gray
}
```

## Custom Marker Icons

Replace icon creation in `js/markers.js`:

### Use Font Awesome icons:
```javascript
createCustomIcon(color, opacity, category) {
    const icons = {
        main: 'fas fa-parking',
        disabled: 'fas fa-wheelchair',
        parent: 'fas fa-baby',
        charging: 'fas fa-bolt',
        woman: 'fas fa-venus',
        man: 'fas fa-mars'
    };
    
    const icon = L.icon({
        iconUrl: `https://cdn.example.com/icons/${icons[category]}.png`,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
    });
    
    return icon;
}
```

### Use emoji markers:
```javascript
createCustomIcon(color, opacity, category) {
    const emojis = {
        main: '🅿️',
        disabled: '♿️',
        parent: '🍼',
        charging: '⚡',
        woman: '♀️',
        man: '♂️'
    };
    
    const icon = L.divIcon({
        html: `<div style="font-size: 32px; line-height: 1;">${emojis[category]}</div>`,
        className: 'parking-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
    });
    
    return icon;
}
```

## Add Marker Clustering

Install Leaflet.markercluster:

```bash
npm install leaflet.markercluster
```

Add to `index.html`:
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.4.1/MarkerCluster.css" />
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.4.1/MarkerCluster.Default.css" />
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.4.1/leaflet.markercluster.js"></script>
```

Modify `js/markers.js`:
```javascript
initializeLayer(map) {
    this.markerLayer = L.markerClusterGroup({
        maxClusterRadius: 50,
        iconCreateFunction: (cluster) => {
            const count = cluster.getChildCount();
            const size = count < 10 ? 'small' : count < 20 ? 'medium' : 'large';
            return L.divIcon({
                html: `<div class="cluster cluster-${size}">${count}</div>`,
                className: 'marker-cluster',
                iconSize: L.point(40, 40)
            });
        }
    }).addTo(map);
    return this.markerLayer;
}
```

## Add Category Filters

Add to `index.html`:
```html
<div class="control-section">
    <h3>Filter by Category</h3>
    <label><input type="checkbox" class="category-filter" value="main" checked> Main</label>
    <label><input type="checkbox" class="category-filter" value="disabled" checked> Disabled</label>
    <label><input type="checkbox" class="category-filter" value="parent" checked> Parent/Baby</label>
    <label><input type="checkbox" class="category-filter" value="charging" checked> Charging</label>
</div>
```

Add to `js/app.js`:
```javascript
setupEventListeners() {
    // ... existing code ...
    
    // Category filters
    document.querySelectorAll('.category-filter').forEach(checkbox => {
        checkbox.addEventListener('change', () => this.applyFilters());
    });
}

applyFilters() {
    const activeCategories = Array.from(
        document.querySelectorAll('.category-filter:checked')
    ).map(cb => cb.value);
    
    markerHandler.getAllMarkers().forEach(marker => {
        const show = activeCategories.includes(marker.category);
        marker.setOpacity(show ? 1 : 0);
        marker.interactive = show;
    });
}
```

## Add Search Functionality

Add to `js/app.js`:
```javascript
setupEventListeners() {
    // ... existing code ...
    
    const searchInput = document.getElementById('search-parking');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => this.searchParking(e.target.value));
    }
}

searchParking(query) {
    const lowerQuery = query.toLowerCase();
    
    markerHandler.getAllMarkers().forEach(marker => {
        const name = marker.data.name.toLowerCase();
        const address = (marker.data.address || '').toLowerCase();
        
        const match = name.includes(lowerQuery) || address.includes(lowerQuery);
        marker.setOpacity(match ? 1 : 0.3);
    });
}
```

## Statistics and Analysis

Add to `js/markers.js`:
```javascript
getStatistics() {
    const markers = this.getAllMarkers();
    const stats = {
        total: markers.length,
        byCategory: {},
        totalCapacity: 0,
        averageCapacity: 0
    };
    
    markers.forEach(marker => {
        const cat = marker.category;
        stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;
        
        const capacity = parseInt(marker.data.capacity.capacity) || 0;
        stats.totalCapacity += capacity;
    });
    
    stats.averageCapacity = markers.length > 0 
        ? Math.round(stats.totalCapacity / markers.length)
        : 0;
    
    return stats;
}
```

Use in `js/app.js`:
```javascript
loadData() {
    // ... existing code ...
    
    if (features.length > 0) {
        markerHandler.addMarkers(features);
        const stats = markerHandler.getStatistics();
        this.updateStatus(
            `Loaded ${stats.total} locations, ${stats.totalCapacity} total spaces`
        );
    }
}
```
