"use client"

import { useState, useCallback } from "react"
import { motion } from "framer-motion"
import { MapPin, Search, Navigation, Loader2, AlertTriangle, Calendar, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { logger } from "@/lib/utils/logger"
import { geocodeLocation, reverseGeocode } from "@/app/actions/location-actions"
import { EventsMap } from "@/components/events-map"

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
// function SimpleMap({
//   center,
//   events,
//   selectedEventId,
//   onEventSelect,
// }: {
//   center: { lat: number; lng: number }
//   events: SimpleEvent[]
//   selectedEventId: number | null
//   onEventSelect: (event: SimpleEvent) => void
// }) {
//   const [mapLoaded, setMapLoaded] = useState(false)
//   const [mapError, setMapError] = useState<string | null>(null)

//   useEffect(() => {
//     // Simulate map loading
//     const timer = setTimeout(() => {
//       setMapLoaded(true)
//     }, 1000)

//     return () => clearTimeout(timer)
//   }, [])

//   if (mapError) {
//     return (
//       <div className="h-full bg-gray-900 flex items-center justify-center text-red-400">
//         <div className="text-center">
//           <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
//           <p>Map failed to load</p>
//         </div>
//       </div>
//     )
//   }

//   if (!mapLoaded) {
//     return (
//       <div className="h-full bg-gray-900 flex items-center justify-center">
//         <div className="text-center text-white">
//           <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
//           <p>Loading map...</p>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
//       {/* Map background */}
//       <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20" />

//       {/* Center indicator */}
//       <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
//         <div className="w-4 h-4 bg-purple-500 rounded-full border-2 border-white shadow-lg"></div>
//       </div>

//       {/* Event markers */}
//       {events.map((event, index) => {
//         const isSelected = event.id === selectedEventId
//         // Position markers around the center
//         const angle = (index / events.length) * 2 * Math.PI
//         const radius = 100 + Math.random() * 150
//         const x = 50 + (Math.cos(angle) * radius) / 10
//         const y = 50 + (Math.sin(angle) * radius) / 10

//         return (
//           <div
//             key={event.id}
//             className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 hover:scale-125 ${
//               isSelected ? "scale-125 z-10" : ""
//             }`}
//             style={{ left: `${x}%`, top: `${y}%` }}
//             onClick={() => onEventSelect(event)}
//           >
//             <div
//               className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
//                 isSelected ? "bg-purple-500 border-white ring-2 ring-purple-500" : "bg-pink-500 border-white"
//               }`}
//             >
//               <MapPin className="h-3 w-3 text-white" />
//             </div>
//             {isSelected && (
//               <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs p-2 rounded whitespace-nowrap">
//                 {event.title}
//               </div>
//             )}
//           </div>
//         )
//       })}

//       {/* Map info */}
//       <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white p-3 rounded-lg">
//         <div className="text-sm font-medium">
//           📍 {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
//         </div>
//         <div className="text-xs text-gray-300">{events.length} events found</div>
//       </div>
//     </div>
//   )
// }

export function EventsClient() {
  const [events, setEvents] = useState<SimpleEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locationQuery, setLocationQuery] = useState("")
  const [selectedEvent, setSelectedEvent] = useState<SimpleEvent | null>(null)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 39.8283, lng: -98.5795 })
  const [currentLocationName, setCurrentLocationName] = useState<string>("United States")
  const [mapLoadError, setMapLoadError] = useState<string | null>(null)

  // Fetch real events from API
  const fetchEventsForLocation = async (
    lat: number,
    lng: number,
    locationName: string,
    retryCount = 0,
  ): Promise<SimpleEvent[]> => {
    try {
      const response = await fetch(`/api/events/enhanced?lat=${lat}&lng=${lng}&radius=25&limit=100`)
      if (!response.ok) {
        if (response.status === 429 && retryCount < 3) {
          // Implement exponential backoff
          const delay = 2 ** retryCount * 1000 // 1s, 2s, 4s
          logger.warn(`Rate limited. Retrying in ${delay}ms`, { component: "EventsClient", retryCount })
          await new Promise((resolve) => setTimeout(resolve, delay))
          return fetchEventsForLocation(lat, lng, locationName, retryCount + 1) // Recursive call
        }
        throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch events")
      }

      // Transform API events to SimpleEvent format
      return data.data.events.map((event: any) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        time: event.time,
        location: event.location,
        address: event.address,
        category: event.category,
        price: event.price,
        coordinates: event.coordinates,
        attendees: event.attendees,
        isFavorite: event.isFavorite,
        ticketLinks: [],
        organizer: event.organizer,
      }))
    } catch (error) {
      logger.error("Failed to fetch events", {
        component: "EventsClient",
        action: "fetchEventsForLocation",
        error: error instanceof Error ? error.message : "Unknown error",
      })
      throw error
    }
  }

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
        component: "EventsClient",
        action: "geocodeLocationServer",
        query,
        error: error instanceof Error ? error.message : "Unknown error",
      })
      return null
    }
  }

  const handleLocationSearch = useCallback(async () => {
    if (!locationQuery.trim()) return

    setIsLoading(true)
    setError(null)
    setSelectedEvent(null)

    try {
      logger.info("Starting location search", { component: "EventsClient", query: locationQuery })

      // Geocode the location using server action
      const geocodedLocation = await geocodeLocationServer(locationQuery)

      if (!geocodedLocation) {
        throw new Error("Location not found. Please try a different search term.")
      }

      setMapCenter(geocodedLocation)
      setCurrentLocationName(geocodedLocation.name)

      // Fetch real events for this location
      const initialEvents = await fetchEventsForLocation(
        geocodedLocation.lat,
        geocodedLocation.lng,
        geocodedLocation.name,
      )
      let allEvents = [...initialEvents]

      // Additional search strategies
      const keywords = ["music", "arts", "sports", "theater", "comedy", "festival"]
      for (const keyword of keywords) {
        const keywordQuery = `${keyword} in ${locationQuery}`
        const keywordGeocodedLocation = await geocodeLocationServer(keywordQuery)

        if (keywordGeocodedLocation) {
          const keywordEvents = await fetchEventsForLocation(
            keywordGeocodedLocation.lat,
            keywordGeocodedLocation.lng,
            keywordGeocodedLocation.name,
          )

          // Combine results, removing duplicates
          allEvents = [...allEvents, ...keywordEvents.filter((event) => !allEvents.find((e) => e.id === event.id))]
        }
      }

      setEvents(allEvents)

      logger.info("Events loaded successfully", {
        component: "EventsClient",
        eventCount: allEvents.length,
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

      // Try to reverse geocode to get a readable location name using server action
      try {
        const result = await reverseGeocode(latitude, longitude)
        if (result.success && result.data) {
          setCurrentLocationName(result.data.name)
        } else {
          setCurrentLocationName(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`)
        }
      } catch {
        setCurrentLocationName(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`)
      }

      // Fetch real events for current location
      const realEvents = await fetchEventsForLocation(latitude, longitude, "Your Location")
      setEvents(realEvents)

      logger.info("Events loaded for current location", {
        component: "EventsClient",
        eventCount: realEvents.length,
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
        {mapLoadError ? (
          <div className="h-full bg-gray-900 flex items-center justify-center text-red-400">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
              <p>Map failed to load</p>
              <p className="text-sm mt-2">{mapLoadError}</p>
            </div>
          </div>
        ) : (
          <EventsMap
            events={events.map(event => ({
              ...event,
              organizer: event.organizer || { name: "Event Organizer", logo: "" }
            }))}
            userLocation={mapCenter ? { lat: mapCenter.lat, lng: mapCenter.lng, name: currentLocationName } : null}
            selectedEvent={selectedEvent ? {
              ...selectedEvent,
              organizer: selectedEvent.organizer || { name: "Event Organizer", logo: "" }
            } : null}
            onEventSelect={(event) => handleEventSelect(event)}
            onError={setMapLoadError}
          />
        )}
      </div>

      {/* Right Panel */}
      <div className="w-96 bg-[#12141D] border-l border-gray-700 flex flex-col">
        {/* Search Header */}
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-3">Find Events</h2>

          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Enter any city, address, or location..."
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
              <p className="text-sm mt-2 text-gray-400">Enter any city, address, or use your current location</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
