"use client"

import { useState, useEffect, useMemo, memo, useCallback } from "react";
import { useInfiniteEvents, type EventsQueryParams } from "@/hooks/use-events-query";
import { useLocationContext } from "@/contexts/LocationContext";
import type { EventDetailProps } from "@/components/event-detail-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin, Calendar, Clock, AlertCircle, RefreshCw } from "lucide-react";
import styles from "./EventsExplorer.module.css";

// Memoized EventCard component with proper null checks and accessibility
const EventCardPlaceholder = memo(({ event }: { event: EventDetailProps }) => {
  const eventTitle = event?.title || "Event Title";
  const eventDate = event?.date || "TBD";
  const eventTime = event?.time;
  const eventLocation = event?.location || "Location TBD";
  const eventImage = event?.image;

  return (
    <Card className={styles.eventCard} role="article" aria-labelledby={`event-title-${event?.id}`}>
      <CardHeader className={styles.eventCardHeader}>
        <CardTitle id={`event-title-${event?.id}`} className={styles.eventTitle}>
          {eventTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className={styles.eventCardContent}>
        <div className={styles.eventDetail}>
          <Calendar className={styles.eventIcon} aria-hidden="true" />
          <span>{eventDate}{eventTime ? ` at ${eventTime}` : ''}</span>
        </div>
        <div className={styles.eventDetail}>
          <MapPin className={styles.eventIcon} aria-hidden="true" />
          <span>{eventLocation}</span>
        </div>
        {eventImage && (
          <img 
            src={eventImage} 
            alt={`Image for ${eventTitle}`} 
            className={styles.eventImage}
            loading="lazy"
          />
        )}
      </CardContent>
    </Card>
  );
});

EventCardPlaceholder.displayName = 'EventCardPlaceholder';

export function EventsExplorer() {
  const { userLocation, isLoading: isLocationLoading, error: locationError } = useLocationContext();
  const [retryCount, setRetryCount] = useState(0);
  
  // Initial filters state - can be expanded
  const [filters, setFilters] = useState<Partial<EventsQueryParams>>({
    keyword: "",
    radius: 25, // Default radius in km
    // Add other filter states here: category, dateRange, etc.
  });

  // Prepare query parameters for useInfiniteEvents, including userLocation
  const queryParams: EventsQueryParams = useMemo(() => ({
    ...filters,
    coordinates: userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : undefined,
  }), [filters, userLocation]);

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status, // 'pending', 'error', 'success'
    refetch,
  } = useInfiniteEvents(
    queryParams,
    { enabled: !!userLocation } // Only enable query when userLocation is available
  );

  // Combine all pages of events into a single array
  const allEvents = useMemo(() => data?.pages.flatMap(page => page.events) ?? [], [data]);

  // Handler for filter changes with debouncing
  const handleFilterChange = useCallback((newFilters: Partial<EventsQueryParams>) => {
    setFilters((prev: Partial<EventsQueryParams>) => ({ ...prev, ...newFilters }));
  }, []);

  // Retry handler for error states
  const handleRetry = useCallback(async () => {
    setRetryCount(prev => prev + 1);
    await refetch();
  }, [refetch]);

  // Effect to log location or events data for debugging
  useEffect(() => {
    if (userLocation) {
      console.log("User location:", userLocation);
    }
    if (allEvents.length > 0) {
      console.log("Fetched events:", allEvents.length);
    }
  }, [userLocation, allEvents]);

  if (isLocationLoading) {
    return (
      <div className={styles.loadingContainer} role="status" aria-live="polite">
        <Loader2 className={styles.spinner} aria-hidden="true" />
        <p>Loading location...</p>
      </div>
    );
  }

  if (locationError) {
    return (
      <div className={styles.errorContainer} role="alert">
        <AlertCircle className={styles.errorIcon} aria-hidden="true" />
        <p>Location Error: {locationError}. Please ensure location services are enabled.</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          <RefreshCw className={styles.buttonIcon} aria-hidden="true" />
          Retry
        </Button>
      </div>
    );
  }

  if (!userLocation && status !== 'pending') {
    return (
      <div className={styles.noLocationContainer} role="alert">
        <MapPin className={styles.locationIcon} aria-hidden="true" />
        <p>Please set or allow your location to find events.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Filters Panel (Left Side) */}
      <aside className={styles.filtersPanel} role="complementary" aria-label="Event filters">
        <h3 className={styles.filtersTitle}>Filters</h3>
        <div className={styles.filterGroup}>
          <label htmlFor="keyword" className={styles.filterLabel}>Keyword:</label>
          <Input
            id="keyword"
            type="text"
            value={filters.keyword || ""}
            onChange={(e) => handleFilterChange({ keyword: e.target.value })}
            placeholder="Search events..."
            className={styles.filterInput}
            aria-describedby="keyword-help"
          />
          <span id="keyword-help" className={styles.helpText}>Search by event name or description</span>
        </div>
        <div className={styles.filterGroup}>
          <label htmlFor="radius" className={styles.filterLabel}>Radius (km):</label>
          <Input
            id="radius"
            type="number"
            value={filters.radius || 25}
            onChange={(e) => handleFilterChange({ radius: parseInt(e.target.value, 10) || 25 })}
            className={styles.filterInput}
            min="1"
            max="100"
            aria-describedby="radius-help"
          />
          <span id="radius-help" className={styles.helpText}>Search radius from your location</span>
        </div>
      </aside>

      {/* Main Content Area (Map and Events List/Grid) */}
      <main className={styles.mainContent} role="main">
        {/* Map Placeholder */}
        <section className={styles.mapContainer} aria-label="Events map">
          <div className={styles.mapPlaceholder}>
            <MapPin className={styles.mapIcon} aria-hidden="true" />
            <p>Map Component Placeholder</p>
          </div>
        </section>

        {/* Events List */}
        <section className={styles.eventsContainer} aria-label="Events list">
          {status === 'pending' && (
            <div className={styles.loadingContainer} role="status" aria-live="polite">
              <Loader2 className={styles.spinner} aria-hidden="true" />
              <p>Loading events...</p>
            </div>
          )}
          {error && (
             <div className={styles.errorContainer} role="alert">
               <AlertCircle className={styles.errorIcon} aria-hidden="true" />
               <p>Error loading events: {error.message}</p>
               <Button onClick={handleRetry} variant="outline" disabled={retryCount >= 3}>
                 <RefreshCw className={styles.buttonIcon} aria-hidden="true" />
                 {retryCount >= 3 ? 'Max retries reached' : `Retry (${retryCount}/3)`}
               </Button>
             </div>
           )}
          {data && (
            <div className={styles.eventsList}>
              {data.pages.flatMap(page => page.events).map((event) => (
                <EventCardPlaceholder 
                  key={`${event.id}-${event.title}-${event.date}`} 
                  event={event} 
                />
              ))}
              {hasNextPage && (
                <div className={styles.loadMoreContainer}>
                  <Button 
                    onClick={() => fetchNextPage()} 
                    disabled={isFetchingNextPage}
                    className={styles.loadMoreButton}
                    aria-label={isFetchingNextPage ? 'Loading more events' : 'Load more events'}
                  >
                    {isFetchingNextPage && <Loader2 className={styles.buttonSpinner} aria-hidden="true" />}
                    {isFetchingNextPage ? 'Loading more...' : 'Load More'}
                  </Button>
                </div>
              )}
              {!hasNextPage && status === 'success' && data.pages.flatMap(page => page.events).length > 0 && (
                 <p className={styles.endMessage}>Nothing more to load.</p>
               )}
               {status === 'success' && data.pages.flatMap(page => page.events).length === 0 && (
                 <p className={styles.noEventsMessage}>No events found for your criteria.</p>
               )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}