/**
 * Overpass API Handler
 * Manages queries to the Overpass API for parking data
 */

class OverpassHandler {
    constructor(serverUrl = CONFIG.overpass.defaultServer) {
        this.serverUrl = serverUrl;
        this.abortController = null;
    }
    
    /**
     * Update the Overpass server URL
     */
    setServerUrl(url) {
        if (url && url.trim()) {
            this.serverUrl = url.trim();
            return true;
        }
        return false;
    }
    
    /**
     * Build Overpass QL query for parking areas
     * Queries for all parking-related features with and without capacity tags
     * Also queries for parking space elements
     */
    buildQuery(bounds) {
        const { south, west, north, east } = bounds;
        
        // Overpass QL query for parking facilities and parking space elements
        const query = `
[bbox:${south},${west},${north},${east}][out:json][timeout:${Math.floor(CONFIG.overpass.timeout / 1000)}];
(
  way["amenity"="parking"];
  node["amenity"="parking"];
  node["amenity"="parking_space"]["parking_space"~"disabled|charging|parent|woman|man|emergency"];
  way["amenity"="parking_space"]["parking_space"~"disabled|charging|parent|woman|man|emergency"];
);
out center;
`;
        return query;
    }
    
    /**
     * Fetch parking data from Overpass API
     * @param {LatLngBounds} bounds - Leaflet bounds object
     * @returns {Promise<Array>} Array of parking features
     */
    async fetchParkingData(bounds) {
        try {
            // Cancel previous request if any
            if (this.abortController) {
                this.abortController.abort();
            }
            this.abortController = new AbortController();
            
            // Build the query
            const query = this.buildQuery({
                south: bounds.getSouth(),
                west: bounds.getWest(),
                north: bounds.getNorth(),
                east: bounds.getEast()
            });
            
            // Create URL-encoded form data for POST request
            const params = new URLSearchParams();
            params.append('data', query);
            
            // Fetch from Overpass API
            const response = await fetch(this.serverUrl, {
                method: 'POST',
                body: params.toString(),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                signal: this.abortController.signal,
                timeout: CONFIG.overpass.timeout
            });
            
            if (!response.ok) {
                throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Parse and return features
            return this.parseOverpassData(data);
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Overpass request cancelled');
                return [];
            }
            console.error('Error fetching parking data:', error);
            throw error;
        }
    }
    
    /**
     * Parse Overpass JSON response into feature objects
     */
    parseOverpassData(data) {
        const features = [];
        
        if (!data.elements) {
            return features;
        }
        
        data.elements.forEach(element => {
            if (element.type === 'node') {
                // Node elements are already centered
                const feature = this.parseElement(element);
                if (feature) {
                    features.push(feature);
                }
            } else if (element.type === 'way' && element.center) {
                // Way elements need their center point
                const feature = this.parseElement(element);
                if (feature) {
                    features.push(feature);
                }
            }
        });
        
        return features;
    }
    
    /**
     * Parse individual element into feature object
     */
    parseElement(element) {
        const tags = element.tags || {};
        
        // Extract coordinates
        let lat, lng;
        if (element.lat !== undefined && element.lon !== undefined) {
            lat = element.lat;
            lng = element.lon;
        } else if (element.center) {
            lat = element.center.lat;
            lng = element.center.lon;
        } else {
            return null;
        }
        
        // Check if this is a parking_space element
        const isParkingSpace = tags.amenity === 'parking_space';
        
        // Extract capacity information
        const capacity = this.extractCapacityInfo(tags);
        
        return {
            id: element.id,
            type: element.type,
            lat: lat,
            lng: lng,
            name: tags.name || 'Unnamed Parking',
            address: tags['addr:street'] || '',
            capacity: capacity,
            tags: tags,
            url: tags.website || tags.url || '',
            isParkingSpace: isParkingSpace,
            parkingSpaceType: tags.parking_space || null
        };
    }
    
    /**
     * Extract capacity-related tags from element
     */
    extractCapacityInfo(tags) {
        const capacityInfo = {};
        const capacityKeys = [
            'capacity',
            'capacity:disabled',
            'capacity:parent',
            'capacity:baby',
            'capacity:charging',
            'capacity:woman',
            'capacity:man',
            'capacity:emergency'
        ];
        
        capacityKeys.forEach(key => {
            if (tags[key]) {
                capacityInfo[key] = parseInt(tags[key]) || tags[key];
            }
        });
        
        // Check for any other capacity:* tags
        for (const key in tags) {
            if (key.startsWith('capacity:') && !capacityKeys.includes(key)) {
                capacityInfo[key] = tags[key];
            }
        }
        
        return capacityInfo;
    }
    
    /**
     * Determine primary category based on capacity tags
     */
    getPrimaryCategory(capacityInfo) {
        // Priority order
        if (Object.keys(capacityInfo).length === 0) return 'no_capacity';
        if (capacityInfo['capacity:emergency']) return 'emergency';
        if (capacityInfo['capacity:charging']) return 'charging';
        if (capacityInfo['capacity:disabled']) return 'disabled';
        if (capacityInfo['capacity:parent'] || capacityInfo['capacity:baby']) return 'parent';
        if (capacityInfo['capacity:woman']) return 'woman';
        if (capacityInfo['capacity:man']) return 'man';
        if (capacityInfo['capacity']) return 'main';
        return 'other';
    }
    
    /**
     * Get all categories present in this parking
     */
    getAllCategories(capacityInfo) {
        const categories = [];
        if (Object.keys(capacityInfo).length === 0) {
            categories.push('no_capacity');
        } else {
            if (capacityInfo['capacity']) categories.push('main');
            if (capacityInfo['capacity:disabled']) categories.push('disabled');
            if (capacityInfo['capacity:parent'] || capacityInfo['capacity:baby']) categories.push('parent');
            if (capacityInfo['capacity:charging']) categories.push('charging');
            if (capacityInfo['capacity:emergency']) categories.push('emergency');
            if (capacityInfo['capacity:woman']) categories.push('woman');
            if (capacityInfo['capacity:man']) categories.push('man');
        }
        return categories;
    }
    
    /**
     * Cancel any pending request
     */
    cancel() {
        if (this.abortController) {
            this.abortController.abort();
        }
    }
}

// Create global instance
const overpassHandler = new OverpassHandler();
