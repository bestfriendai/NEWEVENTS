# Ticketmaster Discovery API Implementation Guide

The Ticketmaster Discovery API provides access to a vast inventory of live events, including concerts, sports, theater, and family attractions from Ticketmaster, Universe, FrontGate Tickets, and Ticketmaster Resale. This guide outlines how to integrate it into an event discovery platform like NEWEVENTS.

---

## 1. Authentication

The Ticketmaster Discovery API uses an **API Key** (referred to as `apikey` or Consumer Key) for authentication.

**Steps to get an API Key:**
1.  Register for a developer account at the [Ticketmaster Developer Portal](https://developer.ticketmaster.com/) [4].
2.  Once registered, an application will usually be created for you by default, or you can create a new one.
3.  Your API Key (Consumer Key) will be available in your application's details page on the portal.

**Using the API Key:**
The `apikey` must be included as a query parameter in all API requests.
\`\`\`
https://app.ticketmaster.com/discovery/v2/events.json?apikey=YOUR_API_KEY&keyword=concerts
\`\`\`
Replace `YOUR_API_KEY` with your actual key.
[Source: Ticketmaster Developer Docs][1][2]

---

## 2. Key API Endpoints & Functionalities

The Discovery API is RESTful and returns data in JSON format. The base URL is `https://app.ticketmaster.com/discovery/v2/`.

### Search Events
**Endpoint:** `GET /events.json`
This is the primary endpoint for finding events.

**Key Parameters for Event Discovery:**
-   `apikey` (required): Your API key.
-   `keyword`: Search for events by keyword (e.g., artist name, event title, venue name).
-   `latlong`: Latitude and longitude, comma-separated (e.g., `34.0522,-118.2437`). Use with `radius`.
-   `radius`: Search radius around `latlong`. Units: `miles` or `km` (e.g., `50`, `25km`). Default is 25 miles.
-   `startDateTime`, `endDateTime`: Filter events by a date/time range (ISO 8601 format, e.g., `2025-10-01T10:00:00Z`).
-   `attractionId`: Filter by one or more attraction (artist, team) IDs (comma-separated).
-   `venueId`: Filter by one or more venue IDs (comma-separated).
-   `promoterId`: Filter by promoter ID.
-   `segmentId`, `segmentName`: Filter by segment (e.g., Music, Sports).
-   `genreId`, `genreName`: Filter by genre.
-   `subGenreId`, `subGenreName`: Filter by sub-genre.
-   `classificationName`: Filter by classification name (can be segment, genre, or sub-genre, e.g., `Rock`, `Football`).
-   `classificationId`: Filter by classification ID (can be segment, genre, or sub-genre ID).
-   `marketId`: Filter by market ID (Ticketmaster-defined geographic regions).
-   `countryCode`: Filter by ISO 3166-1 alpha-2 country code (e.g., `US`, `GB`).
-   `stateCode`: Filter by state/province code (e.g., `CA`, `NY`).
-   `city`: Filter by city name.
-   `postalCode`: Filter by postal/zip code.
-   `size`: Number of results per page (default 20, max 200 for most users).
-   `page`: Page number for pagination (0-indexed).
-   `sort`: Sort order (e.g., `name,asc`, `date,asc`, `relevance,desc`, `distance,asc` (requires `latlong`)).
-   `includeTBA`, `includeTBD`, `includeTest`: Include events with "To Be Announced" or "To Be Determined" dates/times, or test events.
-   `source`: Filter by source system (e.g., `ticketmaster`, `universe`, `frontgate`).

**Example Request:**
\`\`\`
https://app.ticketmaster.com/discovery/v2/events.json?apikey=YOUR_API_KEY&keyword=Ed Sheeran&city=London&countryCode=GB&startDateTime=2025-07-01T00:00:00Z&endDateTime=2025-07-31T23:59:59Z&sort=date,asc
\`\`\`

### Get Event Details
**Endpoint:** `GET /events/{id}.json`
Retrieves detailed information for a specific event by its ID.
\`\`\`
https://app.ticketmaster.com/discovery/v2/events/G5v0Z9JKea7A7.json?apikey=YOUR_API_KEY
\`\`\`

### Search Attractions
**Endpoint:** `GET /attractions.json`
Search for attractions (performers, sports teams, etc.).
Parameters are similar to event search where applicable (e.g., `keyword`, `classificationName`).

### Get Attraction Details
**Endpoint:** `GET /attractions/{id}.json`
Retrieves details for a specific attraction.

### Search Venues
**Endpoint:** `GET /venues.json`
Search for venues.
Parameters include `keyword`, `latlong`, `radius`, `stateCode`, `countryCode`.

### Get Venue Details
**Endpoint:** `GET /venues/{id}.json`
Retrieves details for a specific venue.

### Search Classifications
**Endpoint:** `GET /classifications.json`
Search for classifications (segments, genres, sub-genres).

### Get Classification Details
**Endpoint:** `GET /classifications/{id}.json`
Retrieves details for a specific classification.

[Source: Ticketmaster Discovery API Docs][1][2][3]

---

## 3. Data Models

The API returns rich, structured data. Key entities include:

-   **Event:**
    -   `id`, `name`, `type`
    -   `url`: Link to the event on Ticketmaster.
    -   `locale`
    -   `images`: Array of image objects.
    -   `dates`: Object with `start` (object: `localDate`, `localTime`, `dateTime` (ISO 8601 UTC)), `end`, `timezone`, `status`.
    -   `classifications`: Array of classification objects (segment, genre, subGenre).
    -   `promoter`, `promoters`: Information about event promoters.
    -   `priceRanges`: Array of objects detailing ticket prices.
    -   `seatmap`: Link to seat map image.
    -   `_embedded`: Contains nested related entities like `venues`, `attractions`.
        -   `venues`: Array of venue objects.
        -   `attractions`: Array of attraction objects.
-   **Attraction:**
    -   `id`, `name`, `type`
    -   `url`: Link to attraction page.
    -   `images`
    -   `classifications`
    -   `upcomingEvents`: Object summarizing upcoming event counts for different sources.
-   **Venue:**
    -   `id`, `name`, `type`
    -   `url`: Link to venue page.
    -   `locale`
    -   `images`
    -   `postalCode`, `city`, `state`, `country`, `address`
    -   `location`: Object with `longitude`, `latitude`.
    -   `markets`: Array of market objects.
    -   `dmas`: Array of DMA (Designated Market Area) IDs.
    -   `social`: Links to social media.
    -   `parkingDetail`, `accessibleSeatingDetail`.
-   **Classification:**
    -   `primary`: boolean
    -   `segment`: Object with `id`, `name`.
    -   `genre`: Object with `id`, `name`.
    -   `subGenre`: Object with `id`, `name`.
    -   `type`, `subType`.

The `_embedded` field in responses is crucial for accessing related data without making separate API calls.
[Source: Ticketmaster Data Model Docs][2]

---

## 4. Error Handling

The API uses standard HTTP status codes.
-   `200 OK`: Success.
-   `400 Bad Request`: Invalid request parameters. The response body may contain a `fault` object with details.
-   `401 Unauthorized`: Invalid or missing API key, or key does not have permission.
-   `403 Forbidden`: Access denied.
-   `404 Not Found`: Resource not found.
-   `429 Too Many Requests`: Rate limit exceeded.
-   `500 Internal Server Error`: Server-side error at Ticketmaster.

**Example Error Response Snippet:**
\`\`\`json
// For a 400 error
{
  "fault": {
    "faultstring": "Invalid date format for startDateTime",
    "detail": {
      "errorcode": "discovery.APIError.INVALID_PARAMETER_FORMAT"
    }
  }
}
// For a 401 error
{
  "fault": {
    "faultstring": "Invalid ApiKey",
    "detail": {
      "errorcode": "oauth.v2.InvalidApiKey"
    }
  }
}
\`\`\`
Always check the response body for specific error details.

---

## 5. Rate Limiting

-   Ticketmaster imposes rate limits on API usage.
-   Default limits are often around **5 requests per second** and **5000 requests per day** for standard developer accounts, but this can vary.
-   If you exceed the limit, you'll receive a `429 Too Many Requests` response.
-   The response headers for a `429` error typically include:
    -   `Rate-Limit-Available`: Requests remaining in the current window.
    -   `Rate-Limit-Over`: Number of requests over the limit.
    -   `Rate-Limit-Reset`: Time (in milliseconds) until the limit resets.
-   **Strategies:**
    -   Monitor these headers to manage your request rate.
    -   Implement client-side or server-side throttling.
    -   Cache responses appropriately, especially for data that doesn't change frequently (venue details, classifications).
    -   Contact Ticketmaster for higher limits if needed for your application scale.
[Source: Ticketmaster Rate Limiting Info - often found in API responses or general docs][5]

---

## 6. Best Practices

1.  **Use Specific Filters**: Narrow down searches using parameters like `classificationName`, `latlong` with `radius`, and date ranges to get relevant results and reduce data processing.
2.  **Handle Pagination**: Use `page` and `size` parameters to iterate through large result sets. Remember `page` is 0-indexed.
3.  **Leverage `_embedded` Data**: Utilize the `_embedded` section in event responses to get venue and attraction details in a single call, reducing the need for follow-up requests.
4.  **Cache Static Data**: Information like venue details or classifications changes infrequently. Cache this data to reduce API calls.
5.  **Error Resilience**: Implement robust error handling, including retries with exponential backoff for `429` or `5xx` errors.
6.  **Monitor API Key Usage**: Keep track of your API call volume.
7.  **Stay Updated**: Check the Ticketmaster Developer Portal for API updates, new features, or deprecation notices.

---

## 7. Common Pitfalls

-   **Not Using `apikey`**: Forgetting the `apikey` parameter will result in `401` errors.
-   **Incorrect Date/Time Formatting**: `startDateTime` and `endDateTime` must be in valid ISO 8601 format.
-   **Ignoring Pagination for Large Datasets**: Only fetching the first page of results.
-   **Over-fetching with Broad Keywords**: Using very generic keywords without other filters can return too much irrelevant data.
-   **Hardcoding Entity IDs**: IDs for venues or attractions might change or vary by market. Search by name or other attributes where possible if IDs are not stable for your use case.
-   **Not Respecting Rate Limits**: Aggressively polling without checking rate limit headers can lead to temporary blocking.

---

## 8. Official Resources

-   **Ticketmaster Developer Portal**: [https://developer.ticketmaster.com/](https://developer.ticketmaster.com/)[4]
-   **Discovery API Documentation**: [https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/)[1]
-   **Discovery API Tutorials & Guides**: [https://developer.ticketmaster.com/products-and-docs/tutorials/](https://developer.ticketmaster.com/products-and-docs/tutorials/) (e.g., [Events Search Tutorial][2])
-   **API Explorer**: [https://developer.ticketmaster.com/api-explorer/](https://developer.ticketmaster.com/api-explorer/) (Useful for testing queries) [2]
-   **API Terms of Use**: Always review the terms of use for data caching, display requirements, etc.

By integrating the Ticketmaster Discovery API, NEWEVENTS can significantly enhance its event listings with a wide variety of live entertainment options.
