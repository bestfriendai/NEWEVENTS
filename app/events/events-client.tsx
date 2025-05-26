"use client"

import { useState, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import { MapPin, Search, Navigation, Loader2, AlertTriangle, Calendar, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { logger } from "@/lib/utils/logger"

// Simple event interface to avoid import issues
interface SimpleEvent {
  id: number
  title: string
  description: string
  date: string
  time?: string
  location: string
  address?: string
  category: string
  price: string
  image?: string
  coordinates?: { lat: number; lng: number }
  attendees?: number
  isFavorite?: boolean
  ticketLinks?: Array<{ source: string; link: string }>
  organizer?: {
    name: string
    avatar?: string
  }
}

// Simple map component that doesn't rely on complex imports
function SimpleMap({
  center,
  events,
  selectedEventId,
  onEventSelect,
}: {
  center: { lat: number; lng: number }
  events: SimpleEvent[]
  selectedEventId: number | null
  onEventSelect: (event: SimpleEvent) => void
}) {
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => {
      setMapLoaded(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (mapError) {
    return (
      <div className="h-full bg-gray-900 flex items-center justify-center text-red-400">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
          <p>Map failed to load</p>
        </div>
      </div>
    )
  }

  if (!mapLoaded) {
    return (
      <div className="h-full bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Map background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20" />

      {/* Center indicator */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-4 h-4 bg-purple-500 rounded-full border-2 border-white shadow-lg"></div>
      </div>

      {/* Event markers */}
      {events.map((event, index) => {
        const isSelected = event.id === selectedEventId
        // Position markers around the center
        const angle = (index / events.length) * 2 * Math.PI
        const radius = 100 + Math.random() * 150
        const x = 50 + (Math.cos(angle) * radius) / 10
        const y = 50 + (Math.sin(angle) * radius) / 10

        return (
          <div
            key={event.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 hover:scale-125 ${
              isSelected ? "scale-125 z-10" : ""
            }`}
            style={{ left: `${x}%`, top: `${y}%` }}
            onClick={() => onEventSelect(event)}
          >
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                isSelected ? "bg-purple-500 border-white ring-2 ring-purple-500" : "bg-pink-500 border-white"
              }`}
            >
              <MapPin className="h-3 w-3 text-white" />
            </div>
            {isSelected && (
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs p-2 rounded whitespace-nowrap">
                {event.title}
              </div>
            )}
          </div>
        )
      })}

      {/* Map info */}
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white p-3 rounded-lg">
        <div className="text-sm font-medium">
          📍 {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
        </div>
        <div className="text-xs text-gray-300">{events.length} events found</div>
      </div>
    </div>
  )
}

export function EventsClient() {
  const [events, setEvents] = useState<SimpleEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locationQuery, setLocationQuery] = useState("")
  const [selectedEvent, setSelectedEvent] = useState<SimpleEvent | null>(null)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 39.8283, lng: -98.5795 })
  const [currentLocationName, setCurrentLocationName] = useState<string>("United States")

  // Mock events for testing
  const generateMockEvents = (location: string, coordinates: { lat: number; lng: number }): SimpleEvent[] => {
    const categories = ["Music", "Technology", "Food", "Sports", "Art", "Business"]
    const venues = ["Convention Center", "Park", "Theater", "Stadium", "Gallery", "Hotel"]

    return Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      title: `${categories[i % categories.length]} Event ${i + 1}`,
      description: `Join us for an amazing ${categories[i % categories.length].toLowerCase()} experience in ${location}. This event will feature incredible activities and networking opportunities.`,
      date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      time: `${18 + (i % 6)}:00`,
      location: `${venues[i % venues.length]}`,
      address: `${100 + i} Main St, ${location}`,
      category: categories[i % categories.length],
      price: i % 3 === 0 ? "Free" : `$${25 + i * 15}`,
      coordinates: {
        lat: coordinates.lat + (Math.random() - 0.5) * 0.1,
        lng: coordinates.lng + (Math.random() - 0.5) * 0.1,
      },
      attendees: 50 + Math.floor(Math.random() * 500),
      isFavorite: false,
      ticketLinks: [
        { source: "Ticketmaster", link: "https://ticketmaster.com" },
        { source: "Eventbrite", link: "https://eventbrite.com" },
      ],
      organizer: {
        name: `Event Organizer ${i + 1}`,
        avatar: `/avatar-${(i % 6) + 1}.png`,
      },
    }))
  }

  // Simple geocoding simulation
  const geocodeLocation = async (query: string): Promise<{ lat: number; lng: number; name: string } | null> => {
    const locations: Record<string, { lat: number; lng: number; name: string }> = {
      "new york": { lat: 40.7128, lng: -74.006, name: "New York, NY" },
      "san francisco": { lat: 37.7749, lng: -122.4194, name: "San Francisco, CA" },
      chicago: { lat: 41.8781, lng: -87.6298, name: "Chicago, IL" },
      "los angeles": { lat: 34.0522, lng: -118.2437, name: "Los Angeles, CA" },
      miami: { lat: 25.7617, lng: -80.1918, name: "Miami, FL" },
      seattle: { lat: 47.6062, lng: -122.3321, name: "Seattle, WA" },
      austin: { lat: 30.2672, lng: -97.7431, name: "Austin, TX" },
      denver: { lat: 39.7392, lng: -104.9903, name: "Denver, CO" },
    }

    const key = query.toLowerCase().trim()
    return locations[key] || null
  }

  const handleLocationSearch = useCallback(async () => {
    if (!locationQuery.trim()) return

    setIsLoading(true)
    setError(null)
    setSelectedEvent(null)

    try {
      logger.info("Starting location search", { component: "EventsClient", query: locationQuery })

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Geocode the location
      const geocodedLocation = await geocodeLocation(locationQuery)

      if (!geocodedLocation) {
        throw new Error(
          "Location not found. Try: New York, San Francisco, Chicago, Los Angeles, Miami, Seattle, Austin, or Denver",
        )
      }

      setMapCenter(geocodedLocation)
      setCurrentLocationName(geocodedLocation.name)

      // Generate mock events for this location
      const mockEvents = generateMockEvents(geocodedLocation.name, geocodedLocation)
      setEvents(mockEvents)

      logger.info("Events loaded successfully", {
        component: "EventsClient",
        eventCount: mockEvents.length,
        location: geocodedLocation.name,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to search for events"
      setError(message)
      logger.error("Location search failed", { component: "EventsClient", error: message })
    } finally {
      setIsLoading(false)
    }
  }, [locationQuery])

  const handleCurrentLocation = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setSelectedEvent(null)

    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by this browser")
      }

      logger.info("Getting current location", { component: "EventsClient" })

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: true,
        })
      })

      const { latitude, longitude } = position.coords
      setMapCenter({ lat: latitude, lng: longitude })
      setCurrentLocationName(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`)

      // Generate mock events for current location
      const mockEvents = generateMockEvents("Your Location", { lat: latitude, lng: longitude })
      setEvents(mockEvents)

      logger.info("Events loaded for current location", {
        component: "EventsClient",
        eventCount: mockEvents.length,
        coordinates: { latitude, longitude },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to get current location"
      setError(message)
      logger.error("Current location failed", { component: "EventsClient", error: message })
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleEventSelect = useCallback((event: SimpleEvent) => {
    setSelectedEvent(event)
    if (event.coordinates) {
      setMapCenter(event.coordinates)
    }
    logger.info("Event selected", { component: "EventsClient", eventId: event.id })
  }, [])

  const renderEventsList = () => (
    <div className="space-y-3">
      {events.map((event) => (
        <Card
          key={event.id}
          className={`bg-gray-800/50 border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-colors ${
            selectedEvent?.id === event.id ? "ring-2 ring-purple-500" : ""
          }`}
          onClick={() => handleEventSelect(event)}
        >
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-white text-sm line-clamp-2">{event.title}</h4>
              <Badge variant="outline" className="text-xs text-purple-400 border-purple-500/50 ml-2 flex-shrink-0">
                {event.category}
              </Badge>
            </div>
            <div className="space-y-1 text-xs text-gray-400">
              <div className="flex items-center">
                <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                <span>
                  {event.date} {event.time && `at ${event.time}`}
                </span>
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
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const renderEventDetails = () => {
    if (!selectedEvent) return null

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Event Details</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedEvent(null)}
            className="text-gray-400 hover:text-white"
          >
            ×
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">{selectedEvent.title}</h4>
            <Badge variant="outline" className="text-purple-400 border-purple-500/50 mb-3">
              {selectedEvent.category}
            </Badge>
            <p className="text-sm text-gray-300 leading-relaxed">{selectedEvent.description}</p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start text-gray-400">
              <MapPin className="h-4 w-4 mr-2 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <div>{selectedEvent.location}</div>
                {selectedEvent.address && <div className="text-xs text-gray-500">{selectedEvent.address}</div>}
              </div>
            </div>

            <div className="flex items-center text-gray-400">
              <Calendar className="h-4 w-4 mr-2 text-purple-400 flex-shrink-0" />
              <span>
                {selectedEvent.date} {selectedEvent.time && `at ${selectedEvent.time}`}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold text-purple-400">{selectedEvent.price}</div>
              {selectedEvent.attendees && (
                <div className="flex items-center text-gray-400">
                  <Users className="h-4 w-4 mr-1 text-purple-400" />
                  <span>{selectedEvent.attendees} attending</span>
                </div>
              )}
            </div>
          </div>

          {selectedEvent.organizer && (
            <div className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg">
              <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                <span className="text-purple-400 font-medium">{selectedEvent.organizer.name.charAt(0)}</span>
              </div>
              <div>
                <div className="text-sm font-medium text-white">Organized by</div>
                <div className="text-xs text-gray-400">{selectedEvent.organizer.name}</div>
              </div>
            </div>
          )}

          {selectedEvent.ticketLinks && selectedEvent.ticketLinks.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-white">Get Tickets</h5>
              <div className="space-y-2">
                {selectedEvent.ticketLinks.map((link, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    asChild
                    className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
                  >
                    <a href={link.link} target="_blank" rel="noopener noreferrer">
                      Buy on {link.source}
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="h-[calc(100vh-80px)] bg-[#0F1116] flex overflow-hidden">
      {/* Map Area */}
      <div className="flex-1 relative">
        <SimpleMap
          center={mapCenter}
          events={events}
          selectedEventId={selectedEvent?.id || null}
          onEventSelect={handleEventSelect}
        />
      </div>

      {/* Right Panel */}
      <div className="w-96 bg-[#12141D] border-l border-gray-700 flex flex-col">
        {/* Search Header */}
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-3">Find Events</h2>

          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Try: New York, San Francisco, Chicago..."
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
          </div>

          {currentLocationName !== "United States" && (
            <div className="mt-3 text-sm text-purple-400">📍 {currentLocationName}</div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center mt-3 text-purple-400">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {locationQuery ? "Searching for events..." : "Getting your location..."}
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mt-3">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {selectedEvent ? (
            renderEventDetails()
          ) : events.length > 0 ? (
            <div>
              <h3 className="text-md font-medium text-white mb-3">{events.length} events found</h3>
              {renderEventsList()}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-3" />
              <p>Search for a location to discover events</p>
              <p className="text-sm mt-2 text-gray-400">
                Try: New York, San Francisco, Chicago, Los Angeles, Miami, Seattle, Austin, or Denver
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
