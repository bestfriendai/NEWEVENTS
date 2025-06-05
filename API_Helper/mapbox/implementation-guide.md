# Mapbox API Implementation Guide

Mapbox provides a suite of powerful and flexible tools for integrating location services into applications. This guide focuses on using Mapbox for an event discovery platform, covering map display, event markers, geocoding, and best practices.

---

## 1. Authentication & Setup

All Mapbox APIs and SDKs require an **access token**.

**Steps to get an access token:**
1.  Sign up for a Mapbox account at [mapbox.com](https://www.mapbox.com/).
2.  Navigate to your Account dashboard.
3.  Your default public token will be available, or you can create new tokens with specific scopes (permissions).

**Setup for Mapbox GL JS (Web):**
Include the Mapbox GL JS library and CSS in your HTML:
```html
<script src='https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js'></script>
<link href='https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css' rel='stylesheet' />
```
Initialize the map in your JavaScript:
```javascript
mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN'; // Replace with your actual token
const map = new mapboxgl.Map({
  container: 'map', // ID of the div where the map will render
  style: 'mapbox://styles/mapbox/streets-v12', // Standard street map style
  center: [-74.5, 40], // Initial map center [longitude, latitude]
  zoom: 9 // Initial zoom level
});
```
[Source: Mapbox GL JS Docs][5]

---

## 2. Key Functionalities for Event Discovery

### Displaying Maps
The core functionality is rendering an interactive map. Mapbox GL JS provides extensive customization options for map styles, controls, and interactivity.

```javascript
// Basic map initialization (as shown in setup)
const map = new mapboxgl.Map({ /* ... configuration ... */ });

// Add navigation controls (zoom, rotation)
map.addControl(new mapboxgl.NavigationControl());

// Add fullscreen control
map.addControl(new mapboxgl.FullscreenControl());

// Add geolocate control (requires user permission)
map.addControl(new mapboxgl.GeolocateControl({
  positionOptions: {
    enableHighAccuracy: true
  },
  trackUserLocation: true,
  showUserHeading: true
}));
```

### Adding Event Markers
Display event locations using markers. Markers can be customized and can include popups with event information.

```javascript
// Example: Adding a single event marker
const eventMarker = new mapboxgl.Marker({ color: 'red' }) // Customize marker color, element, etc.
  .setLngLat([-73.985130, 40.758896]) // Event coordinates [longitude, latitude]
  .setPopup(new mapboxgl.Popup().setHTML("<h3>Times Square Event</h3><p>Details about the event.</p>")) // Popup content
  .addTo(map);

// For many events, consider clustering or data-driven styling (see Best Practices).
```
[Source: Mapbox GL JS Markers][5]

### Geocoding (Address to Coordinates)
Convert addresses (e.g., event venue addresses) into geographic coordinates (latitude, longitude) using the Mapbox Geocoding API.

```javascript
async function getCoordinates(address) {
  const accessToken = mapboxgl.accessToken;
  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${accessToken}&limit=1`
  );
  if (!response.ok) {
    const errorData = await response.json();
    console.error('Geocoding API Error:', errorData.message);
    throw new Error(`Geocoding failed: ${errorData.message}`);
  }
  const data = await response.json();
  if (data.features && data.features.length > 0) {
    return data.features[0].center; // [longitude, latitude]
  } else {
    throw new Error('Address not found.');
  }
}

// Usage:
try {
  const coords = await getCoordinates("1600 Amphitheatre Parkway, Mountain View, CA");
  console.log('Coordinates:', coords); // e.g., [-122.084, 37.422]
  // map.setCenter(coords);
  // new mapboxgl.Marker().setLngLat(coords).addTo(map);
} catch (error) {
  console.error(error.message);
}
```
[Source: Mapbox Geocoding API][3]

### Reverse Geocoding (Coordinates to Address)
Convert geographic coordinates into a human-readable address. Useful if you have coordinates and need to display an address.

```javascript
async function getAddress(longitude, latitude) {
  const accessToken = mapboxgl.accessToken;
  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${accessToken}&types=address&limit=1`
  );
  if (!response.ok) {
    const errorData = await response.json();
    console.error('Reverse Geocoding API Error:', errorData.message);
    throw new Error(`Reverse geocoding failed: ${errorData.message}`);
  }
  const data = await response.json();
  if (data.features && data.features.length > 0) {
    return data.features[0].place_name; // Full address string
  } else {
    throw new Error('Address not found for coordinates.');
  }
}

// Usage:
try {
  const address = await getAddress(-73.985130, 40.758896);
  console.log('Address:', address);
} catch (error) {
  console.error(error.message);
}
```
[Source: Mapbox Geocoding API][3]

---

## 3. Data Models for Markers and Popups

When working with Mapbox GL JS, markers and popups are typically created programmatically.

**Marker Data:**
- **Coordinates:** `LngLatLike` object or array `[longitude, latitude]`.
- **DOM Element (Optional):** Custom HTML element for the marker.
- **Options (Optional):** Object to specify color, draggable, rotation, etc.

**Popup Data:**
- **HTML Content:** String of HTML to display inside the popup.
- **Options (Optional):** Object to specify `closeButton`, `closeOnClick`, `maxWidth`, etc.

**GeoJSON for Data Layers:**
For displaying multiple events or complex shapes, GeoJSON is the standard format.
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-73.985130, 40.758896]
      },
      "properties": {
        "eventName": "Times Square Event",
        "description": "Details about the event.",
        "category": "Festival"
        // Add other relevant event properties
      }
    },
    // ... more event features
  ]
}
```
You can add a GeoJSON source to the map and style its features (points, lines, polygons) using layers.

---

## 4. Error Handling & Rate Limiting

### Error Handling
- **Mapbox GL JS Events:** The `map` object emits an `error` event for issues like invalid tokens, style loading failures, or tile errors.
  ```javascript
  map.on('error', (e) => {
    console.error('Mapbox GL JS Error:', e.error);
    // Example: Handle specific errors
    if (e.error && e.error.status === 401) {
      console.error('Mapbox Access Token is invalid or missing.');
    }
    if (e.error && e.error.status === 429) {
      console.warn('Mapbox rate limit hit. Consider optimizing or upgrading your plan.');
    }
  });
  ```
- **API Requests (Geocoding, etc.):** Check HTTP status codes.
    - `200 OK`: Success.
    - `400 Bad Request`: Invalid parameters.
    - `401 Unauthorized`: Invalid or missing access token.
    - `403 Forbidden`: Token doesn't have required scopes.
    - `404 Not Found`: Resource not found.
    - `422 Unprocessable Entity`: Input could not be geocoded.
    - `429 Too Many Requests`: Rate limit exceeded.
    - `5xx Server Error`: Errors on Mapbox's side.

### Rate Limiting
- Mapbox APIs have rate limits that vary by service and account plan. [See Official Rate Limits Docs][1].
- If you exceed limits, you'll receive a `429 Too Many Requests` response.
- The response may include a `Retry-After` header.
- **Strategies:**
    - Cache geocoding results (respecting Mapbox ToS on caching duration).
    - Implement exponential backoff for retries on `429` errors.
    - Optimize by fetching data only when needed (e.g., geocode on demand, not all at once).
    - For high-volume applications, consider upgrading your Mapbox plan.

---

## 5. Best Practices

1.  **Token Security**: Store access tokens securely. For client-side web apps, public tokens are used, but be mindful of their scopes. For server-side API calls, use secret tokens and protect them.
2.  **Performance with Many Markers**:
    *   **Clustering**: For a large number of event markers, use Mapbox's built-in GeoJSON clustering capabilities or libraries like `supercluster`.
      ```javascript
      // Example: Adding a clustered GeoJSON source
      map.addSource('events', {
        type: 'geojson',
        data: 'path/to/your/events.geojson', // or GeoJSON object
        cluster: true,
        clusterMaxZoom: 14, // Max zoom to cluster points on
        clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
      });
      // Then add layers to style clusters and individual points.
      ```
    *   **Data-Driven Styling**: Efficiently style many features.
    *   **Vector Tiles**: For very large datasets, consider creating and using vector tiles.
3.  **Efficient Data Loading**: Load event data dynamically based on the map's viewport (bounding box and zoom level) to avoid fetching and rendering unnecessary data.
4.  **Asynchronous Operations**: Geocoding and other API calls are asynchronous. Use `async/await` or Promises to handle them correctly.
5.  **User Experience**:
    *   Provide clear loading states for maps and data.
    *   Ensure popups are informative and well-formatted.
    *   Test on various devices and network conditions.
6.  **Coordinate Order**: Remember Mapbox generally uses `[longitude, latitude]` for coordinate arrays.
7.  **Style Optimization**: Use optimized map styles. Custom styles can impact performance if not designed carefully.

---

## 6. Common Pitfalls

-   **Exposing Secret Tokens**: Never embed secret access tokens in client-side code.
-   **Ignoring Asynchronous Nature**: Not properly handling promises from geocoding or data fetching can lead to race conditions or errors.
-   **Overloading the Map**: Trying to render thousands of individual DOM markers will severely impact performance. Use clustering or WebGL-based layers for large datasets.
-   **Incorrect Coordinate Order**: Mixing up latitude and longitude.
-   **Not Handling API Errors/Rate Limits**: Can lead to a broken user experience.
-   **Violating Terms of Service**: Be aware of Mapbox's ToS regarding data caching, storage, and display.

---

## 7. Official Resources

| Resource Type         | URL                                                       |
|-----------------------|-----------------------------------------------------------|
| Main API Docs         | [https://docs.mapbox.com/api/](https://docs.mapbox.com/api/) [1]                |
| Mapbox GL JS Docs     | [https://docs.mapbox.com/mapbox-gl-js/api/](https://docs.mapbox.com/mapbox-gl-js/api/) [5] |
| Geocoding API Docs    | [https://docs.mapbox.com/api/search/geocoding/](https://docs.mapbox.com/api/search/geocoding/) [3] |
| Mapbox Styles         | [https://docs.mapbox.com/mapbox-gl-js/style-spec/](https://docs.mapbox.com/mapbox-gl-js/style-spec/) |
| Tutorials             | [https://docs.mapbox.com/help/tutorials/](https://docs.mapbox.com/help/tutorials/)         |
| Rate Limits Overview  | [https://docs.mapbox.com/api/overview/#rate-limits](https://docs.mapbox.com/api/overview/#rate-limits) [1] |
| Mapbox Status Page    | [https://status.mapbox.com/](https://status.mapbox.com/)                   |

This guide provides a starting point for integrating Mapbox into your event discovery platform. Always refer to the official Mapbox documentation for the most up-to-date information and advanced features.