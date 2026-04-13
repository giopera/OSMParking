# Parking Capacity Viewer

A JavaScript application to visualize parking capacity data on an OpenStreetMap using a serverless architecture. Built with Leaflet and the Overpass API, following the structure and standards of [OSMStreetLight](https://github.com/giopera/OSMStreetLight).

## Features

- 🗺️ **Interactive Leaflet Map** - Based on OpenStreetMap with standard tile layers
- 📍 **Real-time Parking Data** - Queries Overpass API for all parking facilities (with or without capacity information)
- 🎨 **Color-coded Categories** - Visual distinction for different parking types:
  - **Main Parking** (Blue) - Standard parking capacity
  - **Disabled Parking** (Green) - Accessible parking spaces
  - **Parent/Baby Parking** (Orange) - Parent and baby spaces
  - **Charging Parking** (Purple) - EV charging stations
  - **Women Parking** (Pink) - Women-designated spaces
  - **Men Parking** (Cyan) - Men-designated spaces
  - **Other/Tagged** (Gray) - Other capacity tags
  - **No Info** (Light Gray) - Parking facilities without capacity data

- 📊 **Comprehensive Tag Support** - Evaluates all OpenStreetMap parking capacity tags:
  - `capacity` - Total parking spaces
  - `capacity:disabled` - Disabled accessible spaces
  - `capacity:woman` - Women-specific spaces
  - `capacity:man` - Men-specific spaces
  - `capacity:parent` - Parent/baby spaces
  - `capacity:baby` - Baby/child spaces
  - `capacity:charging` - EV charging points
  - `capacity:*` - Any other capacity subtags

- ⚙️ **Customizable Overpass Server** - Change the Overpass API endpoint via UI popup
- 🔌 **Smart Zoom Control** - Data loading only available below zoom level 10 for performance
- 💾 **Persistent Preferences** - Browser localStorage saves map position and Overpass server
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Project Structure

```
parking_capacity/
├── index.html           # Main HTML file with map container
├── css/
│   └── style.css       # Application styling
├── js/
│   ├── config.js       # Configuration constants
│   ├── overpass.js     # Overpass API handler
│   ├── markers.js      # Marker creation and styling
│   └── app.js          # Main application logic
├── .gitignore
└── README.md
```

## Getting Started

### Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection (for maps and Overpass API)
- Optional: Local web server for development

### Installation

1. Clone or download this repository:
```bash
git clone https://github.com/giopera/parking_capacity.git
cd parking_capacity
```

2. Open `index.html` in your browser:
   - **Option A**: Direct file open - `file:///path/to/parking_capacity/index.html`
   - **Option B**: Using Python (Python 3):
     ```bash
     python -m http.server 8000
     # Then open http://localhost:8000
     ```
   - **Option C**: Using Node.js/npm:
     ```bash
     npx http-server
     ```

### Usage

1. **Navigate the map** - Zoom and pan to your desired location
2. **Check zoom level** - The status bar shows current zoom level
3. **Load data** - Click "Load Data" button when at zoom level ≤ 10
4. **View details** - Click markers to see parking capacity information
5. **Customize Overpass** - Modify the Overpass server URL in the text area and click "Update Server"
6. **Clear data** - Click "Clear Data" to remove all markers

## Configuration

Edit `js/config.js` to customize:

- **Default map center and zoom**: `CONFIG.map.defaultCenter`, `CONFIG.map.defaultZoom`
- **Overpass API endpoint**: `CONFIG.overpass.defaultServer`
- **Category colors**: `CONFIG.categories[category].color`
- **Data loading zoom threshold**: `CONFIG.overpass.maxDataZoom`

## API Reference

### OverpassHandler

Manages queries to the Overpass API:

```javascript
// Fetch parking data for current map bounds
const features = await overpassHandler.fetchParkingData(bounds);

// Change Overpass server
overpassHandler.setServerUrl('https://custom-overpass-server/api/interpreter');

// Get primary category for a parking location
const category = overpassHandler.getPrimaryCategory(capacityInfo);
```

### MarkerHandler

Manages marker visualization:

```javascript
// Create markers from features
markerHandler.addMarkers(features);

// Clear all markers
markerHandler.clear();

// Get marker by ID
const marker = markerHandler.getMarker(featureId);
```

### ParkingCapacityApp

Main application controller:

```javascript
// Access the app instance
window.parkingApp

// Load data
parkingApp.loadData();

// Clear data
parkingApp.clearData();
```

## Data Sources

- **Maps**: [OpenStreetMap](https://www.openstreetmap.org/) - © OpenStreetMap contributors
- **Parking Data**: [Overpass API](https://overpass-api.de/) - Queries OSM database
- **Map Library**: [Leaflet](https://leafletjs.com/) - Open-source mapping library

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari, Chrome Mobile

## Performance Considerations

- **Zoom Level Restriction**: Data only loads at zoom ≤ 10 to reduce API calls and improve performance
- **Caching**: Browser localStorage caches map position and preferences
- **Marker Clustering**: For dense areas, consider adding a clustering library like Leaflet.markercluster

## Troubleshooting

### "Zoom in to level 10 or lower to load data"
The map is zoomed in too far. Zoom out to see parking data.

### "Overpass API error"
- Check your internet connection
- Verify the Overpass server URL is correct
- Try the default Overpass server: `https://overpass-api.de/api/interpreter`
- Overpass server might be temporarily unavailable

### No markers appear
- Ensure you're zoomed to level ≤ 10
- Click "Load Data" button
- The area might not have parking facilities tagged with capacity information in OSM
- Check the browser console for error messages

## Future Enhancements

- Marker clustering for dense areas
- Filtering by category
- Real-time capacity updates
- Historical statistics
- Advanced search and filtering
- Mobile app version
- Export functionality

## License

This project follows the OpenStreetMap data license (ODbL 1.0). See OSM licensing information for details.

## Contributing

Contributions are welcome! Please ensure parking data is properly tagged in OpenStreetMap before submitting.

## References

- [OpenStreetMap Wiki - Parking](https://wiki.openstreetmap.org/wiki/Tag:amenity=parking)
- [Overpass API Documentation](https://wiki.openstreetmap.org/wiki/Overpass_API)
- [Leaflet Documentation](https://leafletjs.com/reference.html)
- [OSMStreetLight Project](https://github.com/giopera/OSMStreetLight)