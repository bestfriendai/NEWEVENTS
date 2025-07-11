"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MapPin,
  Search,
  Navigation,
  Loader2,
  AlertTriangle,
  Calendar,
  Users,
  Clock,
  Heart,
  ExternalLink,
  X,
  Menu,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { fetchEvents, testEventAPIs, type EventSearchResult } from "@/app/actions/event-actions"
import type { EventDetailProps } from "@/components/event-detail-modal"
import { logger } from "@/lib/utils/logger"
import Image from "next/image"
import { geocodeLocation, reverseGeocode } from "@/app/actions/location-actions"

// Add CSS for pulse animation
const pulseKeyframes = `
  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 0.3;
    }
    50% {
      transform: scale(1.2);
      opacity: 0.1;
    }
    100% {
      transform: scale(1);
      opacity: 0.3;
    }
  }
`

// Simple Map Fallback Component (no API key required)
function SimpleMapFallback({
  center,
  events,
  selectedEventId,
  onEventSelect,
  userLocation,
  className,
}: {
  center: { lat: number; lng: number }
  events: EventDetailProps[]
  selectedEventId: number | null
  onEventSelect: (event: EventDetailProps) => void
  userLocation?: { lat: number; lng: number; name: string } | null
  className?: string
}) {
  return (
    <div className={`relative bg-gray-900 ${className}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-white p-8">
          <MapPin className="h-16 w-16 mx-auto mb-4 text-purple-400" />
          <h3 className="text-xl font-semibold mb-2">Interactive Map</h3>
          <p className="text-gray-400 mb-4">
            {events.length > 0 ? `${events.length} events found` : "Search for events to see them on the map"}
          </p>
          {userLocation && <div className="text-sm text-purple-400">📍 {userLocation.name}</div>}
        </div>
      </div>

      {/* Event markers overlay */}
      {events.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white">
          <div className="text-sm font-medium">{events.length} events found</div>
          <div className="text-xs text-gray-400">Select events from the sidebar</div>
        </div>
      )}
    </div>
  )
}

interface EventsPageClientProps {
  initialLocation?: { lat: number; lng: number; name: string } | null
  onLocationChange?: () => void
}

export function EventsPageClient({ initialLocation, onLocationChange }: EventsPageClientProps = {}) {
  const [events, setEvents] = useState<EventDetailProps[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locationQuery, setLocationQuery] = useState("")
  const [selectedEvent, setSelectedEvent] = useState<EventDetailProps | null>(null)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 39.8283, lng: -98.5795 })
  const [currentLocationName, setCurrentLocationName] = useState<string>("United States")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [apiStatus, setApiStatus] = useState<any>(null)
  const [searchRadius, setSearchRadius] = useState(25) // Default 25 mile radius
  const [sortBy, setSortBy] = useState("date")

  // Test API status
  const checkApiStatus = useCallback(async () => {
    try {
      const status = await testEventAPIs()
      setApiStatus(status)
    } catch (error) {
      logger.error("Failed to check API status", {
        component: "EventsPageClient",
        error,
      })
    }
  }, [])

  // Real geocoding using server action
  const geocodeLocationServer = async (query: string): Promise<{ lat: number; lng: number; name: string } | null> => {
    try {
      const result = await geocodeLocation(query)
      if (result.success && result.data) {
        return {
          lat: result.data.lat,
          lng: result.data.lng,
          name: result.data.name,
        }
      }
      return null
    } catch (error) {
      logger.error("Geocoding failed", {
        component: "EventsPageClient",
        action: "geocodeLocationServer",
        query,
        error: error instanceof Error ? error.message : "Unknown error",
      })
      return null
    }
  }

  // Search for events
  const searchForEvents = useCallback(async (location: { lat: number; lng: number; name: string }) => {
    setIsLoading(true)
    setError(null)
    setSelectedEvent(null)

    try {
      const searchParams = {
        coordinates: { lat: location.lat, lng: location.lng },
        location: location.name,
        radius: searchRadius,
        size: 50,
        keyword: "events", // Add a general keyword to help find events
      }

      const result: EventSearchResult = await fetchEvents(searchParams)

      if (result.error && result.events.length === 0) {
        setError(`No events found near ${location.name}. ${result.error.message}`)
        setEvents([])
      } else {
        // Add coordinates to events that don't have them
        const eventsWithCoords = result.events.map((event, index) => {
          if (!event.coordinates) {
            const latOffset = (Math.random() - 0.5) * 0.05
            const lngOffset = (Math.random() - 0.5) * 0.05
            return {
              ...event,
              coordinates: {
                lat: location.lat + latOffset,
                lng: location.lng + lngOffset,
              },
            }
          }
          return event
        })

        setEvents(eventsWithCoords)

        if (eventsWithCoords.length === 0) {
          setError(`No events found near ${location.name}. Try searching for a different location or check back later.`)
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to search for events"
      setError(message)
      logger.error("Event search failed", {
        component: "EventsPageClient",
        location: location.name,
        error: err,
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Search for events by location query
  const handleLocationSearch = useCallback(async () => {
    if (!locationQuery.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const geocodedLocation = await geocodeLocationServer(locationQuery)

      if (!geocodedLocation) {
        throw new Error("Location not found. Please try a different search term.")
      }

      setMapCenter(geocodedLocation)
      setCurrentLocationName(geocodedLocation.name)

      await searchForEvents(geocodedLocation)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to search for events"
      setError(message)
      setIsLoading(false)
    }
  }, [locationQuery, searchForEvents])

  // Get current location
  const handleCurrentLocation = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by this browser")
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: true,
        })
      })

      const { latitude, longitude } = position.coords

      // Use server action for reverse geocoding
      const result = await reverseGeocode(latitude, longitude)
      let locationName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`

      if (result.success && result.data) {
        locationName = result.data.name
      }

      const location = { lat: latitude, lng: longitude, name: locationName }
      setMapCenter(location)
      setCurrentLocationName(locationName)

      await searchForEvents(location)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to get current location"
      setError(message)
      setIsLoading(false)
    }
  }, [searchForEvents])

  const handleEventSelect = useCallback((event: EventDetailProps) => {
    setSelectedEvent(event)
    if (event.coordinates) {
      setMapCenter(event.coordinates)
    }
  }, [])

  const handleToggleFavorite = useCallback(
    (eventId: number) => {
      setEvents((prev) =>
        prev.map((event) => (event.id === eventId ? { ...event, isFavorite: !event.isFavorite } : event)),
      )
      if (selectedEvent && selectedEvent.id === eventId) {
        setSelectedEvent((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null))
      }
    },
    [selectedEvent],
  )

  // Sort events based on selected criteria
  const sortedEvents = [...events].sort((a, b) => {
    try {
      switch (sortBy) {
        case "date":
          const dateA = new Date(`${a.date} ${a.time || "00:00"}`).getTime()
          const dateB = new Date(`${b.date} ${b.time || "00:00"}`).getTime()
          return dateA - dateB

        case "distance":
          if (!mapCenter || !a.coordinates || !b.coordinates) return 0
          const distanceA = calculateDistance(mapCenter.lat, mapCenter.lng, a.coordinates.lat, a.coordinates.lng)
          const distanceB = calculateDistance(mapCenter.lat, mapCenter.lng, b.coordinates.lat, b.coordinates.lng)
          return distanceA - distanceB

        case "popularity":
          return (b.attendees || 0) - (a.attendees || 0)

        case "price":
          const priceA = extractPriceValue(a.price)
          const priceB = extractPriceValue(b.price)
          return priceA - priceB

        default:
          return 0
      }
    } catch {
      return 0
    }
  })

  // Helper function to extract numeric price value
  const extractPriceValue = (price: string): number => {
    if (price.toLowerCase().includes("free")) return 0
    const match = price.match(/\$(\d+(?:\.\d{2})?)/)
    return match ? Number.parseFloat(match[1]) : 999999
  }

  // Helper function to calculate distance in miles using haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 3959 // Earth's radius in miles
    const dLat = (lat2 - lat1) * (Math.PI / 180)
    const dLng = (lng2 - lng1) * (Math.PI / 180)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Initialize with provided location
  useEffect(() => {
    if (initialLocation) {
      setMapCenter({ lat: initialLocation.lat, lng: initialLocation.lng })
      setCurrentLocationName(initialLocation.name)
      searchForEvents(initialLocation)
    }
  }, [initialLocation, searchForEvents])

  // Check API status on mount
  useEffect(() => {
    checkApiStatus()
  }, [checkApiStatus])

  // Add location change button to the sidebar header
  const renderLocationHeader = () => (
    <div className="p-4 border-b border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Find Events</h2>
        <div className="flex items-center gap-2">
          {onLocationChange && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onLocationChange}
              className="text-gray-400 hover:text-white"
              title="Change location"
            >
              <MapPin className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="text-gray-400 hover:text-white lg:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Show current location */}
      {currentLocationName !== "United States" && (
        <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-purple-400">
              <MapPin className="h-4 w-4 mr-2" />
              <span>📍 {currentLocationName}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => searchForEvents({ lat: mapCenter.lat, lng: mapCenter.lng, name: currentLocationName })}
              className="text-purple-400 hover:text-purple-300"
              disabled={isLoading}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Search Interface */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Search different location..."
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleLocationSearch()}
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
            disabled={isLoading}
          />
          <Button
            onClick={handleLocationSearch}
            disabled={isLoading || !locationQuery.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <Button
          onClick={handleCurrentLocation}
          variant="outline"
          className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
          disabled={isLoading}
        >
          <Navigation className="h-4 w-4 mr-2" />
          Use Current Location
        </Button>

        {/* Search Radius Selector */}
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-400">Search Radius</label>
          <div className="flex items-center gap-2">
            <select
              value={searchRadius}
              onChange={(e) => setSearchRadius(Number(e.target.value))}
              className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
            >
              <option value={10}>10 miles</option>
              <option value={25}>25 miles</option>
              <option value={50}>50 miles</option>
              <option value={100}>100 miles</option>
            </select>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => searchForEvents({ lat: mapCenter.lat, lng: mapCenter.lng, name: currentLocationName })}
              className="text-purple-400 hover:text-purple-300 p-1"
              disabled={isLoading}
              title="Refresh with new radius"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-400">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
          >
            <option value="date">Date</option>
            <option value="distance">Distance</option>
            <option value="popularity">Popularity</option>
            <option value="price">Price</option>
          </select>
        </div>
      </div>

      {/* API Status */}
      {apiStatus && (
        <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
          <div className="text-xs text-gray-400 mb-2">API Status:</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(apiStatus).map(([api, status]) => {
              if (api === "errors") return null
              return (
                <div key={api} className="flex items-center justify-between">
                  <span className="capitalize text-gray-400">{api}</span>
                  <div className={`w-2 h-2 rounded-full ${status ? "bg-green-400" : "bg-red-400"}`} />
                </div>
              )
            })}
          </div>
          {apiStatus.errors && apiStatus.errors.length > 0 && (
            <div className="mt-2 text-xs text-red-400">Issues: {apiStatus.errors.join(", ")}</div>
          )}
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mt-3">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )

  return (
    <div className="h-screen bg-[#0F1116] flex overflow-hidden">
      {/* Map Area */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-20 flex items-center justify-center">
            <div className="text-center text-white">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Finding events...</p>
            </div>
          </div>
        )}

        <SimpleMapFallback
          center={mapCenter}
          events={sortedEvents}
          selectedEventId={selectedEvent?.id || null}
          onEventSelect={handleEventSelect}
          userLocation={initialLocation}
          className="h-full w-full"
        />

        {/* Mobile menu button */}
        {!sidebarOpen && (
          <Button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-4 left-4 z-10 bg-purple-600 hover:bg-purple-700 lg:hidden"
            size="sm"
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full md:w-96 bg-[#12141D] border-l border-gray-700 flex flex-col shadow-2xl"
          >
            {/* Header */}
            {renderLocationHeader()}

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                {selectedEvent ? (
                  /* Event Details */
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full flex flex-col"
                  >
                    <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">Event Details</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedEvent(null)}
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <ScrollArea className="flex-1">
                      <div className="p-4 space-y-4">
                        {selectedEvent.image && (
                          <div className="relative h-48 w-full rounded-lg overflow-hidden">
                            <Image
                              src={selectedEvent.image || "/placeholder.svg"}
                              alt={selectedEvent.title}
                              fill
                              className="object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = "none"
                              }}
                            />
                          </div>
                        )}

                        <div>
                          <h4 className="text-xl font-bold text-white mb-2">{selectedEvent.title}</h4>
                          <Badge variant="outline" className="border-purple-500 text-purple-400 mb-3">
                            {selectedEvent.category}
                          </Badge>
                          <p className="text-sm text-gray-300 leading-relaxed">{selectedEvent.description}</p>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center text-sm text-gray-400">
                            <Calendar className="h-4 w-4 mr-2 text-purple-400" />
                            {selectedEvent.date}
                          </div>
                          {selectedEvent.time && (
                            <div className="flex items-center text-sm text-gray-400">
                              <Clock className="h-4 w-4 mr-2 text-purple-400" />
                              {selectedEvent.time}
                            </div>
                          )}
                          <div className="flex items-start text-sm text-gray-400">
                            <MapPin className="h-4 w-4 mr-2 text-purple-400 mt-0.5" />
                            <div>
                              <div>{selectedEvent.location}</div>
                              {selectedEvent.address && (
                                <div className="text-xs text-gray-500">{selectedEvent.address}</div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-lg font-semibold text-purple-400">{selectedEvent.price}</div>
                          {selectedEvent.attendees && (
                            <div className="flex items-center text-sm text-gray-400">
                              <Users className="h-4 w-4 mr-1 text-purple-400" />
                              {selectedEvent.attendees} attending
                            </div>
                          )}
                        </div>

                        {selectedEvent.organizer && (
                          <div className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg">
                            <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                              <span className="text-purple-400 font-medium">
                                {selectedEvent.organizer.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">Organized by</div>
                              <div className="text-xs text-gray-400">{selectedEvent.organizer.name}</div>
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Button
                            onClick={() => handleToggleFavorite(selectedEvent.id)}
                            variant="outline"
                            className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
                          >
                            <Heart
                              className={`h-4 w-4 mr-2 ${selectedEvent.isFavorite ? "fill-red-500 text-red-500" : ""}`}
                            />
                            {selectedEvent.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                          </Button>

                          {selectedEvent.ticketLinks && selectedEvent.ticketLinks.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="text-sm font-medium text-white">Get Tickets</h5>
                              {selectedEvent.ticketLinks.map((link, i) => (
                                <Button
                                  key={i}
                                  variant="outline"
                                  size="sm"
                                  asChild
                                  className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
                                >
                                  <a href={link.link} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3 w-3 mr-2" />
                                    {link.source}
                                  </a>
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </ScrollArea>
                  </motion.div>
                ) : (
                  /* Events List */
                  <motion.div
                    key="list"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="h-full flex flex-col"
                  >
                    {sortedEvents.length > 0 && (
                      <div className="p-4 border-b border-gray-700">
                        <h3 className="text-md font-medium text-white">{sortedEvents.length} events found</h3>
                      </div>
                    )}

                    <ScrollArea className="flex-1">
                      <div className="p-4">
                        {sortedEvents.length === 0 && !isLoading ? (
                          <div className="text-center py-12 text-gray-500">
                            <MapPin className="h-16 w-16 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-white mb-2">No Events Found</h3>
                            <p className="text-sm mb-4">
                              {error ? "There was an issue finding events." : "No events found in this area."}
                            </p>
                            <Button
                              onClick={() =>
                                searchForEvents({ lat: mapCenter.lat, lng: mapCenter.lng, name: currentLocationName })
                              }
                              variant="outline"
                              className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Try Again
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {sortedEvents.map((event) => (
                              <Card
                                key={event.id}
                                className={`bg-gray-800/50 border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-all duration-200 ${
                                  selectedEvent?.id === event.id ? "ring-2 ring-purple-500" : ""
                                }`}
                                onClick={() => handleEventSelect(event)}
                              >
                                <CardContent className="p-4">
                                  <div className="flex gap-3">
                                    {event.image && (
                                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                        <Image
                                          src={event.image || "/placeholder.svg"}
                                          alt={event.title}
                                          width={64}
                                          height={64}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement
                                            target.style.display = "none"
                                          }}
                                        />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between mb-2">
                                        <h4 className="font-medium text-white text-sm line-clamp-2">{event.title}</h4>
                                        <Badge
                                          variant="outline"
                                          className="text-xs text-purple-400 border-purple-500/50 ml-2 flex-shrink-0"
                                        >
                                          {event.category}
                                        </Badge>
                                      </div>
                                      <div className="space-y-1 text-xs text-gray-400">
                                        <div className="flex items-center">
                                          <Calendar className="h-3 w-3 mr-1" />
                                          <span>
                                            {event.date} {event.time && `at ${event.time}`}
                                          </span>
                                        </div>
                                        <div className="flex items-center">
                                          <MapPin className="h-3 w-3 mr-1" />
                                          <span className="truncate">{event.location}</span>
                                          {sortBy === "distance" && event.coordinates && mapCenter && (
                                            <span className="ml-2 text-xs text-purple-400">
                                              {Math.round(
                                                calculateDistance(
                                                  mapCenter.lat,
                                                  mapCenter.lng,
                                                  event.coordinates.lat,
                                                  event.coordinates.lng,
                                                ) * 10,
                                              ) / 10}{" "}
                                              mi
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="font-medium text-purple-400">{event.price}</span>
                                          {event.attendees && (
                                            <div className="flex items-center text-gray-500">
                                              <Users className="h-3 w-3 mr-1" />
                                              <span>{event.attendees}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
