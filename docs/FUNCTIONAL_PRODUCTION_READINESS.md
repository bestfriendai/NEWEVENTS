# Functional Production-Readiness Improvements

Based on the codebase review, here is a list of identified functional production-readiness improvements:

**I. API & Backend (`app/api/`, `lib/api/`, `lib/services/`, `lib/backend/`)**

1.  **Input Validation (Critical):**
    *   [`app/api/events/route.ts`](app/api/events/route.ts): Add explicit validation for `searchTerm` (e.g., length, character set) and `category`. Implement range checks for `page` and `limit` query parameters.
    *   [`lib/api/unified-events-service.ts`](lib/api/unified-events-service.ts) (`searchEvents` method): Implement comprehensive validation for all fields in `UnifiedEventSearchParams` (e.g., `lat`/`lng` valid ranges, `radius` sensibility, date string formats, `limit`/`offset` positivity) at the beginning of the method. This is crucial as it's a central aggregation point.

2.  **Error Handling & Reporting:**
    *   **Centralized Production Logging (Critical):** Modify [`lib/utils/logger.ts`](lib/utils/logger.ts) to integrate with a dedicated cloud-based logging service (e.g., Sentry, Logtail, Axiom, Datadog) for all log levels, especially `error` and `warn`, in production environments. This is vital for observability and diagnostics.
    *   **Server-Side Unhandled Rejections:** Implement a global `process.on('unhandledRejection', ...)` handler (e.g., in a server startup file or a middleware if applicable for Next.js API routes) that uses the `logger` to ensure no promise rejections go unnoticed.
    *   **API Error Response Sanitization:** In [`app/api/events/route.ts`](app/api/events/route.ts) and potentially other API routes, avoid directly exposing raw `e.message` from internal services. Log detailed errors internally and return more generic, curated error messages or codes to the client.
    *   **Monitoring `storeEvents` in `UnifiedEventsService`:** The fire-and-forget error handling for `this.storeEvents(...).catch(...)` ([`lib/api/unified-events-service.ts:135-137`](lib/api/unified-events-service.ts:135-137)) should be augmented with monitoring. If Supabase storage fails consistently, the cache will become stale. Consider logging failure rates or implementing a retry mechanism with backoff for `storeEvents`.

3.  **Performance & Scalability:**
    *   **`UnifiedEventsService` - Ticketmaster Data Enhancement ([`lib/api/unified-events-service.ts:384-432`](lib/api/unified-events-service.ts:384-432)):** The per-event image and geocoding enhancements during `fetchFromTicketmaster` can be a bottleneck.
        *   *Suggestion:* Defer these enhancements. Store raw events quickly and enhance them either in the background, on first retrieval from Supabase cache, or when an event detail is specifically requested.
    *   **`UnifiedEventsService` - Image Enhancement for Cached Events ([`lib/api/unified-events-service.ts:519-555`](lib/api/unified-events-service.ts:519-555)):** Avoid re-processing images on every cache read. Ensure images are fully processed and stored in the desired final format/URL *once* when initially cached in Supabase.
    *   **`UnifiedEventsService` - `storeEvents` Efficiency ([`lib/api/unified-events-service.ts:611-653`](lib/api/unified-events-service.ts:611-653)):** For large batches of *new* events, individual Supabase checks and inserts can be slow.
        *   *Suggestion:* After an initial bulk check for existing `external_id`s, use Supabase bulk insert capabilities for the truly new events to improve throughput.
    *   **External API Rate Limiting (`UnifiedEventsService`):** While basic delays exist, implement more robust handling for external API rate limits (e.g., respect `Retry-After` headers from Ticketmaster/RapidAPI, implement circuit breaker patterns for temporarily failing external APIs).
    *   **Database Indexing:** Verify that appropriate database indexes are in place in Supabase for the `events` table, especially on columns used in `WHERE` clauses and `ORDER BY` in `getCachedEvents` and `storeEvents` (e.g., `external_id`, `source`, `is_active`, `start_date`, `created_at`, `location_lat`, `location_lng`, `category`).

4.  **Caching Strategy:**
    *   **[`app/api/events/route.ts`](app/api/events/route.ts) - `memoryCache`:** Re-evaluate the utility of the 5-second instance-specific `memoryCache` given the more robust 4-hour Supabase caching in `UnifiedEventsService`. If `UnifiedEventsService` caching is effective, this API-level cache might be simplified or removed unless specific, very high-frequency burst traffic to single instances justifies it.
    *   **Cache Key Canonicalization:** Ensure cache keys (e.g., in [`app/api/events/route.ts:44`](app/api/events/route.ts:44)) are canonical by sorting parameters or using only known, ordered parameters to improve cache hit consistency.

5.  **Data Integrity:**
    *   **Coordinate Fallbacks in [`app/events/page.tsx`](app/events/page.tsx):** Remove the random frontend coordinate generation for events missing them ([`app/events/page.tsx:595-601`](app/events/page.tsx:595-601), [`app/events/page.tsx:621-628`](app/events/page.tsx:621-628)). Ensure the backend (`UnifiedEventsService` geocoding step) provides valid coordinates or a clear null/undefined, and the UI handles missing coordinates gracefully (e.g., by not plotting the event on a map or showing a "location approximate" message).

**II. Frontend ([`app/events/page.tsx`](app/events/page.tsx), [`hooks/use-enhanced-events.ts`](hooks/use-enhanced-events.ts))**

6.  **Unify Data Fetching Logic (Critical):**
    *   **[`app/events/page.tsx`](app/events/page.tsx)**: This page currently uses direct server actions (`fetchEvents`, `getFeaturedEvents`) for data, duplicating state management and missing features from `useEnhancedEvents`.
        *   *Suggestion:* Refactor `EventsPageContent` in [`app/events/page.tsx`](app/events/page.tsx) to use the `useEnhancedEvents` hook as the primary mechanism for fetching and managing event data. This will centralize client-side event data logic, leverage its caching, request cancellation, and simplify state within the page component.

7.  **API Request Method Mismatch in `useEnhancedEvents`:**
    *   The hook uses `POST` to `/api/events` ([`hooks/use-enhanced-events.ts:196`](hooks/use-enhanced-events.ts:196)), but [`app/api/events/route.ts`](app/api/events/route.ts) only defines a `GET` handler.
        *   *Suggestion:* Correct this mismatch. If `/api/events` is intended to be `GET`, change the `fetch` call in `useEnhancedEvents` to use `GET` and pass parameters via URL query string. If a `POST` endpoint is intended, ensure it exists and is correctly implemented.

8.  **Client-Side Global Error Handling UI:**
    *   The global error handlers in [`components/notification-dropdown.tsx`](components/notification-dropdown.tsx) log errors and set local state.
        *   *Suggestion:* Enhance this to (1) report errors to the centralized logging service (via the improved logger) and (2) potentially trigger a more global UI notification (e.g., a toast) to inform the user, rather than relying on state within the notification dropdown.

9.  **Client-Side Cache in `useEnhancedEvents`:**
    *   The custom `cacheRef` ([`hooks/use-enhanced-events.ts:74`](hooks/use-enhanced-events.ts:74)) is functional but basic.
        *   *Suggestion (Long-term/Optional):* For more complex needs, consider migrating to a dedicated state management/caching library like TanStack Query for features like stale-while-revalidate, more sophisticated cache invalidation, and devtools. For now, ensure the current cache eviction ([`hooks/use-enhanced-events.ts:121-129`](hooks/use-enhanced-events.ts:121-129)) is adequate.

**III. Code Structure & Maintainability**

10. **Modularity:**
    *   **[`lib/api/unified-events-service.ts`](lib/api/unified-events-service.ts)**: This file is over 1100 lines.
        *   *Suggestion:* Refactor into smaller, more focused modules (e.g., Supabase cache interaction logic, data transformation utilities, specific logic for handling each external API's quirks if not already fully encapsulated in their respective client files).
    *   **[`app/events/page.tsx`](app/events/page.tsx)**: This page component is very large.
        *   *Suggestion:* Extract sub-components like `EventCard`, `FeaturedEventsCarousel`, and `AdvancedFiltersPanel` into their own files within `components/events/` for better organization and reusability.
