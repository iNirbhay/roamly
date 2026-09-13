/**
 * ROAMLY — LISTING LOCATION & NEARBY ATTRACTIONS COMPONENT
 * Reusable Leaflet controller for individual sanctuary pages.
 */

window.ListingLocationMap = (function () {
  'use strict';

  // 1. Base Geographic Coordinates for Indian Cities & Regions
  const CITY_COORDINATES = {
    "Jaipur": { lat: 26.9124, lng: 75.7873, state: "Rajasthan" },
    "Udaipur": { lat: 24.5854, lng: 73.7125, state: "Rajasthan" },
    "Jodhpur": { lat: 26.2389, lng: 73.0243, state: "Rajasthan" },
    "Jaisalmer": { lat: 26.9157, lng: 70.9083, state: "Rajasthan" },
    "Pushkar": { lat: 26.4899, lng: 74.5511, state: "Rajasthan" },
    "Bikaner": { lat: 28.0229, lng: 73.3119, state: "Rajasthan" },
    "Goa": { lat: 15.2993, lng: 74.1240, state: "Goa" },
    "Panjim": { lat: 15.4909, lng: 73.8278, state: "Goa" },
    "Mumbai": { lat: 18.9220, lng: 72.8347, state: "Maharashtra" },
    "Pune": { lat: 18.5204, lng: 73.8567, state: "Maharashtra" },
    "Lonavala": { lat: 18.7557, lng: 73.4091, state: "Maharashtra" },
    "Mahabaleshwar": { lat: 17.9307, lng: 73.6477, state: "Maharashtra" },
    "Nashik": { lat: 19.9975, lng: 73.7898, state: "Maharashtra" },
    "Alibaug": { lat: 18.6414, lng: 72.8722, state: "Maharashtra" },
    "Delhi": { lat: 28.6139, lng: 77.2090, state: "Delhi NCR" },
    "Gurgaon": { lat: 28.4595, lng: 77.0266, state: "Haryana" },
    "Bengaluru": { lat: 12.9716, lng: 77.5946, state: "Karnataka" },
    "Bangalore": { lat: 12.9716, lng: 77.5946, state: "Karnataka" },
    "Mysore": { lat: 12.2958, lng: 76.6394, state: "Karnataka" },
    "Coorg": { lat: 12.3375, lng: 75.8069, state: "Karnataka" },
    "Hampi": { lat: 15.3350, lng: 76.4600, state: "Karnataka" },
    "Hyderabad": { lat: 17.3850, lng: 78.4867, state: "Telangana" },
    "Chennai": { lat: 13.0827, lng: 80.2707, state: "Tamil Nadu" },
    "Ooty": { lat: 11.4102, lng: 76.6950, state: "Tamil Nadu" },
    "Pondicherry": { lat: 11.9416, lng: 79.8083, state: "Puducherry" },
    "Kochi": { lat: 9.9312, lng: 76.2673, state: "Kerala" },
    "Alleppey": { lat: 9.4981, lng: 76.3388, state: "Kerala" },
    "Kumarakom": { lat: 9.6175, lng: 76.4301, state: "Kerala" },
    "Munnar": { lat: 10.0889, lng: 77.0595, state: "Kerala" },
    "Wayanad": { lat: 11.6854, lng: 76.1320, state: "Kerala" },
    "Kovalam": { lat: 8.4004, lng: 76.9787, state: "Kerala" },
    "Manali": { lat: 32.2432, lng: 77.1892, state: "Himachal Pradesh" },
    "Shimla": { lat: 31.1048, lng: 77.1734, state: "Himachal Pradesh" },
    "Kasol": { lat: 32.0100, lng: 77.3150, state: "Himachal Pradesh" },
    "Dharamshala": { lat: 32.2190, lng: 76.3234, state: "Himachal Pradesh" },
    "Mussoorie": { lat: 30.4598, lng: 78.0644, state: "Uttarakhand" },
    "Nainital": { lat: 29.3919, lng: 79.4542, state: "Uttarakhand" },
    "Rishikesh": { lat: 30.0869, lng: 78.2676, state: "Uttarakhand" },
    "Agra": { lat: 27.1767, lng: 78.0081, state: "Uttar Pradesh" },
    "Varanasi": { lat: 25.3176, lng: 82.9739, state: "Uttar Pradesh" },
    "Lucknow": { lat: 26.8467, lng: 80.9462, state: "Uttar Pradesh" },
    "Amritsar": { lat: 31.6340, lng: 74.8723, state: "Punjab" },
    "Chandigarh": { lat: 30.7333, lng: 76.7794, state: "Chandigarh" },
    "Kolkata": { lat: 22.5726, lng: 88.3639, state: "West Bengal" },
    "Darjeeling": { lat: 27.0410, lng: 88.2663, state: "West Bengal" },
    "Gangtok": { lat: 27.3389, lng: 88.6065, state: "Sikkim" },
    "Shillong": { lat: 25.5788, lng: 91.8933, state: "Meghalaya" },
    "Puri": { lat: 19.8135, lng: 85.8312, state: "Odisha" },
    "Indore": { lat: 22.7196, lng: 75.8577, state: "Madhya Pradesh" },
    "Ahmedabad": { lat: 23.0225, lng: 72.5714, state: "Gujarat" },
    "Srinagar": { lat: 34.0837, lng: 74.7973, state: "Jammu & Kashmir" },
    "Havelock Island": { lat: 11.9840, lng: 92.9876, state: "Andaman Islands" }
  };

  // 2. Comprehensive Destination Tourist Attractions Database
  const NEARBY_ATTRACTIONS_MAP = {
    "Udaipur": [
      { name: "City Palace", lat: 24.5764, lng: 73.6835, category: "Royal Palace", icon: "🏛️" },
      { name: "Lake Pichola", lat: 24.5744, lng: 73.6742, category: "Scenic Lake", icon: "🌊" },
      { name: "Jagdish Temple", lat: 24.5794, lng: 73.6847, category: "Historic Temple", icon: "🛕" },
      { name: "Sajjangarh (Monsoon Palace)", lat: 24.5902, lng: 73.6378, category: "Hilltop Fortress", icon: "🌄" },
      { name: "Bagore Ki Haveli", lat: 24.5801, lng: 73.6806, category: "Heritage Museum", icon: "🏰" },
      { name: "Saheliyon Ki Bari", lat: 24.6022, lng: 73.6874, category: "Royal Gardens", icon: "🌿" }
    ],
    "Delhi": [
      { name: "India Gate", lat: 28.6129, lng: 77.2295, category: "National Memorial", icon: "🏛️" },
      { name: "Red Fort", lat: 28.6562, lng: 77.2410, category: "Mughal Citadel", icon: "🏰" },
      { name: "Qutub Minar", lat: 28.5244, lng: 77.1855, category: "UNESCO Victory Tower", icon: "🗼" },
      { name: "Humayun's Tomb", lat: 28.5933, lng: 77.2507, category: "Mughal Monument", icon: "🏛️" },
      { name: "Lotus Temple", lat: 28.5535, lng: 77.2588, category: "Architectural Sanctuary", icon: "🛕" },
      { name: "Lodhi Gardens", lat: 28.5931, lng: 77.2197, category: "Heritage Park", icon: "🌿" }
    ],
    "Chennai": [
      { name: "Marina Beach", lat: 13.0500, lng: 80.2824, category: "Coastal Promenade", icon: "🌊" },
      { name: "Kapaleeshwarar Temple", lat: 13.0336, lng: 80.2699, category: "Dravidian Temple", icon: "🛕" },
      { name: "Fort St. George", lat: 13.0797, lng: 80.2878, category: "Colonial Fortress", icon: "🏰" },
      { name: "San Thome Cathedral", lat: 13.0334, lng: 80.2783, category: "Historic Basilica", icon: "⛪" },
      { name: "Government Museum", lat: 13.0716, lng: 80.2562, category: "Art & Bronze Gallery", icon: "🏛️" }
    ],
    "Jaipur": [
      { name: "Hawa Mahal", lat: 26.9239, lng: 75.8267, category: "Palace of Winds", icon: "🏛️" },
      { name: "Amber Fort", lat: 26.9855, lng: 75.8513, category: "Hilltop Citadel", icon: "🏰" },
      { name: "City Palace", lat: 26.9258, lng: 75.8236, category: "Royal Residence", icon: "🏛️" },
      { name: "Jal Mahal", lat: 26.9534, lng: 75.8462, category: "Submerged Palace", icon: "🌊" },
      { name: "Nahargarh Fort", lat: 26.9372, lng: 75.8155, category: "Panoramic Viewpoint", icon: "🌄" },
      { name: "Jantar Mantar", lat: 26.9248, lng: 75.8246, category: "Astronomical Wonder", icon: "🔭" }
    ],
    "Goa": [
      { name: "Palolem Beach", lat: 15.0100, lng: 74.0232, category: "Crescent Beach", icon: "🌊" },
      { name: "Fort Aguada", lat: 15.4920, lng: 73.7737, category: "Coastal Fortress", icon: "🏰" },
      { name: "Basilica of Bom Jesus", lat: 15.5009, lng: 73.9116, category: "UNESCO World Heritage", icon: "⛪" },
      { name: "Anjuna Beach", lat: 15.5807, lng: 73.7423, category: "Bohemian Coast", icon: "🌊" },
      { name: "Fontainhas", lat: 15.4989, lng: 73.8310, category: "Latin Heritage Quarter", icon: "🏡" }
    ],
    "Panjim": [
      { name: "Our Lady of the Immaculate Conception", lat: 15.4989, lng: 73.8290, category: "Historic Church", icon: "⛪" },
      { name: "Fontainhas Latin Quarter", lat: 15.4989, lng: 73.8310, category: "Portuguese Quarter", icon: "🏡" },
      { name: "Miramar Beach", lat: 15.4833, lng: 73.8050, category: "Sunset Coastline", icon: "🌊" },
      { name: "Reis Magos Fort", lat: 15.4975, lng: 73.8092, category: "Mandovi River Fort", icon: "🏰" }
    ],
    "Manali": [
      { name: "Hadimba Temple", lat: 32.2483, lng: 77.1706, category: "Cedar Forest Shrine", icon: "🛕" },
      { name: "Solang Valley", lat: 32.3166, lng: 77.1575, category: "Alpine Valley", icon: "🌄" },
      { name: "Jogini Waterfall", lat: 32.2694, lng: 77.1956, category: "Glacial Cascade", icon: "🌊" },
      { name: "Old Manali Village", lat: 32.2530, lng: 77.1750, category: "Rustic Alpine Village", icon: "🏡" },
      { name: "Vashisht Hot Springs", lat: 32.2625, lng: 77.1878, category: "Mineral Baths", icon: "♨️" }
    ],
    "Shimla": [
      { name: "The Ridge & Mall Road", lat: 31.1044, lng: 77.1741, category: "Promenade", icon: "🏛️" },
      { name: "Jakhu Temple", lat: 31.1009, lng: 77.1856, category: "Mountain Peak Temple", icon: "🛕" },
      { name: "Viceregal Lodge", lat: 31.1037, lng: 77.1408, category: "Colonial Manor", icon: "🏰" },
      { name: "Kufri Viewpoint", lat: 31.0978, lng: 77.2678, category: "Snow Valley", icon: "🌄" }
    ],
    "Munnar": [
      { name: "Eravikulam National Park", lat: 10.1983, lng: 77.0544, category: "Tahr Sanctuary", icon: "🌿" },
      { name: "Mattupetty Dam", lat: 10.1066, lng: 77.1244, category: "Mountain Reservoir", icon: "🌊" },
      { name: "KDHP Tea Museum", lat: 10.0880, lng: 77.0515, category: "Tea Plantation Heritage", icon: "🍃" },
      { name: "Attukad Waterfall", lat: 10.0528, lng: 77.0392, category: "Jungle Cascade", icon: "🌊" },
      { name: "Top Station", lat: 10.1242, lng: 77.2450, category: "Cloudline Peak", icon: "🌄" }
    ],
    "Mumbai": [
      { name: "Gateway of India", lat: 18.9220, lng: 72.8347, category: "Colonial Arch", icon: "🏛️" },
      { name: "Marine Drive", lat: 18.9432, lng: 72.8230, category: "Queen's Necklace", icon: "🌊" },
      { name: "Chhatrapati Shivaji Terminus", lat: 18.9400, lng: 72.8353, category: "Gothic Terminus", icon: "🏛️" },
      { name: "Bandra Fort & Bandstand", lat: 19.0430, lng: 72.8188, category: "Coastal Promenade", icon: "🏰" }
    ],
    "Agra": [
      { name: "Taj Mahal", lat: 27.1751, lng: 78.0421, category: "World Heritage Wonder", icon: "🏛️" },
      { name: "Agra Fort", lat: 27.1795, lng: 78.0211, category: "Imperial Mughal Citadel", icon: "🏰" },
      { name: "Mehtab Bagh", lat: 27.1800, lng: 78.0420, category: "Yamuna Sunset Garden", icon: "🌿" },
      { name: "Itmad-ud-Daulah", lat: 27.1928, lng: 78.0311, category: "Baby Taj Tomb", icon: "🏛️" }
    ],
    "Varanasi": [
      { name: "Dashashwamedh Ghat", lat: 25.3076, lng: 83.0104, category: "Sacred Aarti Ghat", icon: "🌊" },
      { name: "Kashi Vishwanath Temple", lat: 25.3109, lng: 83.0107, category: "Jyotirlinga Temple", icon: "🛕" },
      { name: "Assi Ghat", lat: 25.2905, lng: 83.0069, category: "Serene Ganges Ghat", icon: "🌊" },
      { name: "Sarnath", lat: 25.3811, lng: 83.0214, category: "Buddhist Deer Park", icon: "🛕" }
    ],
    "Rishikesh": [
      { name: "Laxman Jhula", lat: 30.1264, lng: 78.3283, category: "Suspension Bridge", icon: "🌉" },
      { name: "Ram Jhula", lat: 30.1178, lng: 78.3142, category: "Sacred Footbridge", icon: "🌉" },
      { name: "Triveni Ghat", lat: 30.1030, lng: 78.2970, category: "Maha Aarti Ghat", icon: "🌊" },
      { name: "Beatles Ashram", lat: 30.1130, lng: 78.3180, category: "Spiritual Heritage", icon: "🌿" },
      { name: "Neer Garh Waterfall", lat: 30.1444, lng: 78.3411, category: "Forest Waterfall", icon: "🌊" }
    ],
    "Kochi": [
      { name: "Fort Kochi Chinese Fishing Nets", lat: 9.9675, lng: 76.2422, category: "Historic Waterfront", icon: "🌊" },
      { name: "Mattancherry Dutch Palace", lat: 9.9583, lng: 76.2592, category: "Colonial Palace", icon: "🏰" },
      { name: "Jew Town & Paradesi Synagogue", lat: 9.9575, lng: 76.2598, category: "Heritage Quarter", icon: "🏛️" },
      { name: "St. Francis Church", lat: 9.9664, lng: 76.2415, category: "Historic Church", icon: "⛪" }
    ],
    "Alleppey": [
      { name: "Vembanad Backwaters", lat: 9.5800, lng: 76.4000, category: "Lagoon Backwaters", icon: "🌊" },
      { name: "Alappuzha Beach & Pier", lat: 9.4925, lng: 76.3180, category: "Lighthouse Beach", icon: "🌊" },
      { name: "Marari Beach", lat: 9.6000, lng: 76.2950, category: "Secluded Palm Coast", icon: "🏖️" },
      { name: "Pathiramanal Island", lat: 9.6170, lng: 76.3890, category: "Migratory Bird Sanctuary", icon: "🌿" }
    ],
    "Jodhpur": [
      { name: "Mehrangarh Fort", lat: 26.2978, lng: 73.0185, category: "Majestic Citadel", icon: "🏰" },
      { name: "Jaswant Thada", lat: 26.3015, lng: 73.0244, category: "Marble Memorial", icon: "🏛️" },
      { name: "Umaid Bhawan Palace", lat: 26.2813, lng: 73.0478, category: "Art Deco Palace", icon: "🏛️" },
      { name: "Toorji Ka Jhalra", lat: 26.2950, lng: 73.0230, category: "Historic Stepwell", icon: "🌊" }
    ],
    "Jaisalmer": [
      { name: "Jaisalmer Golden Fort", lat: 26.9124, lng: 70.9127, category: "Living Sandstone Fort", icon: "🏰" },
      { name: "Patwon Ki Haveli", lat: 26.9168, lng: 70.9135, category: "Ornate Haveli", icon: "🏛️" },
      { name: "Gadisar Lake", lat: 26.9080, lng: 70.9230, category: "Desert Oasis", icon: "🌊" },
      { name: "Sam Sand Dunes", lat: 26.8300, lng: 70.5000, category: "Golden Dunes", icon: "🏜️" }
    ],
    "Amritsar": [
      { name: "Golden Temple (Harmandir Sahib)", lat: 31.6200, lng: 74.8765, category: "Sacred Shrine", icon: "🛕" },
      { name: "Jallianwala Bagh", lat: 31.6208, lng: 74.8800, category: "National Memorial", icon: "🏛️" },
      { name: "Wagah Border", lat: 31.6045, lng: 74.5735, category: "Border Ceremony", icon: "🇮🇳" },
      { name: "Gobindgarh Fort", lat: 31.6295, lng: 74.8580, category: "Historic Citadel", icon: "🏰" }
    ]
  };

  // 3. Haversine Formula: Calculate Distance in Kilometers
  function calculateHaversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Format distance cleanly (e.g. "2.4 km", "850 m")
  function formatDistance(km) {
    if (km < 1) {
      return `${Math.round(km * 1000)} m away`;
    }
    return `${km.toFixed(1)} km away`;
  }

  // 4. Resolve City Coordinates with Micro-Jitter
  function getCoordinatesForListing(location, listingId, directLat, directLng) {
    if (directLat && directLng && !isNaN(directLat) && !isNaN(directLng)) {
      return { lat: parseFloat(directLat), lng: parseFloat(directLng), state: "India" };
    }

    const cleanLoc = (location || "").trim();
    const info = CITY_COORDINATES[cleanLoc] || 
                 CITY_COORDINATES[Object.keys(CITY_COORDINATES).find(k => k.toLowerCase() === cleanLoc.toLowerCase())];

    if (!info) {
      return { lat: 24.5854, lng: 73.7125, state: "India" };
    }

    // Micro-offset for co-located stays so multiple properties in same city don't overlap completely
    let hash = 0;
    const idStr = String(listingId || "");
    for (let i = 0; i < idStr.length; i++) {
      hash = (hash << 5) - hash + idStr.charCodeAt(i);
      hash |= 0;
    }
    const latOffset = ((Math.abs(hash) % 100) - 50) * 0.00032;
    const lngOffset = ((Math.abs(hash * 3) % 100) - 50) * 0.00032;

    return {
      lat: info.lat + latOffset,
      lng: info.lng + lngOffset,
      state: info.state
    };
  }

  // 5. Generate Nearby Attractions Data
  function getNearbyAttractions(cityName, stayLat, stayLng) {
    const cleanCity = (cityName || "").trim();
    let rawList = NEARBY_ATTRACTIONS_MAP[cleanCity] || 
                  NEARBY_ATTRACTIONS_MAP[Object.keys(NEARBY_ATTRACTIONS_MAP).find(k => k.toLowerCase() === cleanCity.toLowerCase())];

    // Fallback: If city not in detailed database, synthesize 4 realistic nearby cultural landmarks around coordinates
    if (!rawList || rawList.length === 0) {
      rawList = [
        { name: `${cleanCity} Heritage Center`, lat: stayLat + 0.012, lng: stayLng + 0.010, category: "Cultural Heritage", icon: "🏛️" },
        { name: `${cleanCity} Scenic Viewpoint`, lat: stayLat - 0.015, lng: stayLng + 0.018, category: "Nature Vista", icon: "🌄" },
        { name: `${cleanCity} Promenade & Lake`, lat: stayLat + 0.018, lng: stayLng - 0.014, category: "Waterside Walk", icon: "🌊" },
        { name: `${cleanCity} Local Bazaar`, lat: stayLat - 0.008, lng: stayLng - 0.012, category: "Artisan Market", icon: "🛍️" }
      ];
    }

    // Compute actual Haversine distances from stay coordinates
    const calculated = rawList.map(attr => {
      const dist = calculateHaversineKm(stayLat, stayLng, attr.lat, attr.lng);
      return {
        ...attr,
        distanceKm: dist,
        distanceText: formatDistance(dist)
      };
    });

    // Sort by distance (closest first)
    calculated.sort((a, b) => a.distanceKm - b.distanceKm);

    // Return top 5 closest attractions
    return calculated.slice(0, 5);
  }

  // 6. Main Component Initialization Function
  function init(options) {
    const {
      containerId = "propertyLocationMap",
      attractionsContainerId = "nearbyAttractionsList",
      listing = {}
    } = options;

    const mapElement = document.getElementById(containerId);
    if (!mapElement) return;

    // Resolve coordinates
    const coords = getCoordinatesForListing(listing.location, listing._id, listing.lat, listing.lng);
    const stayLat = coords.lat;
    const stayLng = coords.lng;
    const stayState = coords.state || "India";

    // Setup "Get Directions" anchor
    const directionsBtn = document.getElementById("getDirectionsBtn");
    if (directionsBtn) {
      directionsBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${stayLat},${stayLng}`;
    }

    // Update location badge text
    const badgeCityText = document.getElementById("mapBadgeCityText");
    if (badgeCityText) {
      badgeCityText.textContent = `${listing.location || "India"}, ${stayState}`;
    }

    // Initialize Leaflet Map
    const map = L.map(containerId, {
      center: [stayLat, stayLng],
      zoom: 13,
      minZoom: 5,
      maxZoom: 18,
      zoomControl: false,
      scrollWheelZoom: false // disable scroll wheel zoom by default to prevent accidental page scroll hijacking
    });

    // Enable scroll zoom on click/focus
    map.on('focus', () => map.scrollWheelZoom.enable());
    map.on('blur', () => map.scrollWheelZoom.disable());

    // Clean zoom control at top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Warm, editorial light CartoDB Voyager travel tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    // Ensure map tiles properly render
    setTimeout(() => map.invalidateSize(), 250);
    window.addEventListener("resize", () => map.invalidateSize());

    // 1. Prominent Roamly Property Marker
    const propertyIcon = L.divIcon({
      className: 'custom-property-pin-div',
      html: `
        <div class="property-marker-wrap">
          <div class="property-pulse-ring"></div>
          <div class="property-pin-bubble">
            <i class="fa-solid fa-house"></i>
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 44],
      popupAnchor: [0, -42]
    });

    const propertyMarker = L.marker([stayLat, stayLng], {
      icon: propertyIcon,
      zIndexOffset: 1000
    }).addTo(map);

    const priceText = listing.price ? `₹${Number(listing.price).toLocaleString("en-IN")} / night` : "";
    const thumbImg = listing.imageUrl || "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80";

    propertyMarker.bindPopup(`
      <div class="location-popup-property">
        <img src="${thumbImg}" alt="${listing.title}" class="prop-thumb-img" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80';">
        <div class="prop-body">
          <span class="prop-badge"><i class="fa-solid fa-leaf me-1"></i> Roamly Sanctuary</span>
          <h4 class="prop-name">${listing.title}</h4>
          <p class="prop-city"><i class="fa-solid fa-location-dot me-1"></i> ${listing.location || "India"}, ${stayState} &bull; <strong>${priceText}</strong></p>
        </div>
      </div>
    `, { maxWidth: 260 });

    // Open property popup by default on load
    setTimeout(() => propertyMarker.openPopup(), 600);

    // 2. Fetch & Render Nearby Attractions
    const attractions = getNearbyAttractions(listing.location, stayLat, stayLng);
    const bounds = L.latLngBounds([ [stayLat, stayLng] ]);
    const attractionMarkers = [];

    attractions.forEach((attr, idx) => {
      bounds.extend([attr.lat, attr.lng]);

      const attrIcon = L.divIcon({
        className: 'custom-attraction-pin-div',
        html: `
          <div class="attraction-marker-wrap" id="marker-attr-${idx}">
            <div class="attraction-pin-circle">
              ${attr.icon}
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
      });

      const attrMarker = L.marker([attr.lat, attr.lng], { icon: attrIcon }).addTo(map);

      attrMarker.bindPopup(`
        <div class="location-popup-attraction">
          <div class="attr-header">
            <span class="attr-icon">${attr.icon}</span>
            <h4 class="attr-title">${attr.name}</h4>
          </div>
          <div class="attr-category">${attr.category}</div>
          <div class="attr-distance">
            <i class="fa-solid fa-person-walking"></i> ${attr.distanceText}
          </div>
        </div>
      `, { maxWidth: 240 });

      attrMarker.on("click", () => {
        highlightAttractionCard(idx);
      });

      attractionMarkers.push(attrMarker);
    });

    // Auto-fit map bounds so property AND nearby attractions are in view
    if (attractions.length > 0) {
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 14
      });
    }

    // Recenter map action button
    const recenterBtn = document.getElementById("mapRecenterBtn");
    if (recenterBtn) {
      recenterBtn.addEventListener("click", () => {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        propertyMarker.openPopup();
      });
    }

    // 3. Render Nearby Attractions List in Side Panel
    const listContainer = document.getElementById(attractionsContainerId);
    if (listContainer) {
      if (attractions.length === 0) {
        listContainer.innerHTML = `<p class="text-muted small">No attractions recorded in immediate vicinity.</p>`;
      } else {
        listContainer.innerHTML = attractions.map((attr, idx) => `
          <div class="attraction-card-item" data-idx="${idx}" role="button" tabindex="0">
            <div class="attraction-left">
              <div class="attraction-icon-badge">
                ${attr.icon}
              </div>
              <div>
                <h5 class="attraction-name">${attr.name}</h5>
                <p class="attraction-category">${attr.category}</p>
              </div>
            </div>
            <div class="attraction-distance-badge">
              <i class="fa-solid fa-location-arrow"></i> ${attr.distanceText}
            </div>
          </div>
        `).join("");

        // Attach click listener: clicking an attraction card smoothly flies to it on the map & opens popup
        listContainer.querySelectorAll(".attraction-card-item").forEach(card => {
          card.addEventListener("click", () => {
            const idx = parseInt(card.dataset.idx, 10);
            selectAttraction(idx);
          });
        });
      }
    }

    function selectAttraction(idx) {
      const attr = attractions[idx];
      const marker = attractionMarkers[idx];
      if (!attr || !marker) return;

      // Smoothly fly map to attraction
      map.flyTo([attr.lat, attr.lng], 15, {
        duration: 1.2,
        easeLinearity: 0.25
      });

      setTimeout(() => {
        marker.openPopup();
      }, 600);

      highlightAttractionCard(idx);
    }

    function highlightAttractionCard(idx) {
      const cards = document.querySelectorAll(".attraction-card-item");
      cards.forEach((c, i) => {
        c.classList.toggle("active", i === idx);
      });
    }
  }

  return { init };
})();
