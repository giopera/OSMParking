# Quick Start Guide

Get the Parking Capacity application running in minutes!

## 1. Installation (Choose One)

### Option A: Direct File Open (Simplest)
Just open the `index.html` file in your web browser:
```
file:///path/to/parking_capacity/index.html
```

### Option B: Python Server
If you have Python 3 installed:
```bash
cd parking_capacity
python -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

### Option C: Node.js Server
If you have Node.js installed:
```bash
cd parking_capacity
npm install
npm start
```
Then open `http://localhost:8000` in your browser.

## 2. First Run

1. **Open the application** - The map starts centered on London by default
2. **Zoom in** - Zoom to level 10 or lower (shown in the status bar)
3. **Load Data** - Click the "Load Data" button to fetch parking data
4. **Explore** - Click on markers to see detailed parking information

## 3. Basic Usage

### Map Navigation
- **Zoom**: Scroll wheel or +/- buttons
- **Pan**: Click and drag the map
- **Double-click**: Center on that point

### Loading Parking Data
1. Zoom to area of interest (must be ≤ level 10)
2. Click "Load Data" button
3. Wait for data to load (progress shown in status bar)
4. Markers appear on the map

### Viewing Parking Details
1. Click any marker on the map
2. Popup shows:
   - Parking name
   - Address (if available)
   - All capacity types with numbers
   - Category indicators with colors
   - Link to OpenStreetMap
   - Website (if available)

### Customizing Overpass Server
1. In the control panel, go to "Overpass Server:"
2. Paste your custom Overpass API endpoint URL
3. Click "Update Server"
4. Server setting is saved for future sessions

## 4. Understanding Colors

Each marker color represents the primary parking category:

| Color | Category | Meaning |
|-------|----------|---------|
| 🔵 Blue | Main | Standard parking capacity |
| 🟢 Green | Disabled | Accessible/wheelchair spaces |
| 🟠 Orange | Parent/Baby | Parent & baby parking spaces |
| 🟣 Purple | Charging | EV charging stations |
| 🩷 Pink | Women | Women-designated spaces |
| 🩵 Cyan | Men | Men-designated spaces |
| ⚪ Gray | Other | Other capacity types |

### Multi-Color Markers

When a parking facility has **multiple capacity types**, the marker displays **colored segments** to show all categories:

- **Single category**: Shows one solid colored circle with a symbol
  - Example: Parking with only main capacity shows one blue circle with "P"
  
- **Multiple categories**: Shows pie-chart style segments with a number in the center
  - Example: Parking with main + disabled + charging shows 3 segments (blue, green, purple) with "3" in center
  - Hover over the marker to see it enlarge and reveal colors

This allows you to see at a glance which kinds of parking are available at each location!

## 5. Common Tasks

### View parking in your city
1. Search map for your city or use URL: `?lat=YOUR_LAT&lng=YOUR_LNG&zoom=13`
2. Zoom to level 10 or lower
3. Click "Load Data"

### Check available EV charging
1. Load data for an area
2. Look for purple markers (Charging category)
3. Click to see number of charging points

### Find accessible parking
1. Load data for area
2. Look for green markers (Disabled category)
3. Click to verify capacity and accessibility details

### Save map location
1. Pan and zoom to your preferred view
2. Settings auto-save to browser storage
3. Next time you visit, map opens to saved location

### Switch to different Overpass server
1. Update "Overpass Server" URL in control panel
2. Click "Update Server"
3. Try different servers if main one is busy:
   - Primary: `https://overpass-api.de/api/interpreter`
   - Mirror: `https://z.overpass-api.de/api/interpreter`
   - KUMI: `https://overpass.kumi.systems/api/interpreter`

## 6. Data Source Information

### OpenStreetMap Data
- All parking data comes from OpenStreetMap contributors
- Data is community-maintained and may vary in accuracy
- Help improve data by contributing to OpenStreetMap!

### Capacity Information
- `capacity` - Total parking spaces
- `capacity:disabled` - Wheelchair accessible spaces
- `capacity:charging` - EV charging points
- Other subtypes: woman, man, parent, baby

### Data Limitations
- Only shows parking tagged with capacity in OSM
- Not all parking facilities have capacity data
- Availability/occupancy not shown (real-time data not available)
- Some areas may have sparse data coverage

## 7. Tips & Tricks

- **Zoom matters**: Must zoom to ≤10 for data to load
- **Clear data**: Click "Clear Data" to start fresh without reloading
- **Mobile friendly**: Works on mobile - try landscape for better view
- **Performance**: Very dense urban areas may load slower
- **Browser storage**: Map position and preferences saved locally
- **No login needed**: Completely serverless, runs in your browser

## 8. Troubleshooting

### "Zoom in to level 10 or lower"
**Solution**: Keep zooming out until zoom counter shows ≤10

### No markers appear
**Solutions**:
1. Click "Load Data" button
2. Check internet connection
3. Try a different area (may not have parking data)
4. Check browser console for error messages (F12)

### Overpass API errors
**Solutions**:
1. Check your internet connection
2. Try a different Overpass server
3. Wait a moment and try again
4. Official Overpass can be slow during peak times

### Map won't load
**Solutions**:
1. Try a different browser
2. Clear browser cache and cookies
3. Ensure JavaScript is enabled
4. Check internet connection

## 9. Next Steps

- Read [EXAMPLES.md](EXAMPLES.md) for customization examples
- Check [README.md](README.md) for full documentation
- Contribute parking data to OpenStreetMap
- Join the community on [OSM forum](https://forum.openstreetmap.org/)

## 10. Support

For issues, questions, or suggestions:
1. Check [README.md](README.md) and [EXAMPLES.md](EXAMPLES.md)
2. Review [CONTRIBUTING.md](CONTRIBUTING.md)
3. Open an issue on GitHub
4. Improve OpenStreetMap data directly

Happy parking hunting! 🅿️
