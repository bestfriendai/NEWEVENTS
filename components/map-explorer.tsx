"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Search, MapPin, X, Loader2, Filter, ChevronLeft, ChevronRight, Calendar, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EventDetailModal } from "@/components/event-detail-modal"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { API_CONFIG } from "@/lib/env"
import { cn } from "@/lib/utils"
import type { EventDetail } from "@/types/event.types"

// Categories for filtering
const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "music", label: "Music" },
  { id: "arts", label: "Arts" },
  { id: "sports", label: "Sports" },
  { id: "food", label: "Food" },
  { id: "business", label: "Business" },
]

interface MapExplorerProps {
  events?: EventDetail[]
}

export function MapExplorer({ events = [] }: MapExplorerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filteredEvents, setFilteredEvents] = useState<EventDetail[]>(events)
  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [mapboxLoaded, setMapboxLoaded] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  // Load Mapbox script
  useEffect(() => {
    // Skip if already loaded
    if (mapboxLoaded || typeof window === "undefined") return

    // Add Mapbox CSS
    const link = document.createElement("link")
    link.href = "https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.css"
    link.rel = "stylesheet"
    document.head.appendChild(link)

    // Load Mapbox script
    const script = document.createElement("script")
    script.src = "https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.js"
    script.async = true

    script.onload = () => {
      setMapboxLoaded(true)
    }

    document.body.appendChild(script)

    return () => {
      // Clean up
      if (document.head.contains(link)) {
        document.head.removeChild(link)
      }
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [mapboxLoaded])

  // Initialize map after Mapbox is loaded
  useEffect(() => {
    if (!mapboxLoaded || !mapContainerRef.current || typeof window === "undefined") return

    try {
      const mapboxgl = (window as any).mapboxgl
      mapboxgl.accessToken = API_CONFIG.maps.mapbox.clientApiKey

      // Initialize map
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [0, 20], // Center on world view
        zoom: 1.5,
        projection: "globe",
      })

      // Add navigation controls
      mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right")

      // Add event markers when map loads
      mapRef.current.on("load", () => {
        setIsLoading(false)

        // Add atmosphere to the globe
        mapRef.current.setFog({
          color: "rgb(20, 20, 30)",
          "high-color": "rgb(36, 92, 223)",
          "horizon-blend": 0.4,
          "space-color": "rgb(11, 11, 25)",
          "star-intensity": 0.6,
        })

        // Add pulse animation style
        if (!document.getElementById("marker-pulse-style")) {
          const style = document.createElement("style")
          style.id = "marker-pulse-style"
          style.innerHTML = `
            @keyframes pulse {
              0% {
                transform: scale(1);
                opacity: 0.6;
              }
              70% {
                transform: scale(2);
                opacity: 0;
              }
              100% {
                transform: scale(1);
                opacity: 0;
              }
            }
          `
          document.head.appendChild(style)
        }

        // Add markers
        addMarkersToMap()
      })
    } catch (err) {
      setIsLoading(false)
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
      }
    }
  }, [mapboxLoaded])

  // Add markers to map when events or map changes
  const addMarkersToMap = () => {
    if (!mapRef.current || !mapboxLoaded || filteredEvents.length === 0 || typeof window === "undefined") return

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    // Add markers for each event
    filteredEvents.forEach((event) => {
      if (!event.coordinates) return

      const { lat, lng } = event.coordinates

      // Create marker element
      const markerEl = document.createElement("div")
      markerEl.className = "event-marker"
      markerEl.style.width = "20px"
      markerEl.style.height = "20px"
      markerEl.style.borderRadius = "50%"
      markerEl.style.background = getCategoryColor(event.category)
      markerEl.style.border = "2px solid white"
      markerEl.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)"
      markerEl.style.cursor = "pointer"
      markerEl.style.transition = "transform 0.2s ease"
      markerEl.style.position = "relative"

      // Add pulse effect
      const pulse = document.createElement("div")
      pulse.className = "marker-pulse"
      pulse.style.position = "absolute"
      pulse.style.width = "100%"
      pulse.style.height = "100%"
      pulse.style.borderRadius = "50%"
      pulse.style.backgroundColor = getCategoryColor(event.category)
      pulse.style.opacity = "0.6"
      pulse.style.animation = "pulse 1.5s infinite"
      markerEl.appendChild(pulse)

      // Create and add marker
      const marker = new (window as any).mapboxgl.Marker({
        element: markerEl,
        anchor: "center",
      })
        .setLngLat([lng, lat])
        .addTo(mapRef.current)

      // Add click event
      marker.getElement().addEventListener("click", () => {
        setSelectedEvent(event)

        // Fly to marker
        mapRef.current.flyTo({
          center: [lng, lat],
          zoom: 10,
          duration: 1500,
        })
      })

      // Add hover effect
      marker.getElement().addEventListener("mouseenter", () => {
        markerEl.style.transform = "scale(1.3)"
      })

      marker.getElement().addEventListener("mouseleave", () => {
        markerEl.style.transform = "scale(1)"
      })

      markersRef.current.push(marker)
    })

    // Fit bounds to show all markers
    if (filteredEvents.length > 0 && markersRef.current.length > 0) {
      const bounds = new (window as any).mapboxgl.LngLatBounds()

      filteredEvents.forEach((event) => {
        if (event.coordinates) {
          bounds.extend([event.coordinates.lng, event.coordinates.lat])
        }
      })

      mapRef.current.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: showSidebar ? 400 : 50, right: 50 },
        maxZoom: 10,
        duration: 1000,
      })
    }
  }

  // Update markers when filtered events change
  useEffect(() => {
    if (mapboxLoaded && mapRef.current) {
      addMarkersToMap()
    }
  }, [filteredEvents, mapboxLoaded, showSidebar])

  // Update filtered events when events prop changes
  useEffect(() => {
    setFilteredEvents(events)
  }, [events])

  // Filter events based on search and category
  useEffect(() => {
    let filtered = [...events]

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          event.location.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query),
      )
    }

    // Filter by category
    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter((event) => event.category.toLowerCase() === selectedCategory.toLowerCase())
    }

    setFilteredEvents(filtered)
  }, [events, searchQuery, selectedCategory])

  // Get color based on event category
  const getCategoryColor = (category: string): string => {
    switch (category.toLowerCase()) {
      case "music":
        return "#8B5CF6" // Purple
      case "arts":
        return "#3B82F6" // Blue
      case "sports":
        return "#10B981" // Green
      case "food":
        return "#EC4899" // Pink
      case "business":
        return "#F59E0B" // Yellow
      default:
        return "#6366F1" // Indigo
    }
  }

  // Toggle favorite status
  const handleToggleFavorite = (eventId: number) => {
    // Implementation for toggling favorites
  }

  // View event details
  const handleViewDetails = (event: EventDetail) => {
    setSelectedEvent(event)
    setShowDetailModal(true)
  }

  // Handle event selection
  const handleEventSelect = (event: EventDetail) => {
    setSelectedEvent(event)

    // Fly to the event location
    if (mapRef.current && event.coordinates) {
      mapRef.current.flyTo({
        center: [event.coordinates.lng, event.coordinates.lat],
        zoom: 10,
        duration: 1500,
      })
    }
  }

  return (
    <div className="relative h-[calc(100vh-5rem)] w-full overflow-hidden">
      {/* Map container */}
      <div className="absolute inset-0">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1A1D25]/80 z-10">
            <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
          </div>
        )}
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Toggle sidebar button */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-4 left-4 z-10 bg-[#1A1D25]/80 backdrop-blur-sm hover:bg-[#1A1D25] text-white shadow-md"
          onClick={() => setShowSidebar(!showSidebar)}
        >
          {showSidebar ? <ChevronLeft /> : <ChevronRight />}
        </Button>

        {/* Selected event popup */}
        <AnimatePresence>
          {selectedEvent && !showSidebar && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-[#1A1D25]/90 backdrop-blur-md rounded-xl overflow-hidden border border-gray-800 shadow-xl"
            >
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 z-10 bg-[#1A1D25]/60 hover:bg-[#1A1D25]/80 text-gray-400 hover:text-white"
                  onClick={() => setSelectedEvent(null)}
                >
                  <X size={16} />
                </Button>

                <div className="p-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 relative">
                      <Image
                        src={selectedEvent.image || "/community-event.png"}
                        alt={selectedEvent.title}
                        fill
                        style={{ objectFit: "cover" }}
                        sizes="80px"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">{selectedEvent.title}</h3>
                      <div className="flex items-center text-sm text-gray-400 mb-1">
                        <MapPin size={14} className="mr-1 text-purple-400" />
                        {selectedEvent.location}
                      </div>
                      <div className="flex items-center text-sm text-gray-400">
                        <div className="bg-purple-500/20 text-purple-300 text-xs px-2 py-0.5 rounded-full">
                          {selectedEvent.category}
                        </div>
                        <div className="mx-2 text-gray-600">•</div>
                        <div className="text-gray-400">{selectedEvent.date}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-between items-center">
                    <div className="text-sm font-medium text-white">{selectedEvent.price}</div>
                    <Button
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1 h-8"
                      onClick={() => handleViewDetails(selectedEvent)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ x: -350 }}
            animate={{ x: 0 }}
            exit={{ x: -350 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute top-0 left-0 bottom-0 w-full md:w-[350px] bg-[#1A1D25]/95 backdrop-blur-md border-r border-gray-800 z-20 overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-gray-800">
              <h1 className="text-2xl font-bold text-white mb-4">Explore Events</h1>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#22252F] border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
            </div>

            {/* Category filters */}
            <div className="p-4 border-b border-gray-800">
              <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                {CATEGORIES.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm whitespace-nowrap",
                      selectedCategory === category.id
                        ? "bg-purple-600 hover:bg-purple-700 text-white"
                        : "border-gray-700 text-gray-300 hover:text-white hover:border-gray-600",
                    )}
                    onClick={() => setSelectedCategory(category.id === "all" ? null : category.id)}
                  >
                    {category.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Filter toggle */}
            <div className="p-4 border-b border-gray-800">
              <Button
                variant="outline"
                className="w-full border-gray-700 text-gray-300 hover:text-white hover:border-gray-600"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={16} className="mr-2" />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
            </div>

            {/* Advanced filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-gray-800"
                >
                  <div className="p-4 space-y-4">
                    {/* Price Range */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-300 mb-3">Price Range</h3>
                      <Slider defaultValue={[0, 100]} max={100} step={1} className="my-4" />
                      <div className="flex justify-between text-sm text-gray-400">
                        <span>$0</span>
                        <span>$1000+</span>
                      </div>
                    </div>

                    {/* Distance */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-300 mb-3">Distance</h3>
                      <Slider defaultValue={[25]} max={100} step={5} className="my-4" />
                      <div className="flex justify-between text-sm text-gray-400">
                        <span>0 mi</span>
                        <span>100 mi</span>
                      </div>
                    </div>

                    {/* Free Events Only */}
                    <div>
                      <div className="flex items-center">
                        <Checkbox
                          id="free-events"
                          className="border-gray-700 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                        />
                        <Label htmlFor="free-events" className="ml-2 text-sm text-gray-300">
                          Free events only
                        </Label>
                      </div>
                    </div>

                    {/* Apply Filters Button */}
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                      Apply Filters
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Events list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-[#22252F] rounded-xl h-24 animate-pulse"></div>
                  ))}
                </div>
              ) : filteredEvents.length > 0 ? (
                <>
                  {filteredEvents.map((event) => (
                    <EventListItem
                      key={event.id}
                      event={event}
                      isSelected={selectedEvent?.id === event.id}
                      onSelect={() => handleEventSelect(event)}
                      onViewDetails={() => handleViewDetails(event)}
                      onToggleFavorite={() => handleToggleFavorite(event.id)}
                    />
                  ))}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-8">
                  <div className="text-gray-400 mb-4 text-center">
                    <div className="mb-2">
                      <Search size={40} className="mx-auto text-gray-600" />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-2">No events found</h3>
                    <p>Try adjusting your search or filters to find events.</p>
                  </div>
                  <Button
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:text-white"
                    onClick={() => {
                      setSearchQuery("")
                      setSelectedCategory(null)
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>

            {/* Results count */}
            <div className="p-4 border-t border-gray-800 text-sm text-gray-400">
              {isLoading ? (
                "Loading events..."
              ) : (
                <>
                  Showing <span className="text-white font-medium">{filteredEvents.length}</span> of{" "}
                  <span className="text-white font-medium">{events.length}</span> events
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event detail modal */}
      {showDetailModal && selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          onFavorite={handleToggleFavorite}
        />
      )}
    </div>
  )
}

// Event list item component
interface EventListItemProps {
  event: EventDetail
  isSelected: boolean
  onSelect: () => void
  onViewDetails: () => void
  onToggleFavorite: () => void
}

function EventListItem({ event, isSelected, onSelect, onViewDetails, onToggleFavorite }: EventListItemProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        "cursor-pointer rounded-xl overflow-hidden border transition-all duration-200",
        isSelected
          ? "border-purple-500 bg-[#22252F]/80 shadow-glow-sm"
          : "border-gray-800 bg-[#22252F]/50 hover:border-gray-700",
      )}
      onClick={onSelect}
    >
      <div className="p-3">
        <div className="flex gap-3">
          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 relative">
            <Image
              src={event.image || "/community-event.png"}
              alt={event.title}
              fill
              style={{ objectFit: "cover" }}
              sizes="64px"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <Badge
                className={cn(
                  "text-xs font-medium border-0 px-2 py-0.5",
                  event.category === "Music"
                    ? "bg-purple-500/20 text-purple-300"
                    : event.category === "Arts"
                      ? "bg-blue-500/20 text-blue-300"
                      : event.category === "Sports"
                        ? "bg-green-500/20 text-green-300"
                        : event.category === "Food"
                          ? "bg-pink-500/20 text-pink-300"
                          : "bg-yellow-500/20 text-yellow-300",
                )}
              >
                {event.category}
              </Badge>
              <motion.button
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleFavorite()
                }}
                className="text-gray-400 hover:text-purple-400 transition-colors duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill={event.isFavorite ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={event.isFavorite ? "text-purple-500" : "text-gray-400"}
                >
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
              </motion.button>
            </div>
            <h3 className="font-medium text-gray-200 text-sm truncate">{event.title}</h3>
            <div className="flex items-center text-xs text-gray-400 mt-1">
              <Calendar size={10} className="mr-1 text-purple-400 flex-shrink-0" />
              <span className="truncate">{event.date}</span>
            </div>
            <div className="flex items-center text-xs text-gray-400 mt-1">
              <MapPin size={10} className="mr-1 text-purple-400 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-800/50">
          <div className="flex items-center text-xs text-gray-400">
            <Users size={10} className="mr-1" />
            <span className="text-purple-400 font-medium">{event.attendees}</span> attending
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-900/20"
            onClick={(e) => {
              e.stopPropagation()
              onViewDetails()
            }}
          >
            Details
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
