# Functional Code Review: Production-Readiness Improvements

This document outlines potential functional improvements identified during a code review aimed at enhancing the application's production-readiness.

## I. Functionality Enhancements:

1.  **Dynamic User Data in `AppLayout`:**
    *   **File:** `components/app-layout.tsx` (lines 134-135, 233-234)
    *   **Issue:** User information (name, email, avatar) is hardcoded.
    *   **Suggestion:** Integrate with the authentication provider (`AuthProvider` from `app/layout.tsx`) to display actual authenticated user data.

2.  **Implement Logout Functionality:**
    *   **File:** `components/app-layout.tsx` (lines 152-155, 251-254)
    *   **Issue:** Logout buttons are present but likely not functional.
    *   **Suggestion:** Implement the logout mechanism by calling the appropriate sign-out method from the authentication service.

3.  **Dynamic Event Cards on Landing Page (`ClientPage`):**
    *   **File:** `app/ClientPage.tsx` (lines 305-405)
    *   **Issue:** Event cards displayed under category tabs are static.
    *   **Suggestion:** Fetch and display dynamic event data based on the selected category. Utilize the `getEventsByCategory` server action from `app/actions/event-actions.ts`.

4.  **Comprehensive Server-Side Advanced Filtering:**
    *   **Files:** `app/events/page.tsx`, `app/actions/event-actions.ts`, `lib/api/unified-events-service.ts`
    *   **Issue:** Advanced filters (price range, date range, time of day, event type) set in `AdvancedFiltersPanel` are not passed to the backend for server-side filtering. `UnifiedEventSearchParams` supports `startDate` and `endDate`, but not price or other specific filters.
    *   **Suggestion:**
        *   Update `searchParams` memo and `loadEvents` in `app/events/page.tsx` to include all selected advanced filters.
        *   Modify `fetchEvents` in `app/actions/event-actions.ts` to accept and pass these filters.
        *   Extend `UnifiedEventSearchParams` in `lib/api/unified-events-service.ts` to include new parameters like `priceMin`, `priceMax`, `timeOfDay`, `specificEventType`.
        *   Update `unifiedEventsService.searchEvents` (and its underlying API calls/database queries) to use these new filter parameters.

5.  **Implement "Share Event" Deep Linking:**
    *   **File:** `app/events/page.tsx` (related to `shareEvent` function)
    *   **Issue:** Sharing generates a URL with `?event=<id>`, but the application doesn't currently handle this parameter on load.
    *   **Suggestion:** Add logic to `app/events/page.tsx` to check for an `event` query parameter on mount. If present, fetch that specific event's details and open the `EventDetailModal`.

6.  **Connect Global Search Bar in Header:**
    *   **File:** `components/app-layout.tsx` (search input)
    *   **Issue:** The global search bar's functionality is not connected.
    *   **Suggestion:** On submitting a search from the header bar, navigate the user to the `/events` page and pass the search query as a parameter, populating the search state on the events page.

7.  **User-Specific Featured Events:**
    *   **File:** `app/actions/event-actions.ts` (function `getFeaturedEvents`)
    *   **Issue:** Featured events are fetched based on hardcoded NYC coordinates.
    *   **Suggestion:** Modify `getFeaturedEvents` to accept user's current location (latitude, longitude) as parameters. Update the calling code in `app/events/page.tsx` (`loadFeaturedEvents` function) to pass the `userLocation`.

## II. Robustness & Data Integrity:

8.  **Accurate Event Coordinates (Critical for Map):**
    *   **File:** `app/events/page.tsx` (lines for random coordinate generation)
    *   **Issue:** Fallback logic adds random offsets to user's location if event coordinates are missing.
    *   **Suggestion:** Remove random coordinate generation. Events lacking valid coordinates should be filtered from map view, shown in list views only with a note, or clearly marked as imprecise.

9.  **Enhanced Error Handling for Event Fetching:**
    *   **File:** `app/events/page.tsx` (within `loadEvents`)
    *   **Issue:** Generic error handling sets a simple error message.
    *   **Suggestion:** Provide more specific user-facing error messages based on error types.

10. **Graceful `localStorage` Access Failure:**
    *   **File:** `app/events/page.tsx` (localStorage access `useEffect`)
    *   **Issue:** `localStorage` access might fail, currently only logged to console.
    *   **Suggestion:** If `localStorage` is unavailable or data is corrupt, default to requiring location setup gracefully.

## III. Scalability & Maintainability:

11. **Externalize Local Components:**
    *   **Files:** `app/events/page.tsx`, `app/ClientPage.tsx`
    *   **Issue:** Several substantial components are defined locally.
    *   **Suggestion:** Move `EventCard`, `EventCardSkeleton`, `FeaturedEventsCarousel`, `AdvancedFiltersPanel` (from `events/page.tsx`) and `FloatingCard`, `EventCard` (from `ClientPage.tsx`) into their own files in `components/`.

12. **Refactor `EventsPageContent` for Better Readability:**
    *   **File:** `app/events/page.tsx` (component `EventsPageContent`)
    *   **Issue:** The component is very large and handles many concerns.
    *   **Suggestion:** Break it down into smaller custom hooks and sub-components.

## IV. Performance Optimization:

13. **Optimize Images with `next/image`:**
    *   **Files:** `app/events/page.tsx`, `app/ClientPage.tsx` (where `<img>` tags are used for events)
    *   **Issue:** Standard `<img>` tags are used for event images.
    *   **Suggestion:** Replace `<img>` tags with the `next/image` component.

14. **Review Data Fetching Strategy (`fetchEvents` Limit):**
    *   **Files:** `app/actions/event-actions.ts`, `lib/api/unified-events-service.ts`
    *   **Issue:** `fetchEvents` action requests a minimum of 50-100 events, while client page size might be smaller.
    *   **Suggestion:** Ensure consistency in limits and that `unifiedEventsService` efficiently handles pagination if fetching larger chunks than the client displays.

## V. User Experience (UX) Enhancements:

15. **Consistent and Informative Empty/Error States:**
    *   **File:** `app/events/page.tsx`
    *   **Issue:** Ensure all data views have clear empty/error states.
    *   **Suggestion:** Review all data display areas (grids, lists, map event list sidebar) for comprehensive empty/error states.

16. **Loading Indicators for Filters & Sort Operations:**
    *   **File:** `app/events/page.tsx`
    *   **Issue:** May lack immediate visual feedback during re-fetches.
    *   **Suggestion:** Implement clear loading indicators during these data operations.

17. **Preserve Filter/Search State on Navigation:**
    *   **File:** `app/events/page.tsx`
    *   **Issue:** Filter/search state might be lost on navigation.
    *   **Suggestion:** Implement state preservation using URL query parameters or `sessionStorage`.

18. **Accessibility Review for Custom Interactive Components:**
    *   **Files:** `app/events/page.tsx`, `components/app-layout.tsx`
    *   **Issue:** Custom interactive elements might lack proper ARIA attributes or keyboard navigability.
    *   **Suggestion:** Conduct an accessibility review for ARIA attributes, keyboard accessibility, and focus management.
