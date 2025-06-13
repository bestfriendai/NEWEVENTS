"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Grid, List, Map, Sparkles, Loader2 } from "lucide-react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { EnhancedSearch } from "@/components/ui/enhanced-search" // Temporarily commented out - file missing
// import { AdvancedFilters } from "@/components/ui/advanced-filters" // Temporarily commented out - file missing
import { SmartEventRecommendations } from "@/components/events/SmartEventRecommendations"
import { EventCard, EventCardGrid } from "@/components/events/EventCard"
// import { EventsMap } from "@/components/events/EventsMap" // Replaced with dynamic import
import { UserInsightsDashboard } from "@/components/analytics/UserInsightsDashboard"
import { useLocationContext } from "@/contexts/LocationContext"
import { useDebounce } from "@/hooks/use-debounce"
import { searchEvents } from "@/lib/api/events-api"
import { performanceMonitor, ImageOptimizer } from "@/lib/performance/optimization"
import { logger } from "@/lib/utils/logger"
import { cn } from "@/lib/utils"
import type { Event } from "@/types/event.types";
import type { EventDetailProps } from "@/components/event-detail-modal"; // For mapping

// Define EventSource based on the Event type in event.types.ts
type EventSourceLiteral = "ticketmaster" | "predicthq" | "eventbrite";

// Helper function to map EventDetailProps to Event (targeting types/event.types.ts Event interface)
const mapEventDetailToPropsToEvent = (detail: EventDetailProps, sourceName: string): Event => {
  let priceObject: Event['price'] | undefined = undefined;
  if (typeof detail.price === 'string') {
    if (detail.price.toLowerCase() === 'free') {
      // For 'free', price object can be undefined as per Event type, or explicitly set if needed
      // priceObject = { min: 0, currency: 'USD' }; // Or however free is represented if not just by absence of price object
    } else if (detail.price.startsWith('$')) {
      const parts = detail.price.substring(1).split('-');
      const min = parseFloat(parts[0]);
      if (!isNaN(min)) {
        priceObject = { min, currency: 'USD' }; // Assuming USD
        if (parts.length > 1) {
          const max = parseFloat(parts[1]);
          if (!isNaN(max)) {
            priceObject.max = max;
          }
        }
      }
    }
    // If price is a string but not 'free' or '$...', it's unhandled for structured price.
  }

  // Fallback for source if not a valid literal
  let validSource: EventSourceLiteral = 'ticketmaster'; // Default
  if (sourceName === 'ticketmaster' || sourceName === 'predicthq' || sourceName === 'eventbrite') {
    validSource = sourceName;
  }

  return {
    id: String(detail.id),
    title: detail.title,
    description: detail.description,
    date: `${detail.date} ${detail.time}`, // Combine date and time into a single string
    location: {
      name: detail.location,
      address: detail.address,
      city: detail.location, // Assuming detail.location is city. Needs refinement if city is separate in EventDetailProps.
      coordinates: detail.coordinates,
    },
    category: detail.category, // Direct mapping as Event.category is string
    price: priceObject,
    image: detail.image,
    url: detail.ticketLinks?.[0]?.link, // Use first ticket link as the main URL
    source: validSource,
    attendeeCount: detail.attendees,
    isFavorite: detail.isFavorite,
    // tags: undefined, // Event type in event.types.ts has optional tags?: string[] - EventDetailProps doesn't have tags.
  };
};

const DynamicEventsMap = dynamic(() => import("@/components/events/EventsMap").then(mod => mod.default), {
  ssr: false,
  loading: () => (
    <div className="h-96 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-800">
      <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
      <p className="ml-2 text-gray-500">Loading map...</p>
    </div>
  ),
});

interface EnhancedEventsPageProps {
  initialEvents?: Event[]
  className?: string
}

export function EnhancedEventsPage({ initialEvents = [], className }: EnhancedEventsPageProps) {
  // State management
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [filteredEvents, setFilteredEvents] = useState<Event[]>(initialEvents)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({})
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid")
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [sortBy, setSortBy] = useState<"relevance" | "date" | "distance" | "popularity">("relevance")

  // Hooks
  const { userLocation, isLoading: isLocationLoading, error: locationError } = useLocationContext()
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Performance monitoring
  useEffect(() => {
    performanceMonitor.recordMetric("page_load", Date.now())

    // Preload critical images
    const criticalImages = events
      .slice(0, 6)
      .map((event: Event) => event.image)
      .filter((image): image is string => typeof image === 'string') // Type guard to ensure string[]
    ImageOptimizer.preloadCriticalImages(criticalImages)
  }, [events])

  // Search and filter logic
  const handleSearch = useCallback(
    async (query: string, options?: any) => {
      setIsLoading(true)
      setSearchQuery(query)

      try {
        const searchParams = {
          keyword: query,
          coordinates: userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : undefined,
          categories: activeFilters.categories,
          priceRange: activeFilters.price,
          dateRange: activeFilters.date,
          size: 50,
          sort: sortBy,
        }

        logger.info("Searching events", { query, params: searchParams })

        const result = await searchEvents(searchParams)
        logger.info("Search successful", { count: result.events.length })

        const eventSource = result.sources?.[0] || 'Unknown'; // Use first source or default
        const mappedEvents = result.events.map(e => mapEventDetailToPropsToEvent(e, eventSource));

        setEvents(mappedEvents)
        setFilteredEvents(mappedEvents)
        // TODO: Update activeFilters based on result.filters if available
      } catch (error) {
        logger.error("Search failed", { error, query })
      } finally {
        setIsLoading(false)
      }
    },
    [userLocation, activeFilters, sortBy],
  )

  // Filter configuration
  const filterGroups = useMemo(
    () => [
      {
        id: "categories",
        label: "Categories",
        type: "checkbox" as const,
        options: [
          { id: "music", label: "Music & Concerts", value: "music", count: 45 },
          { id: "food", label: "Food & Drink", value: "food", count: 32 },
          { id: "arts", label: "Arts & Culture", value: "arts", count: 28 },
          { id: "sports", label: "Sports & Fitness", value: "sports", count: 19 },
          { id: "business", label: "Business & Networking", value: "business", count: 15 },
        ],
      },
      {
        id: "price",
        label: "Price Range",
        type: "range" as const,
        min: 0,
        max: 200,
        step: 5,
      },
      {
        id: "date",
        label: "Date Range",
        type: "date" as const,
      },
      {
        id: "time",
        label: "Time of Day",
        type: "checkbox" as const,
        options: [
          { id: "morning", label: "Morning (6AM-12PM)", value: "morning" },
          { id: "afternoon", label: "Afternoon (12PM-6PM)", value: "afternoon" },
          { id: "evening", label: "Evening (6PM-12AM)", value: "evening" },
          { id: "night", label: "Night (12AM-6AM)", value: "night" },
        ],
      },
      {
        id: "features",
        label: "Features",
        type: "checkbox" as const,
        options: [
          { id: "free", label: "Free Events", value: "free" },
          { id: "outdoor", label: "Outdoor Events", value: "outdoor" },
          { id: "family", label: "Family Friendly", value: "family" },
          { id: "accessible", label: "Wheelchair Accessible", value: "accessible" },
        ],
      },
    ],
    [],
  )

  // Search suggestions
  const searchSuggestions = useMemo(
    () => [
      { id: "1", text: "Jazz concerts tonight", type: "trending" as const, icon: <Sparkles className="h-4 w-4" /> },
      { id: "2", text: "Food festivals this weekend", type: "category" as const },
      { id: "3", text: "Art galleries downtown", type: "location" as const },
      { id: "4", text: "Free outdoor events", type: "event" as const },
      { id: "5", text: "Live music venues", type: "category" as const },
    ],
    [],
  )

  // Apply filters to events
  useEffect(() => {
    let filtered = [...events]

    // Apply search query filter
    if (debouncedSearchQuery) {
      filtered = filtered.filter(
        (event) =>
          event.description?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          event.category?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || // Check against string category
          event.location.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          ((!event.price || (event.price.min === 0)) && "free".includes(debouncedSearchQuery.toLowerCase())) || // Check actual price for free
          (event.price && `${event.price.min}${event.price.max ? '-' + event.price.max : ''} ${event.price.currency}`.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) || // Check formatted price object
          (activeFilters.showFreeEvents && (!event.price || (event.price.min === 0)))
      )
    }

    // Apply category filters
    if (activeFilters.categories?.length > 0) {
      filtered = filtered.filter((event) =>
        activeFilters.categories.some((catFilter: string) => event.category?.toLowerCase() === catFilter.toLowerCase()),
      )
    }

    // Apply price filters
    if (activeFilters.price) {
      filtered = filtered.filter((event) => {
        if (activeFilters.price === "free") {
          return !event.price || (event.price.min === 0); // Check actual price for free
        }
        // TODO: This section needs a robust implementation if activeFilters.price contains ranges like "$10-$20" or "$50+".
        // The current activeFilters.price structure and how it's set by AdvancedFilters component is unknown.
        // For now, this filter will likely not work correctly for non-"free" string values in activeFilters.price.
        // Assuming activeFilters.price might be a string like '10-20' (without currency) or a specific number.
        // This is a placeholder and needs to be revisited once AdvancedFilters is available.
        if (event.price && typeof activeFilters.price === 'string') {
          const filterPriceParts = activeFilters.price.split('-');
          const filterMin = parseFloat(filterPriceParts[0]);
          const filterMax = filterPriceParts.length > 1 ? parseFloat(filterPriceParts[1]) : undefined;

          if (!isNaN(filterMin)) {
            if (event.price.min < filterMin) return false;
            if (filterMax !== undefined && event.price.max && event.price.max > filterMax) return false;
            // If filterMax is undefined, it could mean 'filterMin and above'.
            // If event.price.max is undefined, it means it's a single price, not a range.
            return true;
          }
        }
        return false; // If event has no price or filter is not 'free' and not a parsable string range
      })
    }

    // Apply feature filters
    if (activeFilters.features?.length > 0) {
      filtered = filtered.filter((event) => {
        return activeFilters.features.some((feature: string) => {
          switch (feature) {
            case "free":
              return !event.price || (event.price.min === 0); // Check actual price for free
            case "outdoor":
              return event.description.toLowerCase().includes("outdoor")
            case "family":
              return event.description.toLowerCase().includes("family")
            case "accessible":
              return event.description.toLowerCase().includes("accessible")
            default:
              return false
          }
        })
      })
    }

    // Sort events
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        case "popularity":
          return (b.attendeeCount || 0) - (a.attendeeCount || 0)
        case "distance":
          if (!userLocation || !a.location?.coordinates || !b.location?.coordinates) return 0
          // Calculate distance logic here
          return 0
        default:
          return 0
      }
    })

    setFilteredEvents(filtered)
  }, [events, debouncedSearchQuery, activeFilters, sortBy, userLocation])

  const handleEventSelect = useCallback((event: Event) => {
    setSelectedEvent(event)
    logger.info("Event selected", { eventId: event.id, title: event.title })
  }, [])

  const handleFiltersChange = useCallback((filters: Record<string, any>) => {
    setActiveFilters(filters)
    logger.info("Filters changed", { filters })
  }, [])

  const handleClearFilters = useCallback(() => {
    setActiveFilters({})
    logger.info("Filters cleared")
  }, [])

  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800",
        className,
      )}
    >
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Discover Amazing Events
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Find the perfect events for your next adventure with AI-powered recommendations
          </p>
        </motion.div>

        {/* Enhanced Search */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          {/* <EnhancedSearch
            onSearch={handleSearch}
            suggestions={searchSuggestions}
            placeholder="Search for events, venues, or activities..."
            showFilters={true}
            showVoiceSearch={true}
            className="max-w-4xl mx-auto"
          /> */}
        </motion.div>

        {/* Filters and Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* <AdvancedFilters
              filters={filterGroups}
              activeFilters={activeFilters}
              onFiltersChange={handleFiltersChange}
              onClearAll={handleClearFilters}
            /> */}

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
            >
              <option value="relevance">Most Relevant</option>
              <option value="date">Date</option>
              <option value="distance">Distance</option>
              <option value="popularity">Popularity</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
              <Grid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
              <List className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "map" ? "default" : "outline"} size="sm" onClick={() => setViewMode("map")}>
              <Map className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        {/* Main Content */}
        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="events">Events ({filteredEvents.length})</TabsTrigger>
            <TabsTrigger value="recommendations">Smart Recommendations</TabsTrigger>
            <TabsTrigger value="insights">Your Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-6">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-lg mb-4" />
                      <div className="space-y-2">
                        <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded" />
                        <div className="bg-gray-200 dark:bg-gray-700 h-3 rounded w-3/4" />
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {viewMode === "grid" && <EventCardGrid events={filteredEvents} onEventSelect={handleEventSelect} />}

                  {viewMode === "list" && (
                    <div className="space-y-4">
                      {filteredEvents.map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          onSelect={() => handleEventSelect(event)}
                          className="w-full"
                        />
                      ))}
                    </div>
                  )}

                  {viewMode === "map" && (
                    <div className="h-96 rounded-lg overflow-hidden">
                      <DynamicEventsMap
                        events={filteredEvents as any} // Assuming EventDetail[] is compatible with EventDetailProps[] for now
                        userLocation={userLocation ? { ...userLocation, name: userLocation.name || "Current Location" } : null}
                        selectedEvent={selectedEvent as any} // Assuming EventDetail is compatible with EventDetailProps for now
                        onEventSelect={handleEventSelect as any} // Assuming handleEventSelect signature is compatible for now
                        // onError prop is available in EventsMapProps, can be added if error handling is needed here
                      />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty State */}
            {!isLoading && filteredEvents.length === 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No events found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Try adjusting your search criteria or filters</p>
                <Button onClick={handleClearFilters} variant="outline">
                  Clear Filters
                </Button>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="recommendations">
            <SmartEventRecommendations
              userLocation={userLocation ? { ...userLocation, name: userLocation.name || "Current Location" } : undefined}
              userPreferences={{
                favoriteCategories: ["music", "food"],
                priceRange: "medium",
                timePreference: "evening",
              }}
              recentActivity={events.slice(0, 5)}
              onEventSelect={handleEventSelect}
            />
          </TabsContent>

          <TabsContent value="insights">
            <UserInsightsDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default EnhancedEventsPage
