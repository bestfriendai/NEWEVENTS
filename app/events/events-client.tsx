"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Calendar, Search, Filter, MapPin, X, Menu } from "lucide-react"
import { fetchEvents } from "@/app/actions/event-actions"
import { useLocationContext } from "@/contexts/LocationContext"
import { EventsMap } from "@/components/events/EventsMap"
import { EventFilters, type EventFilters as EventFiltersType } from "@/components/events/EventFilters"
import { EventCardGridSkeleton } from "@/components/ui/event-skeleton"
import { EventDetailModal } from "@/components/event-detail-modal"
import type { EventDetailProps } from "@/components/event-detail-modal"
import { logger } from "@/lib/utils/logger"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export function EventsClient() {
  const { userLocation, searchLocation } = useLocationContext()
  const [events, setEvents] = useState<EventDetailProps[]>([])
  const [filteredEvents, setFilteredEvents] = useState<EventDetailProps[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EventDetailProps | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [locationQuery, setLocationQuery] = useState("")
  const [filters, setFilters] = useState<EventFiltersType>({
    categories: [],
    dateRange: null,
    priceRange: { min: 0, max: 500 },
    distance: 50,
    searchQuery: '',
    sortBy: 'date',
    sortOrder: 'asc'
  })

  const loadEventsNearLocation = useCallback(async () => {
    if (!userLocation) return

    setLoading(true)
    try {
      logger.info("Loading events near location", {
        component: "EventsClient",
        action: "load_events_start",
        metadata: { location: userLocation }
      })

      const searchParams: any = {
        location: `${userLocation.lat},${userLocation.lng}`,
        radius: filters.distance,
        size: 50, // Load more events for better map display
      }

      // Only include optional properties if they have values
      if (filters.dateRange?.start) {
        searchParams.startDate = filters.dateRange.start.toISOString().split('T')[0]
      }
      if (filters.dateRange?.end) {
        searchParams.endDate = filters.dateRange.end.toISOString().split('T')[0]
      }
      if (filters.searchQuery) {
        searchParams.keyword = filters.searchQuery
      }

      const result = await fetchEvents(searchParams)

      if (result.events) {
        // Add coordinates to events if they don't have them
        const eventsWithCoords = result.events.map((event) => {
          if (!event.coordinates) {
            // Generate deterministic coordinates near the user location
            const seed = event.id.toString()
            const hash = seed.split('').reduce((a, b) => {
              a = ((a << 5) - a) + b.charCodeAt(0)
              return a & a
            }, 0)

            const latOffset = ((hash % 1000) / 1000 - 0.5) * 0.1 // ~5km radius
            const lngOffset = (((hash >> 10) % 1000) / 1000 - 0.5) * 0.1

            return {
              ...event,
              coordinates: {
                lat: userLocation.lat + latOffset,
                lng: userLocation.lng + lngOffset
              },
            }
          }
          return event
        })

        setEvents(eventsWithCoords)

        logger.info("Events loaded successfully", {
          component: "EventsClient",
          action: "load_events_success",
          metadata: {
            eventCount: eventsWithCoords.length,
            source: result.source,
            hasError: !!result.error
          }
        })

        if (result.error) {
          logger.warn("Events loaded with fallback data", {
            component: "EventsClient",
            action: "load_events_fallback",
            metadata: { error: result.error }
          })
        }
      }
    } catch (error) {
      logger.error("Failed to load events", {
        component: "EventsClient",
        action: "load_events_error",
        metadata: { location: userLocation }
      }, error instanceof Error ? error : new Error("Unknown error"))
    } finally {
      setLoading(false)
    }
  }, [userLocation, filters.distance, filters.dateRange, filters.searchQuery])

  // Load events when location changes
  useEffect(() => {
    if (userLocation) {
      loadEventsNearLocation()
    }
  }, [userLocation, loadEventsNearLocation])

  // Apply filters to events
  useEffect(() => {
    let filtered = [...events]

    // Category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter(event => filters.categories.includes(event.category))
    }

    // Search query filter
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query) ||
        event.category.toLowerCase().includes(query)
      )
    }

    // Price filter (basic implementation)
    filtered = filtered.filter(event => {
      if (event.price === "Free") return filters.priceRange.min === 0
      // Extract price from string like "$50" or "$25 - $100"
      const priceMatch = event.price.match(/\$(\d+)/)
      if (priceMatch && priceMatch[1]) {
        const price = parseInt(priceMatch[1])
        return price >= filters.priceRange.min && price <= filters.priceRange.max
      }
      return true // Include events with unclear pricing
    })

    // Sort events
    filtered.sort((a, b) => {
      let comparison = 0

      switch (filters.sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
        case 'popularity':
          comparison = (typeof a.attendees === 'number' ? a.attendees : 0) -
                      (typeof b.attendees === 'number' ? b.attendees : 0)
          break
        case 'distance':
          // Calculate distance from user location if available
          if (userLocation && a.coordinates && b.coordinates) {
            const distA = Math.sqrt(
              Math.pow(a.coordinates.lat - userLocation.lat, 2) +
              Math.pow(a.coordinates.lng - userLocation.lng, 2)
            )
            const distB = Math.sqrt(
              Math.pow(b.coordinates.lat - userLocation.lat, 2) +
              Math.pow(b.coordinates.lng - userLocation.lng, 2)
            )
            comparison = distA - distB
          }
          break
        case 'price':
          // Basic price comparison
          const priceA = a.price === "Free" ? 0 : parseInt(a.price.match(/\$(\d+)/)?.[1] || "0")
          const priceB = b.price === "Free" ? 0 : parseInt(b.price.match(/\$(\d+)/)?.[1] || "0")
          comparison = priceA - priceB
          break
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison
    })

    setFilteredEvents(filtered)

    logger.debug("Events filtered", {
      component: "EventsClient",
      action: "events_filtered",
      metadata: {
        originalCount: events.length,
        filteredCount: filtered.length,
        filters
      }
    })
  }, [events, filters, userLocation])

  const handleLocationSearch = async () => {
    if (!locationQuery.trim()) return

    try {
      await searchLocation(locationQuery)
      setLocationQuery("")
    } catch (error) {
      logger.error("Location search failed", {
        component: "EventsClient",
        action: "location_search_error"
      }, error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  const handleEventSelect = useCallback((event: EventDetailProps) => {
    setSelectedEvent(event)
    setShowModal(true)

    logger.info("Event selected", {
      component: "EventsClient",
      action: "event_select",
      metadata: { eventId: event.id, title: event.title }
    })
  }, [])

  const handleFiltersChange = (newFilters: EventFiltersType) => {
    setFilters(newFilters)

    // If location-based filters changed, reload events
    if (newFilters.distance !== filters.distance ||
        newFilters.dateRange !== filters.dateRange ||
        newFilters.searchQuery !== filters.searchQuery) {
      loadEventsNearLocation()
    }
  }

  return (
    <div className="h-screen bg-[#0F1116] flex overflow-hidden">
      {/* Left Sidebar */}
      <div className={`${sidebarOpen ? 'w-96' : 'w-0'} transition-all duration-300 bg-[#1A1D23] border-r border-gray-800 flex flex-col overflow-hidden`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-white">Events Nearby</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-white lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Location Search */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search for a location..."
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLocationSearch()}
                  className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                />
              </div>
              <Button onClick={handleLocationSearch} size="sm" className="bg-purple-600 hover:bg-purple-700">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {userLocation && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{userLocation.name}</span>
              </div>
            )}
          </div>

          {/* Search Radius */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Search Radius</span>
              <span className="text-white">{filters.distance} miles</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">Filters</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="text-gray-400 hover:text-white"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Active Filters */}
          {(filters.categories.length > 0 || filters.searchQuery) && (
            <div className="flex flex-wrap gap-1 mb-3">
              {filters.categories.map(category => (
                <Badge key={category} variant="secondary" className="text-xs">
                  {category}
                </Badge>
              ))}
              {filters.searchQuery && (
                <Badge variant="secondary" className="text-xs">
                  &quot;{filters.searchQuery}&quot;
                </Badge>
              )}
            </div>
          )}

          {showFilters && (
            <EventFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              isOpen={true}
              onToggle={() => setShowFilters(false)}
            />
          )}
        </div>

        {/* Events List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white">
                {loading ? "Loading..." : `${filteredEvents.length} events`}
              </h3>
              <span className="text-xs text-gray-400">
                Showing {Math.min(filteredEvents.length, 50)} of {filteredEvents.length}
              </span>
            </div>

            {loading ? (
              <div className="space-y-4">
                <EventCardGridSkeleton count={6} />
              </div>
            ) : filteredEvents.length > 0 ? (
              <div className="space-y-3">
                {filteredEvents.slice(0, 50).map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors"
                    onClick={() => handleEventSelect(event)}
                  >
                    <div className="flex gap-3">
                      {event.image && (
                        <div
                          className="w-16 h-16 rounded-lg bg-cover bg-center flex-shrink-0"
                          style={{ backgroundImage: `url(${event.image})` }}
                          role="img"
                          aria-label={event.title}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white text-sm line-clamp-2 mb-1">
                          {event.title}
                        </h4>
                        <p className="text-xs text-gray-400 mb-2">
                          {event.date} • {event.time}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 truncate">
                            {event.location}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {event.category}
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-sm font-medium text-purple-400">
                            {event.price}
                          </span>
                          {typeof event.attendees === 'number' && (
                            <span className="text-xs text-gray-400">
                              {event.attendees.toLocaleString()} attending
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : userLocation ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <h3 className="text-sm font-medium text-white mb-2">No Events Found</h3>
                <p className="text-xs text-gray-400">
                  Try adjusting your filters or search radius.
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <h3 className="text-sm font-medium text-white mb-2">Search for Events</h3>
                <p className="text-xs text-gray-400">
                  Enter a location to find events near you.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Map */}
      <div className="flex-1 relative">
        {/* Mobile Menu Button */}
        {!sidebarOpen && (
          <Button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-4 left-4 z-10 bg-purple-600 hover:bg-purple-700"
            size="sm"
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}

        {/* Map */}
        {userLocation ? (
          <EventsMap
            userLocation={userLocation}
            events={filteredEvents}
            onEventSelect={handleEventSelect}
            className="h-full w-full"
          />
        ) : (
          <div className="h-full w-full bg-gray-900 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-medium text-white mb-2">Find Events Near You</h3>
              <p className="text-gray-400 mb-6">
                Search for a location to see events on the map
              </p>
              <Button
                onClick={() => setSidebarOpen(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Search Location
              </Button>
            </div>
          </div>
        )}

        {/* Map Footer */}
        {userLocation && (
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3 flex items-center justify-between">
              <div className="text-white text-sm">
                <span className="font-medium">{filteredEvents.length}</span> events found
                {userLocation.name && (
                  <span className="text-gray-400 ml-2">in {userLocation.name}</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Filter
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 lg:hidden"
                >
                  <Menu className="h-4 w-4 mr-1" />
                  Events
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          isOpen={showModal}
          onClose={() => {
            setShowModal(false)
            setSelectedEvent(null)
          }}
          onFavorite={() => {
            logger.info("Favorite toggled from modal", {
              component: "EventsClient",
              action: "modal_favorite_toggle",
              metadata: { eventId: selectedEvent.id }
            })
          }}
        />
      )}
    </div>
  )
}
