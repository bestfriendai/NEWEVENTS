"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Grid, List, Map, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EnhancedSearch } from "@/components/ui/enhanced-search"
import { AdvancedFilters } from "@/components/ui/advanced-filters"
import { SmartEventRecommendations } from "@/components/events/SmartEventRecommendations"
import { EventCard, EventCardGrid } from "@/components/events/EventCard"
import { EventsMap } from "@/components/events/EventsMap"
import { UserInsightsDashboard } from "@/components/analytics/UserInsightsDashboard"
import { useLocationContext } from "@/contexts/LocationContext"
import { useDebounce } from "@/hooks/use-debounce"
import { searchEvents } from "@/lib/api/events-api"
import { performanceMonitor, ImageOptimizer } from "@/lib/performance/optimization"
import { logger } from "@/lib/utils/logger"
import { cn } from "@/lib/utils"
import type { EventDetail } from "@/types/event.types"

interface EnhancedEventsPageProps {
  initialEvents?: EventDetail[]
  className?: string
}

export function EnhancedEventsPage({ initialEvents = [], className }: EnhancedEventsPageProps) {
  // State management
  const [events, setEvents] = useState<EventDetail[]>(initialEvents)
  const [filteredEvents, setFilteredEvents] = useState<EventDetail[]>(initialEvents)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({})
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid")
  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null)
  const [sortBy, setSortBy] = useState<"relevance" | "date" | "distance" | "popularity">("relevance")

  // Hooks
  const { userLocation, isLocationLoading } = useLocationContext()
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Performance monitoring
  useEffect(() => {
    performanceMonitor.recordMetric("page_load", Date.now())

    // Preload critical images
    const criticalImages = events
      .slice(0, 6)
      .map((event) => event.image)
      .filter(Boolean)
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
        setEvents(result.events)
        setFilteredEvents(result.events)

        performanceMonitor.recordMetric("search_response_time", Date.now())
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
          event.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          event.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          event.category.toLowerCase().includes(debouncedSearchQuery.toLowerCase()),
      )
    }

    // Apply category filters
    if (activeFilters.categories?.length > 0) {
      filtered = filtered.filter((event) =>
        activeFilters.categories.some((cat: string) => event.category.toLowerCase().includes(cat.toLowerCase())),
      )
    }

    // Apply price filters
    if (activeFilters.price) {
      const [minPrice, maxPrice] = activeFilters.price
      filtered = filtered.filter((event) => {
        if (event.price.toLowerCase() === "free") return minPrice === 0
        const price = Number.parseFloat(event.price.replace(/[^0-9.]/g, ""))
        return price >= minPrice && price <= maxPrice
      })
    }

    // Apply feature filters
    if (activeFilters.features?.length > 0) {
      filtered = filtered.filter((event) => {
        return activeFilters.features.some((feature: string) => {
          switch (feature) {
            case "free":
              return event.price.toLowerCase() === "free"
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
          return b.attendees - a.attendees
        case "distance":
          if (!userLocation || !a.coordinates || !b.coordinates) return 0
          // Calculate distance logic here
          return 0
        default:
          return 0
      }
    })

    setFilteredEvents(filtered)
  }, [events, debouncedSearchQuery, activeFilters, sortBy, userLocation])

  const handleEventSelect = useCallback((event: EventDetail) => {
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
          <EnhancedSearch
            onSearch={handleSearch}
            suggestions={searchSuggestions}
            placeholder="Search for events, venues, or activities..."
            showFilters={true}
            showVoiceSearch={true}
            className="max-w-4xl mx-auto"
          />
        </motion.div>

        {/* Filters and Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <AdvancedFilters
              filters={filterGroups}
              activeFilters={activeFilters}
              onFiltersChange={handleFiltersChange}
              onClearAll={handleClearFilters}
            />

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
                      <EventsMap
                        events={filteredEvents}
                        selectedEvent={selectedEvent}
                        onEventClick={handleEventSelect}
                        center={userLocation ? [userLocation.lng, userLocation.lat] : undefined}
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
              userLocation={userLocation}
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
