"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Calendar,
  Loader2,
  MapPin,
  Clock,
  Users,
  Navigation,
  ChevronRight,
  Heart,
  Filter,
  Zap,
  Music,
  Palette,
  Trophy,
  Coffee,
  Briefcase,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { fetchEvents } from "@/app/actions/event-actions"
import { geocodeAddress } from "@/lib/utils/geocoding"
import { MAPBOX_API_KEY } from "@/lib/env"
import type { EventDetailProps } from "@/components/event-detail-modal"
import { EventDetailModal } from "@/components/event-detail-modal"
import { cn } from "@/lib/utils"

// Featured event for initial display
const FEATURED_EVENT: EventDetailProps = {
  id: 999,
  title: "Summer Music Festival 2024",
  description:
    "Join thousands of music lovers for the biggest summer festival featuring world-renowned artists, food trucks, and unforgettable experiences.",
  category: "Music",
  date: "July 20-22, 2024",
  time: "2:00 PM - 11:00 PM",
  location: "Central Park, New York",
  address: "Central Park, New York, NY 10024",
  price: "$89 - $299",
  image: "/hero-events-collage.png",
  organizer: {
    name: "NYC Events",
    avatar: "/avatar-1.png",
  },
  attendees: 15000,
  isFavorite: false,
  coordinates: { lat: 40.7829, lng: -73.9654 },
}

const CATEGORY_ICONS = {
  Music: Music,
  Arts: Palette,
  Sports: Trophy,
  Food: Coffee,
  Business: Briefcase,
  Event: Zap,
}

interface UserLocation {
  lat: number
  lng: number
  name: string
}

function FeaturedEventHero({ event, onExplore }: { event: EventDetailProps; onExplore: () => void }) {
  return (
    <div className="relative h-[60vh] min-h-[500px] overflow-hidden rounded-2xl">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img src={event.image || "/placeholder.svg"} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <Badge className="bg-purple-600/90 text-white mb-4 text-sm px-3 py-1">⭐ Featured Event</Badge>

              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">{event.title}</h1>

              <p className="text-xl text-gray-200 mb-8 leading-relaxed">{event.description}</p>

              <div className="flex flex-wrap items-center gap-6 mb-8 text-white">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-purple-400" />
                  <span className="font-medium">{event.date}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-purple-400" />
                  <span className="font-medium">{event.time}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-purple-400" />
                  <span className="font-medium">{event.location}</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-400" />
                  <span className="font-medium">{event.attendees.toLocaleString()} attending</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg font-semibold"
                  onClick={onExplore}
                >
                  Explore Events Near You
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 px-8 py-3 text-lg backdrop-blur-sm"
                >
                  Learn More
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Floating Stats */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="absolute top-8 right-8 bg-white/10 backdrop-blur-md rounded-xl p-6 text-white hidden lg:block"
      >
        <div className="text-center">
          <div className="text-3xl font-bold text-purple-400">{event.attendees.toLocaleString()}</div>
          <div className="text-sm text-gray-300">People Attending</div>
        </div>
        <Separator className="my-4 bg-white/20" />
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{event.price}</div>
          <div className="text-sm text-gray-300">Ticket Price</div>
        </div>
      </motion.div>
    </div>
  )
}

function LocationSearchSection({
  onLocationSelect,
  isLoading,
}: {
  onLocationSelect: (location: UserLocation) => void
  isLoading: boolean
}) {
  const [locationInput, setLocationInput] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  const handleLocationSearch = async () => {
    if (!locationInput.trim()) return

    setIsSearching(true)
    try {
      const result = await geocodeAddress(locationInput)
      if (result) {
        onLocationSelect({
          lat: result.lat,
          lng: result.lng,
          name: result.address,
        })
      }
    } catch (error) {
      console.error("Location search failed:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsSearching(true)
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          try {
            // You could reverse geocode here to get the address
            onLocationSelect({
              lat: latitude,
              lng: longitude,
              name: "Your Current Location",
            })
          } catch (error) {
            console.error("Failed to get location name:", error)
            onLocationSelect({
              lat: latitude,
              lng: longitude,
              name: "Your Current Location",
            })
          } finally {
            setIsSearching(false)
          }
        },
        (error) => {
          console.error("Geolocation error:", error)
          setIsSearching(false)
        },
      )
    }
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">Find Events Near You</h2>
        <p className="text-gray-300 text-lg">Enter your location to discover amazing events happening in your area</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Enter your city, address, or zip code..."
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleLocationSearch()}
              className="pl-12 h-14 bg-white/10 border-white/20 text-white placeholder-gray-400 text-lg backdrop-blur-sm"
              disabled={isLoading || isSearching}
            />
          </div>
          <Button
            onClick={handleLocationSearch}
            disabled={!locationInput.trim() || isLoading || isSearching}
            size="lg"
            className="bg-purple-600 hover:bg-purple-700 px-8 h-14"
          >
            {isSearching ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Search className="h-5 w-5 mr-2" />
                Search
              </>
            )}
          </Button>
        </div>

        <div className="text-center">
          <Button
            variant="outline"
            onClick={handleGetCurrentLocation}
            disabled={isLoading || isSearching}
            className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
          >
            <Navigation className="h-4 w-4 mr-2" />
            Use My Current Location
          </Button>
        </div>
      </div>
    </div>
  )
}

function EventsMap({
  userLocation,
  events,
  onEventSelect,
}: {
  userLocation: UserLocation | null
  events: EventDetailProps[]
  onEventSelect: (event: EventDetailProps) => void
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const userMarkerRef = useRef<any>(null)
  const eventMarkersRef = useRef<any[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || typeof window === "undefined") return

    const script = document.createElement("script")
    script.src = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"
    script.onload = () => {
      const link = document.createElement("link")
      link.href = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css"
      link.rel = "stylesheet"
      document.head.appendChild(link)

      const mapboxgl = (window as any).mapboxgl
      mapboxgl.accessToken = MAPBOX_API_KEY

      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [-74.006, 40.7128], // Default to NYC
        zoom: 10,
      })

      mapRef.current.addControl(new mapboxgl.NavigationControl())
      mapRef.current.on("load", () => setMapLoaded(true))
    }
    document.body.appendChild(script)

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
      }
    }
  }, [])

  // Update user location marker
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !userLocation) return

    // Remove existing user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove()
    }

    // Create user marker
    const el = document.createElement("div")
    el.className = "user-marker"
    el.style.width = "20px"
    el.style.height = "20px"
    el.style.borderRadius = "50%"
    el.style.backgroundColor = "#3B82F6"
    el.style.border = "3px solid white"
    el.style.boxShadow = "0 0 10px rgba(59, 130, 246, 0.5)"

    userMarkerRef.current = new (window as any).mapboxgl.Marker(el)
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(mapRef.current)

    // Fly to user location
    mapRef.current.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: 12,
      duration: 2000,
    })
  }, [userLocation, mapLoaded])

  // Update event markers
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return

    // Clear existing event markers
    eventMarkersRef.current.forEach((marker) => marker.remove())
    eventMarkersRef.current = []

    // Add event markers
    events.forEach((event) => {
      if (!event.coordinates) return

      const el = document.createElement("div")
      el.className = "event-marker"
      el.style.width = "30px"
      el.style.height = "30px"
      el.style.borderRadius = "50%"
      el.style.backgroundColor = "#8B5CF6"
      el.style.border = "3px solid white"
      el.style.cursor = "pointer"
      el.style.boxShadow = "0 0 10px rgba(139, 92, 246, 0.5)"
      el.style.display = "flex"
      el.style.alignItems = "center"
      el.style.justifyContent = "center"
      el.style.fontSize = "12px"

      const IconComponent = CATEGORY_ICONS[event.category as keyof typeof CATEGORY_ICONS] || Zap
      el.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`

      const marker = new (window as any).mapboxgl.Marker(el)
        .setLngLat([event.coordinates.lng, event.coordinates.lat])
        .addTo(mapRef.current)

      // Add click handler
      el.addEventListener("click", () => onEventSelect(event))

      eventMarkersRef.current.push(marker)
    })
  }, [events, mapLoaded, onEventSelect])

  return (
    <div className="h-[500px] rounded-xl overflow-hidden border border-gray-800">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  )
}

function EventCard({ event, onSelect }: { event: EventDetailProps; onSelect: () => void }) {
  const [isFavorite, setIsFavorite] = useState(event.isFavorite)
  const IconComponent = CATEGORY_ICONS[event.category as keyof typeof CATEGORY_ICONS] || Zap

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-[#1A1D25] rounded-xl border border-gray-800 hover:border-purple-500/50 transition-all duration-300 overflow-hidden cursor-pointer"
      onClick={onSelect}
    >
      <div className="aspect-video relative overflow-hidden">
        <img
          src={event.image || "/placeholder.svg?height=200&width=300&text=" + encodeURIComponent(event.title)}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <Badge className="bg-purple-600/90 text-white">
            <IconComponent className="h-3 w-3 mr-1" />
            {event.category}
          </Badge>
        </div>

        {/* Favorite button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-3 right-3 h-8 w-8 p-0 bg-black/50 hover:bg-black/70"
          onClick={(e) => {
            e.stopPropagation()
            setIsFavorite(!isFavorite)
          }}
        >
          <Heart className={cn("h-4 w-4", isFavorite ? "fill-red-500 text-red-500" : "text-white")} />
        </Button>

        {/* Price */}
        <div className="absolute bottom-3 right-3">
          <div className="bg-black/70 rounded-full px-3 py-1">
            <span className="text-white font-semibold text-sm">{event.price}</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <h3 className="font-bold text-white text-lg mb-2 line-clamp-2">{event.title}</h3>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{event.description}</p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-400">
            <Calendar className="h-4 w-4 mr-2 text-purple-400" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center text-sm text-gray-400">
            <Clock className="h-4 w-4 mr-2 text-purple-400" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center text-sm text-gray-400">
            <MapPin className="h-4 w-4 mr-2 text-purple-400" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Avatar className="h-6 w-6 mr-2">
              <AvatarImage src={event.organizer.avatar || "/placeholder.svg"} />
              <AvatarFallback>{event.organizer.name[0]}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-400">{event.organizer.name}</span>
          </div>
          <div className="flex items-center text-sm text-gray-400">
            <Users className="h-4 w-4 mr-1" />
            <span className="text-purple-400 font-medium">{event.attendees}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function EventsClient() {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [events, setEvents] = useState<EventDetailProps[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EventDetailProps | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showExploreSection, setShowExploreSection] = useState(false)

  const loadEventsNearLocation = useCallback(async (location: UserLocation) => {
    setLoading(true)
    try {
      const result = await fetchEvents({
        location: `${location.lat},${location.lng}`,
        radius: 25,
        size: 20,
      })

      if (result.events) {
        // Add coordinates to events if they don't have them
        const eventsWithCoords = result.events.map((event, index) => {
          if (!event.coordinates) {
            // Generate random coordinates near the user location
            const randomLat = location.lat + (Math.random() - 0.5) * 0.1
            const randomLng = location.lng + (Math.random() - 0.5) * 0.1
            return {
              ...event,
              coordinates: { lat: randomLat, lng: randomLng },
            }
          }
          return event
        })
        setEvents(eventsWithCoords)
      }
    } catch (error) {
      console.error("Failed to load events:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleLocationSelect = useCallback(
    (location: UserLocation) => {
      setUserLocation(location)
      setShowExploreSection(true)
      loadEventsNearLocation(location)
    },
    [loadEventsNearLocation],
  )

  const handleExploreClick = () => {
    setShowExploreSection(true)
  }

  const handleEventSelect = useCallback((event: EventDetailProps) => {
    setSelectedEvent(event)
    setShowModal(true)
  }, [])

  return (
    <div className="min-h-screen bg-[#0F1116]">
      {/* Hero Section with Featured Event */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <FeaturedEventHero event={FEATURED_EVENT} onExplore={handleExploreClick} />
        </div>
      </div>

      {/* Location Search Section */}
      <AnimatePresence>
        {showExploreSection && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <LocationSearchSection onLocationSelect={handleLocationSelect} isLoading={loading} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map and Events Section */}
      <AnimatePresence>
        {userLocation && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              {/* Section Header */}
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-white mb-4">Events Near {userLocation.name}</h2>
                <p className="text-gray-400 text-lg">Discover amazing events happening in your area</p>
              </div>

              {/* Map */}
              <div className="mb-12">
                <EventsMap userLocation={userLocation} events={events} onEventSelect={handleEventSelect} />
              </div>

              {/* Events Grid */}
              {loading ? (
                <div className="flex justify-center py-16">
                  <div className="text-center">
                    <Loader2 className="h-12 w-12 text-purple-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Finding events near you...</p>
                  </div>
                </div>
              ) : events.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold text-white">{events.length} Events Found</h3>
                    <Button variant="outline" className="border-gray-700 text-gray-400">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter Events
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                      >
                        <EventCard event={event} onSelect={() => handleEventSelect(event)} />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="text-center py-16">
                  <div className="text-gray-400 mb-4">
                    <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                    <h3 className="text-xl font-semibold mb-2">No Events Found</h3>
                    <p>Try searching in a different location or check back later.</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          isOpen={showModal}
          onClose={() => {
            setShowModal(false)
            setSelectedEvent(null)
          }}
        />
      )}
    </div>
  )
}
