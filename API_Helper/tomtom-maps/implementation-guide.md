# TomTom Maps API Implementation Guide

TomTom provides a suite of APIs and SDKs for integrating location-based services, including interactive maps, geocoding, routing, and traffic information. This guide focuses on using the TomTom Maps SDK for Web (JavaScript) and relevant APIs for an event discovery platform like NEWEVENTS.

**Important Note:** TomTom Maps SDK for Web version 5.x is deprecated and will be sunset. **This guide focuses on version 6.x.** [Source: TomTom Docs][5]

---

## 1. Authentication

TomTom APIs use an **API Key** for authentication.

**Steps to get an API Key:**
1.  Register for a developer account on the [TomTom Developer Portal](https://developer.tomtom.com/) [1][2].
2.  Create an application in your dashboard.
3.  Your API Key will be generated and associated with this application.
4.  You can configure restrictions for your API key (e.g., allowed domains, services).

**Using the API Key:**
The API key is typically passed as a parameter in SDK initialization or as a query parameter (`key=YOUR_API_KEY`) in direct API calls.

\`\`\`javascript
// For Maps SDK for Web
const map = tt.map({
  key: 'YOUR_TOMTOM_API_KEY', // Replace with your key
  container: 'map-element-id',
  // ... other map options
});
\`\`\`

---

## 2. Key SDKs & APIs for Event Discovery

### TomTom Maps SDK for Web (v6.x)
This is the primary JavaScript library for embedding interactive maps into web applications.
-   **Features:** Vector map rendering, customizable map styles, markers, popups, event handling. [Source: TomTom Docs][2][3][5]
-   **Installation:**
    \`\`\`html
    <!-- CSS for the SDK -->
    <link rel='stylesheet' type='text/css' href='https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps.css'/>
    <!-- SDK JavaScript -->
    <script src='https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps-web.min.js'></script>
    \`\`\`
    (Always check the [TomTom CDN page](https://developer.tomtom.com/maps-sdk-web/cdn-details) for the latest version number.)

### Search API (includes Geocoding & Reverse Geocoding)
Part of TomTom's Places API suite.
-   **Geocoding (Address to Coordinates):** `GET /search/2/geocode/{query}.json`
-   **Reverse Geocoding (Coordinates to Address):** `GET /search/2/reverseGeocode/{position}.json`
    -   `{position}` is `latitude,longitude`.
-   **Fuzzy Search (Points of Interest, Addresses):** `GET /search/2/search/{query}.json`
[Source: TomTom Search API Docs][2]

### Other Potentially Relevant APIs:
-   **Routing API:** For calculating routes to events. [Source: TomTom Docs][2][4]
-   **Traffic API:** For displaying real-time traffic conditions. [Source: TomTom Docs][2][4]

---

## 3. Key Functionalities for NEWEVENTS

### Displaying Maps
Initialize and display an interactive map.
\`\`\`javascript
// HTML: <div id='eventMap' style='width: 100%; height: 500px;'></div>

const map = tt.map({
  key: 'YOUR_TOMTOM_API_KEY',
  container: 'eventMap',
  center: [-0.127758, 51.507351], // Initial center: London [lng, lat]
  zoom: 10,
  style: 'tomtom://vector/1/basic-main' // Default TomTom style
});

// Add map controls
map.addControl(new tt.NavigationControl(), 'top-left');
map.addControl(new tt.FullscreenControl(), 'top-left');
\`\`\`

### Adding Event Markers & Popups
Display event locations on the map.
\`\`\`javascript
// Example: Adding a single event marker
const eventLocation = [-0.118092, 51.509865]; // [lng, lat] for an event
const eventMarker = new tt.Marker()
  .setLngLat(eventLocation)
  .addTo(map);

// Add a popup to the marker
const popup = new tt.Popup({ offset: [0, -30] }) // Offset the popup slightly above the marker
  .setHTML("<h3>Awesome Event Title</h3><p>Event details here. Starts at 7 PM!</p>");
eventMarker.setPopup(popup);

// To open popup programmatically: eventMarker.togglePopup();
// To have popup open on marker click (default behavior if popup is set)
\`\`\`

### Geocoding Addresses
Convert event venue addresses to latitude/longitude.
\`\`\`javascript
async function geocodeAddress(address) {
  const apiKey = 'YOUR_TOMTOM_API_KEY';
  const url = `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(address)}.json?key=${apiKey}&limit=1`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Geocoding error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const { lat, lon } = data.results[0].position;
      return { latitude: lat, longitude: lon };
    } else {
      return null; // Address not found or no results
    }
  } catch (error) {
    console.error('Failed to geocode address:', error);
    return null;
  }
}

// Usage:
// geocodeAddress("1600 Amphitheatre Parkway, Mountain View, CA").then(coords => {
//   if (coords) console.log(coords);
// });
\`\`\`

### Reverse Geocoding Coordinates
Convert latitude/longitude to a human-readable address.
\`\`\`javascript
async function reverseGeocode(latitude, longitude) {
  const apiKey = 'YOUR_TOMTOM_API_KEY';
  const url = `https://api.tomtom.com/search/2/reverseGeocode/${latitude},${longitude}.json?key=${apiKey}&radius=100`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Reverse geocoding error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    if (data.addresses && data.addresses.length > 0) {
      return data.addresses[0].address.freeformAddress;
    } else {
      return null; // No address found
    }
  } catch (error) {
    console.error('Failed to reverse geocode:', error);
    return null;
  }
}

// Usage:
// reverseGeocode(37.422, -122.084).then(address => {
//   if (address) console.log(address);
// });
\`\`\`

---

## 4. Data Models for Map Elements

-   **Map Initialization:** `tt.map` options object (key, container, center, zoom, style, etc.).
-   **Marker:** `tt.Marker` object.
    -   `setLngLat([lng, lat])`
    -   `setPopup(popupInstance)`
    -   `setElement(customHtmlElement)`
-   **Popup:** `tt.Popup` object.
    -   `setLngLat([lng, lat])` (if not attached to a marker)
    -   `setHTML(htmlString)` or `setText(textString)`
    -   `setDOMContent(htmlElement)`
-   **Geocoding API Response (`/geocode`):**
    \`\`\`json
    {
      "summary": { /* ... */ },
      "results": [
        {
          "type": "Point Address",
          "id": "...",
          "score": 7.8,
          "address": {
            "streetNumber": "1600",
            "streetName": "Amphitheatre Parkway",
            // ... other address components (municipality, country, postalCode, etc.)
            "freeformAddress": "1600 Amphitheatre Parkway, Mountain View, CA 94043"
          },
          "position": { "lat": 37.42199, "lon": -122.08402 }
        }
      ]
    }
    \`\`\`
-   **Reverse Geocoding API Response (`/reverseGeocode`):**
    \`\`\`json
    {
      "summary": { /* ... */ },
      "addresses": [
        {
          "address": {
            "buildingNumber": "1600",
            "street": "Amphitheatre Parkway",
            // ... other address components
            "freeformAddress": "1600 Amphitheatre Parkway, Mountain View, CA 94043",
            "countryCode": "US"
          },
          "position": "37.42199,-122.08402"
        }
      ]
    }
    \`\`\`

---

## 5. Error Handling

-   **SDK Errors:** The Maps SDK for Web can emit errors on the map instance.
    \`\`\`javascript
    map.on('error', (errorEvent) => {
      console.error('TomTom Map Error:', errorEvent.error);
      // e.g., { message: "Unauthorized", status: 401 } for invalid API key
    });
    \`\`\`
-   **API Request Errors (Direct HTTP calls, e.g., to Search API):**
    -   Check HTTP status codes. Common codes:
        -   `200 OK`: Success.
        -   `400 Bad Request`: Invalid parameters (e.g., malformed query, missing required parameter). Response body often contains details.
        -   `401 Unauthorized`: Invalid or missing API key.
        -   `403 Forbidden`: API key is valid but doesn't have permission for the requested service or has exceeded quotas for a specific feature.
        -   `404 Not Found`: Resource or endpoint not found.
        -   `429 Too Many Requests`: Rate limit exceeded.
        -   `5xx Server Error`: Issues on TomTom's side.
    -   The response body for errors is typically JSON with a `detailedError` or `error` object.
    \`\`\`json
    // Example 400 error response
    {
      "detailedError": {
        "code": "BadRequest",
        "message": "Parameter 'query' is missing"
      }
    }
    \`\`\`

---

## 6. Rate Limiting / Transaction Limits

-   TomTom operates on a transaction-based model. Different API calls and map loads consume different numbers of transactions.
-   Your account plan (e.g., free tier, paid plans) comes with a certain number of free transactions per day/month.
-   **Default free tier limit:** Typically 2,500 free transactions per day.
-   **Standard API rate limit:** Often around 5 requests per second per API key for many services, but this can vary.
-   If you exceed limits, you'll receive a `403 Forbidden` (for exceeding daily/monthly transaction quota) or `429 Too Many Requests` (for exceeding per-second rate limits).
-   **Strategies:**
    -   Monitor your transaction usage in the TomTom Developer Portal dashboard.
    -   Cache geocoding results (especially for static addresses), respecting TomTom's terms of service on caching.
    -   Optimize map loads (e.g., load maps only when visible).
    -   Implement exponential backoff for `429` errors.
    -   Consider upgrading your plan if you anticipate higher usage.
[Source: TomTom Pricing, FAQ, Rate Limit Docs][2]

---

## 7. Best Practices

1.  **Use Latest SDK Version**: Always use the latest stable version of the Maps SDK for Web (v6.x) for new features, performance improvements, and security updates [5].
2.  **Secure API Key**: While the API key is used client-side for the Maps SDK, restrict its usage in the TomTom Developer Portal (e.g., to specific domains) to prevent unauthorized use. For server-to-server API calls, store the key securely.
3.  **Vector Maps for Performance**: TomTom's vector maps generally offer better performance and customization than raster tiles [3].
4.  **Map Customization**: Use TomTom Map Maker or the SDK's styling options to customize map appearance to match your application's branding [2].
5.  **Efficient Marker Management**: For many event markers:
    *   Consider marker clustering. The TomTom SDK might offer utilities, or use third-party libraries.
    *   Load markers dynamically based on the map viewport.
6.  **Asynchronous Operations**: Handle all API calls (geocoding, etc.) and map loading asynchronously using Promises or `async/await`.
7.  **User Experience**: Provide loading indicators for maps and data. Handle cases where geocoding fails gracefully.

---

## 8. Common Pitfalls

-   **Using Deprecated SDK Versions**: Sticking with SDK v5.x will lead to issues when it's sunsetted [5].
-   **Hardcoding API Keys**: While necessary for client-side SDK initialization, ensure it's not exposed in public repositories if other more sensitive keys are in the same config. Use domain restriction.
-   **Ignoring Asynchronous Nature**: Not waiting for map load events (`map.on('load', ...)`) before trying to add markers or layers.
-   **Exceeding Transaction Limits**: Not monitoring usage on the free tier can lead to service interruption.
-   **Inefficient Geocoding**: Geocoding a large batch of addresses synchronously on the client-side can block the UI and hit rate limits quickly. Consider server-side batch geocoding or on-demand client-side geocoding.
-   **Not Handling Geocoding Failures**: Addresses may not be found, or the service might be temporarily unavailable.

---

## 9. Official Resources

-   **TomTom Developer Portal**: [https://developer.tomtom.com/](https://developer.tomtom.com/) [1]
-   **Maps SDK for Web Documentation (v6.x)**: [https://developer.tomtom.com/maps-sdk-web-js/documentation](https://developer.tomtom.com/maps-sdk-web-js/documentation) [5]
-   **Search API Documentation**: [https://developer.tomtom.com/search-api/documentation/search-service/search](https://developer.tomtom.com/search-api/documentation/search-service/search) (and related geocoding endpoints) [2]
-   **TomTom API Explorer**: [https://developer.tomtom.com/maps-api-explorer](https://developer.tomtom.com/maps-api-explorer)
-   **Examples & Tutorials**: Available on the Developer Portal.
-   **Map Maker**: [https://developer.tomtom.com/map-maker/documentation](https://developer.tomtom.com/map-maker/documentation) [2]
-   **Traffic API**: [https://developer.tomtom.com/traffic-api/documentation](https://developer.tomtom.com/traffic-api/documentation) [4]

By integrating TomTom's mapping and search capabilities, NEWEVENTS can provide a rich, interactive map-based event discovery experience.
