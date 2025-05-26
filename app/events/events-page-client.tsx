"use client"

import { useState, useCallback, useEffect, useRef } from "react"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { fetchEvents, type EventSearchResult } from "@/app/actions/event-actions"
import type { EventDetailProps } from "@/components/event-detail-modal"
import { logger } from "@/lib/utils/logger"
import Image from "next/image"

// Real Mapbox Map Component
function MapboxMap({
  center,
  zoom = 12,
  events,
  selectedEventId,
  onEventSelect,
  className,
}: {
  center: { lat: number; lng: number }
  zoom?: number
  events: EventDetailProps[]
  selectedEventId: number | null
  onEventSelect: (event: EventDetailProps) => void
  className?: string
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  // Initialize Mapbox
  useEffect(() => {
    if (typeof window === "undefined") return

    const initializeMap = async () => {
      try {
        const mapboxApiKey = process.env.NEXT_PUBLIC_MAPBOX_API_KEY
        if (!mapboxApiKey) {
          throw new Error("Mapbox API key not configured")
        }

        // Import Mapbox GL
        const mapboxgl = (await import("mapbox-gl")).default
        ;(mapboxgl as any).accessToken = mapboxApiKey

        if (mapContainerRef.current && !mapRef.current) {
          // Create map
          mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: "mapbox://styles/mapbox/dark-v11",
            center: [center.lng, center.lat],
            zoom: zoom,
            projection: { name: "globe" } as any,
          })

          // Add controls
          mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right")
          mapRef.current.addControl(new mapboxgl.FullscreenControl(), "top-right")

          // Map events
          mapRef.current.on("load", () => {
            setMapLoaded(true)
            try {
              mapRef.current.setFog({})
            } catch (e) {
              // Fog not supported, continue
            }
            logger.info("Mapbox map loaded", { component: "MapboxMap" })
          })

          mapRef.current.on("error", (e: any) => {
            logger.error("Mapbox error", { component: "MapboxMap", error: e })
            setMapError("Map failed to load")
          })
        }
      } catch (error) {
        logger.error("Failed to initialize map", { component: "MapboxMap", error })
        setMapError("Failed to load map. Check your Mapbox configuration.")
      }
    }

    initializeMap()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Update map center
  useEffect(() => {
    if (mapRef.current && mapLoaded) {
      mapRef.current.flyTo({
        center: [center.lng, center.lat],
        zoom: zoom,
        duration: 1500,
      })
    }
  }, [center, zoom, mapLoaded])

  // Update markers
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    // Add new markers
    events.forEach((event) => {
      if (!event.coordinates) return

      try {
        const mapboxgl = (window as any).mapboxgl
        const isSelected = event.id === selectedEventId

        // Create marker element
        const el = document.createElement("div")
        el.className = `w-8 h-8 rounded-full border-2 border-white cursor-pointer transition-all duration-200 flex items-center justify-center ${
          isSelected
            ? "bg-purple-500 ring-4 ring-purple-500/50 scale-110 z-50"
            : "bg-pink-500 hover:bg-pink-400 hover:scale-110"
        }`

        el.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        `

        // Create marker
        const marker = new mapboxgl.Marker(el)
          .setLngLat([event.coordinates.lng, event.coordinates.lat])
          .addTo(mapRef.current)

        // Add click handler
        el.addEventListener("click", (e) => {
          e.stopPropagation()
          onEventSelect(event)
        })

        // Create popup
        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: false,
          closeOnClick: false,
        }).setHTML(`
          <div class="p-3 max-w-xs">
            <div class="font-semibold text-sm mb-1 text-gray-900">${event.title}</div>
            <div class="text-xs text-gray-600 mb-1">${event.location}</div>
            <div class="text-xs text-gray-500">${event.date}</div>
            <div class="text-xs font-medium text-purple-600 mt-1">${event.price}</div>
          </div>
        `)

        // Show popup on hover
        el.addEventListener("mouseenter", () => {
          marker.setPopup(popup).togglePopup()
        })

        el.addEventListener("mouseleave", () => {
          popup.remove()
        })

        markersRef.current.push(marker)
      } catch (error) {
        logger.warn("Failed to create marker", { component: "MapboxMap", eventId: event.id })
      }
    })
  }, [events, selectedEventId, mapLoaded, onEventSelect])

  if (mapError) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 text-red-400 ${className}`}>
        <div className="text-center p-8">
          <AlertTriangle className="h-16 w-16 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-white">Map Unavailable</h3>
          <p className="text-gray-300 mb-4">{mapError}</p>
          <Button onClick={() => window.location.reload()} className="bg-purple-600 hover:bg-purple-700">
            Reload Page
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
          <div className="text-center text-white">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
            <p className="text-lg">Loading interactive map...</p>
            <p className="text-sm text-gray-400 mt-2">Powered by Mapbox</p>
          </div>
        </div>
      )}

      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map overlay */}
      {mapLoaded && events.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white">
          <div className="text-sm font-medium">{events.length} events found</div>
          <div className="text-xs text-gray-400">Click markers for details</div>
        </div>
      )}
    </div>
  )
}

export function EventsPageClient() {
  const [events, setEvents] = useState<EventDetailProps[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locationQuery, setLocationQuery] = useState("")
  const [selectedEvent, setSelectedEvent] = useState<EventDetailProps | null>(null)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 39.8283, lng: -98.5795 })
  const [currentLocationName, setCurrentLocationName] = useState<string>("United States")
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Geocoding function
  const geocodeLocation = async (query: string): Promise<{ lat: number; lng: number; name: string } | null> => {
    try {
      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY
      if (!mapboxToken) {
        throw new Error("Mapbox API key not configured")
      }

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&limit=1`,
      )

      if (!response.ok) {
        throw new Error("Geocoding failed")
      }

      const data = await response.json()

      if (data.features && data.features.length > 0) {
        const feature = data.features[0]
        const [lng, lat] = feature.center
        return {
          lat,
          lng,
          name: feature.place_name,
        }
      }

      return null
    } catch (error) {
      logger.error("Geocoding error", { component: "EventsPageClient", error })
      return null
    }
  }

  // Search for events
  const handleLocationSearch = useCallback(async () => {
    if (!locationQuery.trim()) return

    setIsLoading(true)
    setError(null)
    setSelectedEvent(null)

    try {
      logger.info("Starting location search", { component: "EventsPageClient", query: locationQuery })

      // Geocode the location
      const geocodedLocation = await geocodeLocation(locationQuery)

      if (!geocodedLocation) {
        throw new Error("Location not found. Please try a different search term.")
      }

      setMapCenter(geocodedLocation)
      setCurrentLocationName(geocodedLocation.name)

      // Fetch events
      const searchParams = {
        location: `${geocodedLocation.lat},${geocodedLocation.lng}`,
        radius: 50,
        size: 50,
      }

      const result: EventSearchResult = await fetchEvents(searchParams)

      if (result.error && result.events.length === 0) {
        setError(`No events found near ${geocodedLocation.name}. ${result.error.message}`)
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
                lat: geocodedLocation.lat + latOffset,
                lng: geocodedLocation.lng + lngOffset,
              },
            }
          }
          return event
        })

        setEvents(eventsWithCoords)
        logger.info("Events loaded successfully", {
          component: "EventsPageClient",
          eventCount: eventsWithCoords.length,
          source: result.source,
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to search for events"
      setError(message)
      logger.error("Location search failed", { component: "EventsPageClient", error: message })
    } finally {
      setIsLoading(false)
    }
  }, [locationQuery])

  // Get current location
  const handleCurrentLocation = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setSelectedEvent(null)

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
      setMapCenter({ lat: latitude, lng: longitude })

      // Reverse geocode
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_API_KEY}&limit=1`,
        )
        if (response.ok) {
          const data = await response.json()
          if (data.features && data.features.length > 0) {
            setCurrentLocationName(data.features[0].place_name)
          }
        }
      } catch (e) {
        setCurrentLocationName(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`)
      }

      // Fetch events for current location
      const searchParams = {
        location: `${latitude},${longitude}`,
        radius: 50,
        size: 50,
      }

      const result: EventSearchResult = await fetchEvents(searchParams)

      if (result.error && result.events.length === 0) {
        setError(`No events found near your location. ${result.error.message}`)
        setEvents([])
      } else {
        const eventsWithCoords = result.events.map((event) => {
          if (!event.coordinates) {
            const latOffset = (Math.random() - 0.5) * 0.05
            const lngOffset = (Math.random() - 0.5) * 0.05
            return {
              ...event,
              coordinates: {
                lat: latitude + latOffset,
                lng: longitude + lngOffset,
              },
            }
          }
          return event
        })

        setEvents(eventsWithCoords)
        logger.info("Events loaded for current location", {
          component: "EventsPageClient",
          eventCount: eventsWithCoords.length,
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to get current location"
      setError(message)
      logger.error("Current location failed", { component: "EventsPageClient", error: message })
    } finally {
      setIsLoading(false)
    }
  }, [])

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

  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => {
    try {
      const dateA = new Date(`${a.date} ${a.time || "00:00"}`).getTime()
      const dateB = new Date(`${b.date} ${b.time || "00:00"}`).getTime()
      return dateA - dateB
    } catch {
      return 0
    }
  })

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

        <MapboxMap
          center={mapCenter}
          zoom={events.length > 0 ? 12 : 4}
          events={sortedEvents}
          selectedEventId={selectedEvent?.id || null}
          onEventSelect={handleEventSelect}
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
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Find Events</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                  className="text-gray-400 hover:text-white lg:hidden"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Search */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter city, zip, or address"
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

              {error && (
                <Alert variant="destructive" className="mt-3">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}
            </div>

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
                        {sortedEvents.length === 0 ? (
                          <div className="text-center py-12 text-gray-500">
                            <MapPin className="h-16 w-16 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-white mb-2">Discover Events</h3>
                            <p className="text-sm">Search for a location to find amazing events near you</p>
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
