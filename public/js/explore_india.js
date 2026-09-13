/**
 * ROAMLY — EXPLORE INDIA INTERACTIVE MAP CONTROLLER
 * Leaflet.js + MarkerCluster integration with dynamic MongoDB synchronization.
 * Signature Travel-Discovery Experience with Roamly Brand Palette & Custom Controls.
 */

(function () {
  'use strict';

  // 1. Comprehensive Geographic Dictionary of Indian Cities & Regions
  const CITY_COORDINATES = {
    // Rajasthan
    "Jaipur": { lat: 26.9124, lng: 75.7873, state: "Rajasthan" },
    "Udaipur": { lat: 24.5854, lng: 73.7125, state: "Rajasthan" },
    "Jodhpur": { lat: 26.2389, lng: 73.0243, state: "Rajasthan" },
    "Jaisalmer": { lat: 26.9157, lng: 70.9083, state: "Rajasthan" },
    "Pushkar": { lat: 26.4899, lng: 74.5511, state: "Rajasthan" },
    "Bikaner": { lat: 28.0229, lng: 73.3119, state: "Rajasthan" },

    // Goa
    "Goa": { lat: 15.2993, lng: 74.1240, state: "Goa" },
    "Panjim": { lat: 15.4909, lng: 73.8278, state: "Goa" },

    // Maharashtra
    "Mumbai": { lat: 18.9220, lng: 72.8347, state: "Maharashtra" },
    "Pune": { lat: 18.5204, lng: 73.8567, state: "Maharashtra" },
    "Lonavala": { lat: 18.7557, lng: 73.4091, state: "Maharashtra" },
    "Mahabaleshwar": { lat: 17.9307, lng: 73.6477, state: "Maharashtra" },
    "Nashik": { lat: 19.9975, lng: 73.7898, state: "Maharashtra" },
    "Alibaug": { lat: 18.6414, lng: 72.8722, state: "Maharashtra" },

    // Delhi NCR & Haryana
    "Delhi": { lat: 28.6139, lng: 77.2090, state: "Delhi NCR" },
    "Gurgaon": { lat: 28.4595, lng: 77.0266, state: "Haryana" },

    // Karnataka & Telangana
    "Bengaluru": { lat: 12.9716, lng: 77.5946, state: "Karnataka" },
    "Bangalore": { lat: 12.9716, lng: 77.5946, state: "Karnataka" },
    "Mysore": { lat: 12.2958, lng: 76.6394, state: "Karnataka" },
    "Coorg": { lat: 12.3375, lng: 75.8069, state: "Karnataka" },
    "Hampi": { lat: 15.3350, lng: 76.4600, state: "Karnataka" },
    "Hyderabad": { lat: 17.3850, lng: 78.4867, state: "Telangana" },

    // Tamil Nadu & Pondicherry
    "Chennai": { lat: 13.0827, lng: 80.2707, state: "Tamil Nadu" },
    "Ooty": { lat: 11.4102, lng: 76.6950, state: "Tamil Nadu" },
    "Pondicherry": { lat: 11.9416, lng: 79.8083, state: "Puducherry" },

    // Kerala
    "Kochi": { lat: 9.9312, lng: 76.2673, state: "Kerala" },
    "Alleppey": { lat: 9.4981, lng: 76.3388, state: "Kerala" },
    "Kumarakom": { lat: 9.6175, lng: 76.4301, state: "Kerala" },
    "Munnar": { lat: 10.0889, lng: 77.0595, state: "Kerala" },
    "Wayanad": { lat: 11.6854, lng: 76.1320, state: "Kerala" },
    "Kovalam": { lat: 8.4004, lng: 76.9787, state: "Kerala" },

    // Himachal Pradesh & Uttarakhand
    "Manali": { lat: 32.2432, lng: 77.1892, state: "Himachal Pradesh" },
    "Shimla": { lat: 31.1048, lng: 77.1734, state: "Himachal Pradesh" },
    "Kasol": { lat: 32.0100, lng: 77.3150, state: "Himachal Pradesh" },
    "Dharamshala": { lat: 32.2190, lng: 76.3234, state: "Himachal Pradesh" },
    "Mussoorie": { lat: 30.4598, lng: 78.0644, state: "Uttarakhand" },
    "Nainital": { lat: 29.3919, lng: 79.4542, state: "Uttarakhand" },
    "Rishikesh": { lat: 30.0869, lng: 78.2676, state: "Uttarakhand" },

    // Uttar Pradesh & Punjab
    "Agra": { lat: 27.1767, lng: 78.0081, state: "Uttar Pradesh" },
    "Varanasi": { lat: 25.3176, lng: 82.9739, state: "Uttar Pradesh" },
    "Lucknow": { lat: 26.8467, lng: 80.9462, state: "Uttar Pradesh" },
    "Amritsar": { lat: 31.6340, lng: 74.8723, state: "Punjab" },
    "Chandigarh": { lat: 30.7333, lng: 76.7794, state: "Chandigarh" },

    // Eastern & North-Eastern India
    "Kolkata": { lat: 22.5726, lng: 88.3639, state: "West Bengal" },
    "Darjeeling": { lat: 27.0410, lng: 88.2663, state: "West Bengal" },
    "Gangtok": { lat: 27.3389, lng: 88.6065, state: "Sikkim" },
    "Shillong": { lat: 25.5788, lng: 91.8933, state: "Meghalaya" },
    "Puri": { lat: 19.8135, lng: 85.8312, state: "Odisha" },

    // Central & Western India
    "Indore": { lat: 22.7196, lng: 75.8577, state: "Madhya Pradesh" },
    "Ahmedabad": { lat: 23.0225, lng: 72.5714, state: "Gujarat" },

    // Northern & Island Frontiers
    "Srinagar": { lat: 34.0837, lng: 74.7973, state: "Jammu & Kashmir" },
    "Havelock Island": { lat: 11.9840, lng: 92.9876, state: "Andaman Islands" }
  };

  // Helper to resolve coordinates with tiny deterministic offset for co-located stays
  function resolveCoordinates(city, listingId) {
    if (!city) return null;
    const cleanCity = city.trim();
    const info = CITY_COORDINATES[cleanCity] || CITY_COORDINATES[Object.keys(CITY_COORDINATES).find(k => k.toLowerCase() === cleanCity.toLowerCase())];
    
    if (!info) {
      // Fallback coordinate around central India
      return { lat: 22.0 + Math.random() * 2, lng: 78.0 + Math.random() * 2, state: "India" };
    }

    // Deterministic small micro-jitter so multiple listings in Jaipur/Goa/Udaipur don't stack on exact same pixel
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

  // 2. Classify listing category based on title & description
  function classifyListingType(listing) {
    const text = `${listing.title || ""} ${listing.description || ""}`.toLowerCase();
    if (text.includes("villa") || text.includes("bungalow") || text.includes("residence") || text.includes("penthouse") || text.includes("mansion")) {
      return "villas";
    }
    if (text.includes("resort") || text.includes("retreat") || text.includes("sanctuary") || text.includes("estate") || text.includes("camp") || text.includes("dune") || text.includes("beachfront")) {
      return "resorts";
    }
    if (text.includes("cottage") || text.includes("cabin") || text.includes("chalet") || text.includes("homestay") || text.includes("houseboat") || text.includes("loft") || text.includes("pol") || text.includes("hideaway")) {
      return "homestays";
    }
    return "hotels"; // Hotels, Palaces, Havelis, Boutique stays
  }

  // Icon mapping for marker pins based on category
  function getCategoryIcon(type) {
    switch (type) {
      case "villas": return "fa-solid fa-gem";
      case "resorts": return "fa-solid fa-spa";
      case "homestays": return "fa-solid fa-house-chimney-window";
      case "hotels": default: return "fa-solid fa-hotel";
    }
  }

  // Category human labels
  function getCategoryLabel(type) {
    switch (type) {
      case "villas": return "Villa";
      case "resorts": return "Resort";
      case "homestays": return "Homestay";
      case "hotels": default: return "Hotel & Haveli";
    }
  }

  // Main Map Application Initializer
  document.addEventListener("DOMContentLoaded", () => {
    const rawDataScript = document.getElementById("raw-listings-data");
    if (!rawDataScript) return;

    let listings = [];
    try {
      listings = JSON.parse(rawDataScript.textContent);
    } catch (e) {
      console.error("Failed to parse listings data:", e);
      return;
    }

    // Enrich listings with coordinates, states, and category
    const enrichedListings = listings.map(item => {
      const coords = resolveCoordinates(item.location, item._id);
      const cat = classifyListingType(item);
      const rating = (item.reviews && item.reviews.length > 0) ? (4.85 + ((item.reviews.length % 5) * 0.03)).toFixed(2) : "4.92";
      return {
        ...item,
        lat: coords ? coords.lat : 20.5937,
        lng: coords ? coords.lng : 78.9629,
        state: coords ? coords.state : "India",
        category: cat,
        displayRating: rating,
        resolvedImg: item.imageUrl || (item.image && item.image.url) || (typeof item.images === 'string' ? item.images : "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80")
      };
    });

    // 3. Initialize Leaflet Map (Centered on India)
    const INDIA_CENTER = [22.8, 82.0];
    const INDIA_DEFAULT_ZOOM = 5;

    const map = L.map('indiaMap', {
      center: INDIA_CENTER,
      zoom: INDIA_DEFAULT_ZOOM,
      minZoom: 4,
      maxZoom: 18,
      zoomControl: false,
      scrollWheelZoom: true
    });

    // Warm, editorial light travel tiles (CartoDB Voyager)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    // Map canvas resize sync
    const mapContainer = document.getElementById("mapCanvasContainer");
    setTimeout(() => {
      if (mapContainer) mapContainer.classList.add("loaded");
      map.invalidateSize();
    }, 200);

    window.addEventListener("resize", () => {
      map.invalidateSize();
    });

    // Custom Roamly Zoom Controls Integration
    const zoomInBtn = document.getElementById("mapZoomInBtn");
    const zoomOutBtn = document.getElementById("mapZoomOutBtn");
    if (zoomInBtn) zoomInBtn.addEventListener("click", () => map.zoomIn());
    if (zoomOutBtn) zoomOutBtn.addEventListener("click", () => map.zoomOut());

    // 4. Cluster Group Setup
    let markerClusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 45,
      spiderfyOnMaxZoom: true,
      zoomToBoundsOnClick: true,
      iconCreateFunction: function (cluster) {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `
            <div class="roamly-cluster-marker">
              <span class="cluster-pulse-ring"></span>
              <span class="cluster-count-num">${count}</span>
              <span class="cluster-count-lbl">stays</span>
            </div>
          `,
          className: 'custom-cluster-wrapper',
          iconSize: [48, 48],
          iconAnchor: [24, 24]
        });
      }
    });

    map.addLayer(markerClusterGroup);

    // 5. State Management
    let currentFilter = "all";
    let activeCityFilter = null;
    let markersMap = new Map(); // id -> L.marker

    // 6. Marker & Popup Generator
    function createListingPopupHtml(item) {
      const priceFormatted = item.price ? Number(item.price).toLocaleString("en-IN") : "3,500";
      return `
        <div class="map-popup-card">
          <div class="popup-media-wrap">
            <img src="${item.resolvedImg}" alt="${item.title}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80';">
            <div class="popup-category-badge">${getCategoryLabel(item.category)}</div>
            <div class="popup-rating-badge">
              <i class="fa-solid fa-star"></i>
              <span>${item.displayRating}</span>
            </div>
          </div>
          <div class="popup-body">
            <div class="popup-location-row">
              <i class="fa-solid fa-location-dot"></i>
              <span>${item.location || 'India'}, ${item.state}</span>
            </div>
            <h3 class="popup-title">${item.title}</h3>
            <div class="popup-footer-row">
              <div class="popup-price">
                ₹${priceFormatted} <span>/ night</span>
              </div>
              <a href="/listings/${item._id}" class="popup-view-btn">
                <span>View Sanctuary</span>
                <i class="fa-solid fa-arrow-right"></i>
              </a>
            </div>
          </div>
        </div>
      `;
    }

    function createMarker(item) {
      const iconClass = getCategoryIcon(item.category);
      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="roamly-marker-pin" data-id="${item._id}" title="${item.title} • ${item.location}">
            <div class="pin-pulse-ring"></div>
            <div class="pin-bubble">
              <i class="${iconClass} pin-icon-inner"></i>
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -38]
      });

      const marker = L.marker([item.lat, item.lng], { icon: customIcon });
      marker.bindPopup(createListingPopupHtml(item), {
        maxWidth: 310,
        className: 'roamly-editorial-popup'
      });

      marker.on("click", () => {
        highlightSidePanelCard(item._id);
      });

      return marker;
    }

    // 7. Render Markers according to active filter and active city
    function renderMarkers() {
      markerClusterGroup.clearLayers();
      markersMap.clear();

      const filtered = enrichedListings.filter(item => {
        const matchesCategory = (currentFilter === "all" || item.category === currentFilter);
        const matchesCity = (!activeCityFilter || item.location.toLowerCase() === activeCityFilter.toLowerCase());
        return matchesCategory && matchesCity;
      });

      filtered.forEach(item => {
        const marker = createMarker(item);
        markerClusterGroup.addLayer(marker);
        markersMap.set(String(item._id), marker);
      });

      // Update UI counts
      updateCounts(filtered.length);
      renderSidePanel(filtered);
    }

    // 8. Side Panel Rendering (Cities vs Stays)
    const citiesListContainer = document.getElementById("citiesListContainer");
    const staysListContainer = document.getElementById("staysListContainer");
    const panelTotalCount = document.getElementById("panelTotalCount");
    const topBarTotalCount = document.getElementById("topBarTotalCount");
    const activeContextFilter = document.getElementById("activeContextFilter");
    const contextCityName = document.getElementById("contextCityName");

    function updateCounts(count) {
      if (panelTotalCount) panelTotalCount.textContent = `${count} ${count === 1 ? 'stay' : 'stays'}`;
      if (topBarTotalCount) topBarTotalCount.textContent = `${count}`;
    }

    function renderSidePanel(currentListings) {
      // 1. Group by City
      const cityMap = new Map();
      enrichedListings.forEach(item => {
        if (currentFilter !== "all" && item.category !== currentFilter) return;
        const key = item.location;
        if (!cityMap.has(key)) {
          cityMap.set(key, { name: key, state: item.state, count: 0, lat: item.lat, lng: item.lng });
        }
        cityMap.get(key).count++;
      });

      const sortedCities = Array.from(cityMap.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

      // Render Cities List
      if (citiesListContainer) {
        if (sortedCities.length === 0) {
          citiesListContainer.innerHTML = `
            <div class="panel-empty-state">
              <i class="fa-regular fa-compass"></i>
              <h4>No destinations found</h4>
              <p>Try switching filters or clearing your search.</p>
            </div>
          `;
        } else {
          citiesListContainer.innerHTML = sortedCities.map(city => `
            <div class="city-row-card ${activeCityFilter && activeCityFilter.toLowerCase() === city.name.toLowerCase() ? 'active' : ''}" 
                 data-city="${city.name}" data-lat="${city.lat}" data-lng="${city.lng}">
              <div class="city-info-left">
                <div class="city-pin-icon">
                  <i class="fa-solid fa-location-dot"></i>
                </div>
                <div>
                  <div class="city-name-txt">${city.name}</div>
                  <div class="city-state-txt">${city.state}</div>
                </div>
              </div>
              <div class="city-stays-count">
                ${city.count} ${city.count === 1 ? 'stay' : 'stays'}
              </div>
            </div>
          `).join("");

          citiesListContainer.querySelectorAll(".city-row-card").forEach(el => {
            el.addEventListener("click", () => {
              const cityName = el.dataset.city;
              zoomToCity(cityName);
            });
          });
        }
      }

      // Render Stays List
      if (staysListContainer) {
        if (currentListings.length === 0) {
          staysListContainer.innerHTML = `
            <div class="panel-empty-state">
              <i class="fa-solid fa-bed"></i>
              <h4>No stays match criteria</h4>
              <p>Try selecting a different filter or exploring another destination.</p>
            </div>
          `;
        } else {
          staysListContainer.innerHTML = currentListings.map(item => {
            const priceFormatted = item.price ? Number(item.price).toLocaleString("en-IN") : "3,500";
            return `
              <div class="panel-stay-card" data-id="${item._id}" data-lat="${item.lat}" data-lng="${item.lng}">
                <div class="stay-thumb-frame">
                  <img src="${item.resolvedImg}" alt="${item.title}" loading="lazy" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80';">
                </div>
                <div class="stay-meta-body">
                  <div class="stay-top-info">
                    <div class="stay-city-tag">
                      <i class="fa-solid fa-location-dot me-1"></i>${item.location}, ${item.state}
                    </div>
                    <h4 class="stay-card-title">${item.title}</h4>
                  </div>
                  <div class="stay-bottom-info">
                    <div class="stay-card-price">
                      ₹${priceFormatted} <span>/ night</span>
                    </div>
                    <div class="stay-card-rating">
                      <i class="fa-solid fa-star"></i>
                      <span>${item.displayRating}</span>
                    </div>
                  </div>
                </div>
              </div>
            `;
          }).join("");

          staysListContainer.querySelectorAll(".panel-stay-card").forEach(el => {
            el.addEventListener("click", () => {
              const id = el.dataset.id;
              const lat = parseFloat(el.dataset.lat);
              const lng = parseFloat(el.dataset.lng);
              focusStayOnMap(id, lat, lng);
            });
          });
        }
      }
    }

    // 9. Zoom & Navigate to a City
    function zoomToCity(cityName) {
      if (!cityName) return;
      const cleanCity = cityName.trim();
      const info = CITY_COORDINATES[cleanCity] || CITY_COORDINATES[Object.keys(CITY_COORDINATES).find(k => k.toLowerCase() === cleanCity.toLowerCase())];
      
      activeCityFilter = cleanCity;
      if (activeContextFilter && contextCityName) {
        contextCityName.textContent = cleanCity;
        activeContextFilter.classList.add("active");
      }

      // Re-render markers for that city
      renderMarkers();

      // Switch tab to 'Stays' view automatically to show stays in that city
      switchPanelTab("stays");

      // Smooth camera flight
      const targetZoom = 12;
      if (info) {
        map.flyTo([info.lat, info.lng], targetZoom, {
          duration: 1.6,
          easeLinearity: 0.25
        });
      } else {
        const matches = enrichedListings.filter(l => l.location.toLowerCase() === cleanCity.toLowerCase());
        if (matches.length > 0) {
          map.flyTo([matches[0].lat, matches[0].lng], targetZoom, { duration: 1.6 });
        }
      }

      // On mobile, keep drawer accessible
      const mobilePanel = document.getElementById("exploreSidePanel");
      if (window.innerWidth <= 768 && mobilePanel) {
        mobilePanel.classList.add("open");
      }
    }

    // Focus single stay on map
    function focusStayOnMap(id, lat, lng) {
      map.flyTo([lat, lng], 14, { duration: 1.2 });
      setTimeout(() => {
        const marker = markersMap.get(String(id));
        if (marker) {
          markerClusterGroup.zoomToShowLayer(marker, () => {
            marker.openPopup();
          });
        }
      }, 700);
    }

    function highlightSidePanelCard(id) {
      const card = document.querySelector(`.panel-stay-card[data-id="${id}"]`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        card.style.borderColor = 'var(--roamly-forest)';
        setTimeout(() => { card.style.borderColor = ''; }, 2000);
      }
    }

    // 10. Filter Chips Controller
    const travelChips = document.querySelectorAll(".travel-chip");
    travelChips.forEach(chip => {
      chip.addEventListener("click", () => {
        travelChips.forEach(c => {
          c.classList.remove("active");
          c.setAttribute("aria-selected", "false");
        });
        chip.classList.add("active");
        chip.setAttribute("aria-selected", "true");
        currentFilter = chip.dataset.filter || "all";
        renderMarkers();
      });
    });

    // 11. Panel Tab Switcher (Cities vs Stays)
    const tabBtnCities = document.getElementById("tabBtnCities");
    const tabBtnStays = document.getElementById("tabBtnStays");
    const citiesViewTab = document.getElementById("citiesViewTab");
    const staysViewTab = document.getElementById("staysViewTab");

    function switchPanelTab(tabName) {
      if (tabName === "cities") {
        if (tabBtnCities) {
          tabBtnCities.classList.add("active");
          tabBtnCities.setAttribute("aria-selected", "true");
        }
        if (tabBtnStays) {
          tabBtnStays.classList.remove("active");
          tabBtnStays.setAttribute("aria-selected", "false");
        }
        if (citiesViewTab) citiesViewTab.classList.remove("d-none");
        if (staysViewTab) staysViewTab.classList.add("d-none");
      } else {
        if (tabBtnStays) {
          tabBtnStays.classList.add("active");
          tabBtnStays.setAttribute("aria-selected", "true");
        }
        if (tabBtnCities) {
          tabBtnCities.classList.remove("active");
          tabBtnCities.setAttribute("aria-selected", "false");
        }
        if (staysViewTab) staysViewTab.classList.remove("d-none");
        if (citiesViewTab) citiesViewTab.classList.add("d-none");
      }
    }

    if (tabBtnCities) tabBtnCities.addEventListener("click", () => switchPanelTab("cities"));
    if (tabBtnStays) tabBtnStays.addEventListener("click", () => switchPanelTab("stays"));

    // Clear city context filter button
    const clearCityFilterBtn = document.getElementById("clearCityFilterBtn");
    if (clearCityFilterBtn) {
      clearCityFilterBtn.addEventListener("click", () => {
        activeCityFilter = null;
        if (activeContextFilter) activeContextFilter.classList.remove("active");
        renderMarkers();
        switchPanelTab("cities");
        map.flyTo(INDIA_CENTER, INDIA_DEFAULT_ZOOM, { duration: 1.4 });
      });
    }

    // 12. "✨ Surprise Me" Discovery Controller
    const surpriseMeBtn = document.getElementById("surpriseMeBtn");
    if (surpriseMeBtn) {
      surpriseMeBtn.addEventListener("click", () => {
        if (enrichedListings.length === 0) return;
        // Pick a random listing
        const randomIndex = Math.floor(Math.random() * enrichedListings.length);
        const picked = enrichedListings[randomIndex];
        if (picked) {
          // Switch to stays tab to show this sanctuary
          switchPanelTab("stays");
          focusStayOnMap(picked._id, picked.lat, picked.lng);
          highlightSidePanelCard(picked._id);
        }
      });
    }

    // 13. Recenter All India Button
    const mapRecenterBtn = document.getElementById("mapRecenterBtn");
    if (mapRecenterBtn) {
      mapRecenterBtn.addEventListener("click", () => {
        activeCityFilter = null;
        currentFilter = "all";
        travelChips.forEach(c => {
          c.classList.toggle("active", c.dataset.filter === "all");
          c.setAttribute("aria-selected", c.dataset.filter === "all" ? "true" : "false");
        });
        if (activeContextFilter) activeContextFilter.classList.remove("active");
        const searchInput = document.getElementById("mapSearchInput");
        if (searchInput) searchInput.value = "";
        renderMarkers();
        switchPanelTab("cities");
        map.flyTo(INDIA_CENTER, INDIA_DEFAULT_ZOOM, { duration: 1.5 });
      });
    }

    // 14. Search Autocomplete & Live Navigation
    const searchInput = document.getElementById("mapSearchInput");
    const clearSearchBtn = document.getElementById("clearSearchBtn");
    const searchDropdown = document.getElementById("searchDropdown");

    const uniqueCities = Array.from(new Set(enrichedListings.map(l => l.location))).map(cityName => {
      const coords = CITY_COORDINATES[cityName] || { state: "India" };
      const count = enrichedListings.filter(l => l.location === cityName).length;
      return { city: cityName, state: coords.state, count };
    }).sort((a, b) => a.city.localeCompare(b.city));

    function handleSearchInput() {
      const query = (searchInput.value || "").trim().toLowerCase();
      if (clearSearchBtn) {
        clearSearchBtn.classList.toggle("d-none", query.length === 0);
      }

      if (query.length === 0) {
        if (searchDropdown) searchDropdown.classList.remove("active");
        return;
      }

      const matches = uniqueCities.filter(c => 
        c.city.toLowerCase().includes(query) || c.state.toLowerCase().includes(query)
      );

      if (matches.length > 0 && searchDropdown) {
        searchDropdown.innerHTML = matches.slice(0, 7).map(c => `
          <div class="suggestion-item" data-city="${c.city}">
            <div class="suggestion-left">
              <i class="fa-solid fa-location-dot text-forest"></i>
              <div>
                <span class="suggestion-city">${c.city}</span>
                <span class="suggestion-state">• ${c.state}</span>
              </div>
            </div>
            <span class="suggestion-count">${c.count} ${c.count === 1 ? 'stay' : 'stays'}</span>
          </div>
        `).join("");

        searchDropdown.classList.add("active");

        searchDropdown.querySelectorAll(".suggestion-item").forEach(item => {
          item.addEventListener("click", () => {
            const cityName = item.dataset.city;
            searchInput.value = cityName;
            searchDropdown.classList.remove("active");
            zoomToCity(cityName);
          });
        });
      } else if (searchDropdown) {
        searchDropdown.innerHTML = `
          <div class="p-3 text-center text-muted small">
            No Indian destinations found matching "${query}"
          </div>
        `;
        searchDropdown.classList.add("active");
      }
    }

    if (searchInput) {
      searchInput.addEventListener("input", handleSearchInput);
      searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          const first = searchDropdown ? searchDropdown.querySelector(".suggestion-item") : null;
          if (first) {
            const city = first.dataset.city;
            searchInput.value = city;
            if (searchDropdown) searchDropdown.classList.remove("active");
            zoomToCity(city);
          } else if (searchInput.value.trim()) {
            zoomToCity(searchInput.value.trim());
            if (searchDropdown) searchDropdown.classList.remove("active");
          }
        }
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener("click", () => {
        searchInput.value = "";
        clearSearchBtn.classList.add("d-none");
        if (searchDropdown) searchDropdown.classList.remove("active");
        activeCityFilter = null;
        if (activeContextFilter) activeContextFilter.classList.remove("active");
        renderMarkers();
        map.flyTo(INDIA_CENTER, INDIA_DEFAULT_ZOOM, { duration: 1.4 });
      });
    }

    document.addEventListener("click", (e) => {
      if (searchDropdown && !e.target.closest(".explore-search-console")) {
        searchDropdown.classList.remove("active");
      }
    });

    // 15. Destination Cards Grid (Below Map) Click-to-Explore Handlers
    const destinationCards = document.querySelectorAll(".destination-card[data-city]");
    const mapStageSection = document.getElementById("mapStageSection");

    destinationCards.forEach(card => {
      card.addEventListener("click", () => {
        const cityName = card.dataset.city;
        if (cityName) {
          // Scroll smoothly to the map stage
          if (mapStageSection) {
            mapStageSection.scrollIntoView({ behavior: "smooth", block: "start" });
          }
          setTimeout(() => {
            zoomToCity(cityName);
          }, 300);
        }
      });
    });

    // "Interactive Map" scroll button
    const browseAllOnMapBtn = document.getElementById("browseAllOnMapBtn");
    if (browseAllOnMapBtn && mapStageSection) {
      browseAllOnMapBtn.addEventListener("click", () => {
        mapStageSection.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    // 16. Show More / Show Less Destinations Toggle
    const toggleDestBtn = document.getElementById("toggleDestinationsBtn");
    if (toggleDestBtn) {
      toggleDestBtn.addEventListener("click", () => {
        const isExpanded = toggleDestBtn.dataset.expanded === "true";
        const collapsedCards = document.querySelectorAll(".dest-card-collapsed");
        const btnTxt = toggleDestBtn.querySelector(".btn-show-more-txt");
        const btnIcon = toggleDestBtn.querySelector(".btn-show-more-icon");

        if (!isExpanded) {
          // Expand: show all
          collapsedCards.forEach(card => card.classList.remove("d-none"));
          toggleDestBtn.dataset.expanded = "true";
          if (btnTxt) btnTxt.textContent = "Show Less Destinations";
          if (btnIcon) {
            btnIcon.classList.remove("fa-chevron-down");
            btnIcon.classList.add("fa-chevron-up");
          }
        } else {
          // Collapse: hide back to 2 rows
          collapsedCards.forEach(card => card.classList.add("d-none"));
          toggleDestBtn.dataset.expanded = "false";
          if (btnTxt) btnTxt.textContent = `Show More Destinations (${collapsedCards.length} more)`;
          if (btnIcon) {
            btnIcon.classList.remove("fa-chevron-up");
            btnIcon.classList.add("fa-chevron-down");
          }
          const exploreDestSection = document.querySelector(".explore-destinations-section");
          if (exploreDestSection) {
            exploreDestSection.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      });
    }

    // 17. Mobile Drawer Toggle
    const mobileToggleBtn = document.getElementById("mobilePanelToggle");
    const sidePanel = document.getElementById("exploreSidePanel");
    if (mobileToggleBtn && sidePanel) {
      mobileToggleBtn.addEventListener("click", () => {
        sidePanel.classList.toggle("open");
        const isOpen = sidePanel.classList.contains("open");
        mobileToggleBtn.innerHTML = isOpen ? `<i class="fa-solid fa-map me-1"></i> View Map` : `<i class="fa-solid fa-list-ul me-1"></i> Explore Destinations`;
      });
    }

    // Initial render
    renderMarkers();
  });
})();
