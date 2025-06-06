# PredictHQ API Implementation Guide

PredictHQ provides intelligent event data, helping businesses understand and predict the impact of real-world events on demand. For an event discovery platform like NEWEVENTS, PredictHQ can offer a rich source of scheduled events, from concerts and sports to public holidays and unscheduled events like severe weather.

---

## 1. Authentication

PredictHQ uses **OAuth 2.0 Bearer Tokens** for authentication.

**Steps to get an Access Token:**
1.  Sign up for a PredictHQ account at [predicthq.com](https://www.predicthq.com/).
2.  Create an application in the PredictHQ Control Center (developer dashboard).
3.  Your `client_id` and `client_secret` will be provided.
4.  Use these credentials to request an access token from the PredictHQ OAuth token endpoint: `https://auth.predicthq.com/oauth2/token`
    \`\`\`bash
    curl -X POST "https://auth.predicthq.com/oauth2/token" \
         -H "Content-Type: application/x-www-form-urlencoded" \
         -d "grant_type=client_credentials&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET&scope=events"
    \`\`\`
    (Replace `YOUR_CLIENT_ID` and `YOUR_CLIENT_SECRET`). The `scope` parameter might vary based on your subscription (e.g., `events`, `features`).

**Using the Access Token:**
Include the access token in the `Authorization` header for all API requests:
\`\`\`python
headers = {
    "Authorization": "Bearer YOUR_ACCESS_TOKEN", # Replace with your obtained token
    "Accept": "application/json"
}
\`\`\`
[Source: PredictHQ Authentication Docs, General OAuth 2.0 Practices][2][5]

---

## 2. Key API Endpoints & Functionalities

PredictHQ offers several APIs. For event discovery, the **Events API** is primary. The **Features API** can be useful for understanding event impact through pre-aggregated metrics.

**Base API URL:** `https://api.predicthq.com/v1/`

### Events API
Used to search and retrieve detailed information about events.
**Endpoint:** `GET /events/`

**Key Parameters for Event Discovery:**
-   `active.gte`, `active.lte`: Filter events by start date range (ISO 8601 format, e.g., `2025-10-01`).
-   `active.around.origin`: Find events around a specific date (e.g., `today`, `next-7-days`).
-   `location.place_id`: Array of GeoName IDs for specific cities/regions.
-   `location.origin`: Latitude,Longitude string (e.g., `34.0522,-118.2437`).
-   `location.within`: Search radius around `location.origin` (e.g., `10km`, `50mi`).
-   `country`: Filter by ISO 3166-1 alpha-2 country code (e.g., `US`, `GB`).
-   `q`: Keyword search across event titles, descriptions, and labels.
-   `category`: Filter by event category (e.g., `concerts`, `sports`, `conferences`, `community`, `expos`, `festivals`, `performing-arts`, `public-holidays`, `school-holidays`, `academic`). Multiple categories can be comma-separated.
-   `label`: Filter by specific event labels (e.g., `disaster`, `health-warning`, `terror`).
-   `rank_level`: Filter by PHQ Rank level (e.g., `3,4,5` for moderate to major impact events).
-   `rank.gte`, `rank.lte`: Filter by a specific PHQ Rank range (0-100).
-   `predicted_attendance.gte`, `predicted_attendance.lte`: Filter by predicted attendance numbers.
-   `sort`: Sort results (e.g., `rank`, `-rank`, `start`, `-start`, `predicted_attendance`).
-   `limit`: Number of results per page (default 10, max 500 for some endpoints/plans).
-   `offset`: For pagination.

**Example Request (Python):**
\`\`\`python
import requests

ACCESS_TOKEN = "YOUR_ACCESS_TOKEN"
headers = {
    "Authorization": f"Bearer {ACCESS_TOKEN}",
    "Accept": "application/json"
}
params = {
    "active.gte": "2025-07-01",
    "active.lte": "2025-07-07",
    "location.within": "50km@34.0522,-118.2437", # 50km around Los Angeles
    "category": "concerts,sports",
    "rank.gte": 60, # Events with PHQ Rank 60 or higher
    "sort": "-rank", # Sort by highest rank first
    "limit": 20
}
response = requests.get("https://api.predicthq.com/v1/events/", headers=headers, params=params)

if response.status_code == 200:
    events_data = response.json()
    for event in events_data.get('results', []):
        print(f"Event: {event['title']}, Rank: {event.get('rank')}, Start: {event['start']}")
else:
    print(f"Error: {response.status_code} - {response.text}")
\`\`\`

### Features API
Provides pre-aggregated event data, useful for understanding overall event impact in a location over time.
**Endpoint:** `GET /features/` or `POST /features/` (POST for more complex queries)
This API can return sums or statistics of PHQ Rank, attendance, etc., for specified locations and time periods, broken down by category.
[Source: PredictHQ API Docs][1][3]

---

## 3. Data Models

Key data fields within an **Event object** from the Events API:
-   `id` (string): Unique PredictHQ event ID.
-   `title` (string): Event title.
-   `description` (string): Event description.
-   `category` (string): Main category (e.g., `sports`).
-   `labels` (array of strings): Specific labels (e.g., `nfl`, `music-festival`).
-   `start` (datetime string): Event start time in ISO 8601 format (UTC by default, or with timezone).
-   `end` (datetime string): Event end time.
-   `predicted_end` (datetime string): For events with uncertain end times.
-   `timezone` (string): IANA timezone of the event (e.g., `America/New_York`).
-   `duration` (integer): Event duration in seconds.
-   `location` (array of float): `[longitude, latitude]`.
-   `geo` (object): Detailed geographic information including `geometry` (Point or Polygon), `placekey`.
-   `address` (object): Contains `formatted_address`, `street`, `city`, `postcode`, etc.
-   `entities` (array of objects): Associated entities like venues.
    -   `venue_id`, `name`, `address`.
-   `rank` (integer): **PHQ Rank** (0-100), PredictHQ's score for the event's potential local impact. Higher is more significant.
-   `local_rank` (integer): Similar to rank but adjusted for local context.
-   `aviation_rank` (integer): Impact on aviation.
-   `phq_attendance` (integer): Predicted attendance for the event. Can be null if not applicable or data is insufficient.
-   `predicted_event_spend` (object): Predicted local spend due to the event.
-   `scope` (string): Geographic scope of the event (e.g., `locality`, `region`, `country`).
-   `country` (string): ISO country code.
-   `place_hierarchies` (array of arrays): GeoName IDs representing the place hierarchy (e.g., [[continent_id], [country_id], [region_id], [county_id], [locality_id]]).
-   `updated` (datetime string): Last update time for the event data.
-   `first_seen` (datetime string): When PredictHQ first recorded the event.

[Source: PredictHQ Event Fields, API Docs][1][3]

---

## 4. Error Handling

PredictHQ uses standard HTTP status codes:
-   `200 OK`: Request successful.
-   `400 Bad Request`: Invalid parameters in the request (e.g., bad date format, unrecognized parameter). Response body often contains details.
-   `401 Unauthorized`: Invalid or expired access token, or token missing required scopes.
-   `403 Forbidden`: Access token is valid, but does not have permission for the requested resource or action.
-   `404 Not Found`: The requested resource (e.g., a specific event ID) does not exist.
-   `429 Too Many Requests`: Rate limit exceeded. See Rate Limiting section.
-   `500 Internal Server Error`: An issue on PredictHQ's servers.
-   `502 Bad Gateway`, `503 Service Unavailable`, `504 Gateway Timeout`: Temporary issues, potentially with upstream services or PredictHQ itself. Retry with backoff.

**Example Error Handling (Python):**
\`\`\`python
try:
    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status() # Raises an HTTPError for bad responses (4xx or 5xx)
    data = response.json()
    # Process data
except requests.exceptions.HTTPError as http_err:
    print(f"HTTP error occurred: {http_err} - Status: {response.status_code}")
    print(f"Response body: {response.text}")
    if response.status_code == 429:
        # Implement retry logic with backoff
        pass
except requests.exceptions.RequestException as req_err:
    print(f"Request exception occurred: {req_err}")
except Exception as e:
    print(f"An unexpected error occurred: {e}")
\`\`\`

---

## 5. Rate Limiting

-   PredictHQ APIs have rate limits, typically around **60 requests per minute per access token**, but this can vary based on your subscription plan.
-   If you exceed the limit, the API responds with a `429 Too Many Requests` status code.
-   Response headers for `429` errors may include:
    -   `Retry-After` (seconds to wait before retrying).
    -   `X-RateLimit-Limit`: The current rate limit.
    -   `X-RateLimit-Remaining`: Requests remaining in the current window.
    -   `X-RateLimit-Reset`: Timestamp (UTC epoch seconds) when the limit resets.
-   **Strategies:**
    -   Respect `Retry-After` header if present.
    -   Implement exponential backoff with jitter for retries.
    -   Cache API responses appropriately (especially for static or slowly changing data like venue details or historical event data), respecting PredictHQ's caching guidelines.
    -   Optimize queries to fetch only necessary data.
    -   Contact PredictHQ for higher rate limits if your application requires it.

---

## 6. Best Practices

1.  **Use Specific Filters**: Apply multiple relevant filters (location, category, date range, rank) to narrow down results and reduce the amount of data transferred and processed. Avoid overly broad queries. [Source: PredictHQ Docs - Filter out the noise][1]
2.  **Leverage PHQ Rank & Attendance**: Use `rank` and `phq_attendance` to find impactful events relevant to your platform's users.
3.  **Understand Place Hierarchies**: Use `place_hierarchies` for more advanced location-based aggregation or filtering if needed.
4.  **Handle Timezones**: Event `start` and `end` times can be in UTC or include a specific timezone. Ensure your application handles timezones correctly, especially when displaying to users in different regions. The `timezone` field in the event object is crucial.
5.  **Pagination**: Properly implement pagination using `limit` and `offset` (or cursor-based if available for certain endpoints) to retrieve all results for a query.
6.  **Efficient Polling (If Necessary)**: If polling for updates, do so at reasonable intervals and use the `updated.gte` parameter to fetch only events updated since your last poll. Consider webhooks if PredictHQ offers them for your use case.
7.  **Use the Features API for Aggregates**: If you need aggregated data (e.g., total attendance from concerts in a city next month), the Features API is more efficient than fetching all events and aggregating yourself. [Source: PredictHQ Docs][1][3]

---

## 7. Common Pitfalls

-   **Over-fetching Data**: Requesting too many fields or too many events without specific filters can lead to slow responses and quickly hitting rate limits.
-   **Ignoring Timezones**: Misinterpreting event start/end times due to incorrect timezone handling.
-   **Not Handling `429 Too Many Requests`**: Failing to implement retry logic for rate limit errors can lead to service disruption.
-   **Inefficient Location Search**: Using broad keyword searches for locations instead of more precise methods like `location.within` with coordinates or `place_id`.
-   **Misunderstanding PHQ Rank**: Not realizing that PHQ Rank is a relative impact score and its interpretation might require context.
-   **Ignoring `scope`**: Events can have different geographic scopes (e.g., a public holiday is `country`-scoped). Filter by scope if you only want local events.

---

## 8. Official Resources

-   **PredictHQ Developer Documentation**: [https://docs.predicthq.com/](https://docs.predicthq.com/)[1][2][5]
-   **PredictHQ API Overview**: [https://www.predicthq.com/apis](https://www.predicthq.com/apis)[3][4]
-   **PredictHQ Control Center (Dashboard)**: For managing applications, tokens, and viewing usage.

By effectively utilizing PredictHQ's event intelligence, the NEWEVENTS platform can provide users with a comprehensive and insightful view of upcoming events and their potential impact.
