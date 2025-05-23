"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, MapPin, List, MapIcon, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EventCard } from "@/components/event-card"
import { EventDetailModal } from "@/components/event-detail-modal"
import { API_CONFIG } from "@/lib/env"
import { cn } from "@/lib/utils"
import type { EventDetailProps } from "@/components/event-detail-modal"

interface EventsMapProps {
  initialEvents?: EventDetailProps[]
  className?: string
}

// Mock events data
const MOCK_EVENTS: EventDetailProps[] = [
  {
    id: 1001,
    title: "Summer Music Festival",
    description: "A three-day music festival featuring top artists from around the world.",
    category: "Music",
    date: "July 15-17, 2024",
    time: "12:00 PM - 11:00 PM",
    location: "Central Park",
    address: "New York, NY",
    price: "$150",
    image: "/community-event.png",
    organizer: {
      name: "NYC Events",
      avatar: "/avatar-1.png",
    },
    attendees: 5000,
    isFavorite: false,
    coordinates: { lat: 40.7829, lng: -73.9654 },
  },
  {
    id: 1002,
    title: "Tech Conference 2024",
    description: "The biggest tech conference of the year with keynotes, workshops, and networking.",
    category: "Business",
    date: "August 10-12, 2024",
    time: "9:00 AM - 6:00 PM",
    location: "Moscone Center",
    address: "San Francisco, CA",
    price: "$499",
    image: "/community-event.png",
    organizer: {
      name: "TechEvents Inc",
      avatar: "/avatar-2.png",
    },
    attendees: 3000,
    isFavorite: true,
    coordinates: { lat: 37.7749, lng: -122.4194 },
  },
  {
    id: 1003,
    title: "London Art Exhibition",
    description: "A showcase of contemporary art from emerging artists.",
    category: "Arts",
    date: "September 5-15, 2024",
    time: "10:00 AM - 8:00 PM",
    location: "Tate Modern",
    address: "London, UK",
    price: "£20",
    image: "/community-event.png",
    organizer: {
      name: "London Arts Council",
      avatar: "/avatar-3.png",
    },
    attendees: 1500,
    isFavorite: false,
    coordinates: { lat: 51.5074, lng: -0.1278 },
  },
  {
    id: 1004,
    title: "Tokyo Food Festival",
    description: "Experience the best of Japanese cuisine with top chefs and food vendors.",
    category: "Food",
    date: "October 1-3, 2024",
    time: "11:00 AM - 9:00 PM",
    location: "Yoyogi Park",
    address: "Tokyo, Japan",
    price: "¥3000",
    image: "/community-event.png",
    organizer: {
      name: "Tokyo Culinary Association",
      avatar: "/avatar-4.png",
    },
    attendees: 8000,
    isFavorite: false,
    coordinates: { lat: 35.6762, lng: 139.6503 },
  },
  {
    id: 1005,
    title: "Sydney Marathon",
    description: "Annual marathon through the streets of Sydney with views of the harbor and opera house.",
    category: "Sports",
    date: "September 20, 2024",
    time: "6:00 AM - 2:00 PM",
    location: "Sydney Harbor",
    address: "Sydney, Australia",
    price: "AU$120",
    image: "/community-event.png",
    organizer: {
      name: "Sydney Athletics",
      avatar: "/avatar-5.png",
    },
    attendees: 12000,
    isFavorite: true,
    coordinates: { lat: -33.8688, lng: 151.2093 },
  },
  {
    id: 1006,
    title: "Berlin Electronic Music Night",
    description: "A night of electronic music with world-renowned DJs in Berlin's famous club scene.",
    category: "Music",
    date: "August 25, 2024",
    time: "11:00 PM - 6:00 AM",
    location: "Berghain",
    address: "Berlin, Germany",
    price: "€30",
    image: "/community-event.png",
    organizer: {
      name: "Berlin Nightlife",
      avatar: "/avatar-6.png",
    },
    attendees: 1200,
    isFavorite: false,
    coordinates: { lat: 52.52, lng: 13.405 },
  },
  {
    id: 1007,
    title: "Rio Carnival 2025",
    description: "The world's biggest carnival with parades, music, and dancing.",
    category: "Arts",
    date: "February 28 - March 5, 2025",
    time: "All Day",
    location: "Sambadrome",
    address: "Rio de Janeiro, Brazil",
    price: "R$200",
    image: "/community-event.png",
    organizer: {
      name: "Rio Carnival Committee",
      avatar: "/avatar-1.png",
    },
    attendees: 50000,
    isFavorite: false,
    coordinates: { lat: -22.9068, lng: -43.1729 },
  },
  {
    id: 1008,
    title: "Cape Town Wine Festival",
    description: "Sample the finest wines from South Africa's renowned wine regions.",
    category: "Food",
    date: "November 12-14, 2024",
    time: "12:00 PM - 8:00 PM",
    location: "V&A Waterfront",
    address: "Cape Town, South Africa",
    price: "R350",
    image: "/community-event.png",
    organizer: {
      name: "South African Wine Guild",
      avatar: "/avatar-2.png",
    },
    attendees: 2500,
    isFavorite: true,
    coordinates: { lat: -33.9249, lng: 18.4241 },
  },
  {
    id: 1009,
    title: "Dubai Business Expo",
    description: "Connect with global business leaders and explore new opportunities.",
    category: "Business",
    date: "October 20-22, 2024",
    time: "9:00 AM - 7:00 PM",
    location: "Dubai World Trade Centre",
    address: "Dubai, UAE",
    price: "AED 500",
    image: "/community-event.png",
    organizer: {
      name: "Dubai Chamber of Commerce",
      avatar: "/avatar-3.png",
    },
    attendees: 7000,
    isFavorite: false,
    coordinates: { lat: 25.2048, lng: 55.2708 },
  },
  {
    id: 1010,
    title: "Paris Fashion Week",
    description: "The world's most prestigious fashion event showcasing next season's trends.",
    category: "Arts",
    date: "September 26 - October 4, 2024",
    time: "Various Times",
    location: "Various Venues",
    address: "Paris, France",
    price: "By Invitation",
    image: "/community-event.png",
    organizer: {
      name: "Fédération de la Haute Couture",
      avatar: "/avatar-4.png",
    },
    attendees: 4500,
    isFavorite: false,
    coordinates: { lat: 48.8566, lng: 2.3522 },
  },
  {
    id: 1011,
    title: "Mumbai Cricket Tournament",
    description: "Annual cricket tournament featuring top teams from across India.",
    category: "Sports",
    date: "November 5-15, 2024",
    time: "2:00 PM - 10:00 PM",
    location: "Wankhede Stadium",
    address: "Mumbai, India",
    price: "₹1000",
    image: "/community-event.png",
    organizer: {
      name: "Indian Cricket Association",
      avatar: "/avatar-5.png",
    },
    attendees: 30000,
    isFavorite: true,
    coordinates: { lat: 19.076, lng: 72.8777 },
  },
  {
    id: 1012,
    title: "Mexico City Food Tour",
    description: "Guided tour of Mexico City's best street food and local cuisine.",
    category: "Food",
    date: "Every Saturday",
    time: "11:00 AM - 3:00 PM",
    location: "Historic Center",
    address: "Mexico City, Mexico",
    price: "MX$800",
    image: "/community-event.png",
    organizer: {
      name: "Mexican Culinary Tours",
      avatar: "/avatar-6.png",
    },
    attendees: 20,
    isFavorite: false,
    coordinates: { lat: 19.4326, lng: -99.1332 },
  },
]

// Categories for filtering
const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "music", label: "Music" },
  { id: "arts", label: "Arts" },
  { id: "sports", label: "Sports" },
  { id: "food", label: "Food" },
  { id: "business", label: "Business" },
]

export function EventsMap({ initialEvents = [], className = "" }: EventsMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [events, setEvents] = useState<EventDetailProps[]>(initialEvents.length > 0 ? initialEvents : MOCK_EVENTS)
  const [filteredEvents, setFilteredEvents] = useState<EventDetailProps[]>(
    initialEvents.length > 0 ? initialEvents : MOCK_EVENTS,
  )
  const [selectedEvent, setSelectedEvent] = useState<EventDetailProps | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [mapView, setMapView] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [mapboxLoaded, setMapboxLoaded] = useState(false)

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
      mapboxgl.accessToken =
        API_CONFIG.maps.mapbox.apiKey ||
        "pk.eyJ1IjoiZGF0ZWFpIiwiYSI6ImNsbjRtYnFvejAyaWsycXBmcTkzYnN0am0ifQ.Z5Z9_rv0PVvJAGrb7AJmRg"

      // Initialize map
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [0, 20], // Center on world view
        zoom: 1.5,
        projection: "globe",
      })

      // Add navigation controls
      mapRef.current.addControl(new mapboxgl.NavigationControl())

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
      // console.error("Error initializing map:", err)
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
      markerEl.style.position = "relative" // Add position relative for the pulse

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
        padding: 50,
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
  }, [filteredEvents, mapboxLoaded])

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
    const updatedEvents = events.map((event) =>
      event.id === eventId ? { ...event, isFavorite: !event.isFavorite } : event,
    )
    setEvents(updatedEvents)
  }

  // View event details
  const handleViewDetails = (event: EventDetailProps) => {
    setSelectedEvent(event)
    setShowDetailModal(true)
  }

  return (
    <div className={cn("w-full h-full flex flex-col", className)}>
      {/* Search and filter bar */}
      <div className="bg-[#1A1D25]/90 backdrop-blur-md p-4 rounded-xl shadow-md mb-4 z-10">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#22252F] border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>

          {/* Category filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
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

          {/* View toggle */}
          <div className="flex gap-2">
            <Button
              variant={mapView ? "default" : "outline"}
              className={cn(
                "rounded-lg px-4 py-2",
                mapView
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "border-gray-700 text-gray-300 hover:text-white hover:border-gray-600",
              )}
              onClick={() => setMapView(true)}
            >
              <MapIcon size={18} className="mr-2" />
              Map
            </Button>
            <Button
              variant={!mapView ? "default" : "outline"}
              className={cn(
                "rounded-lg px-4 py-2",
                !mapView
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "border-gray-700 text-gray-300 hover:text-white hover:border-gray-600",
              )}
              onClick={() => setMapView(false)}
            >
              <List size={18} className="mr-2" />
              List
            </Button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 h-[calc(100vh-13rem)]">
        {/* Map view */}
        {mapView && (
          <div className="relative flex-1 rounded-xl overflow-hidden border border-gray-800 bg-[#1A1D25]">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#1A1D25]/80 z-10">
                <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
              </div>
            )}
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Selected event info */}
            <AnimatePresence>
              {selectedEvent && mapView && (
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
                        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={selectedEvent.image || "/community-event.png"}
                            alt={selectedEvent.title}
                            className="w-full h-full object-cover"
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
        )}

        {/* List view */}
        {!mapView && (
          <div className="flex-1 overflow-y-auto pr-1 rounded-xl">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-[#1A1D25] rounded-xl h-64 animate-pulse"></div>
                ))}
              </div>
            ) : filteredEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onViewDetails={() => handleViewDetails(event)}
                    onToggleFavorite={() => handleToggleFavorite(event.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-[#1A1D25] rounded-xl p-8">
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
        )}
      </div>

      {/* Event detail modal */}
      {showDetailModal && selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          onFavorite={handleToggleFavorite}
        />
      )}

      {/* Results count */}
      <div className="mt-4 text-sm text-gray-400">
        {isLoading ? (
          "Loading events..."
        ) : (
          <>
            Showing <span className="text-white font-medium">{filteredEvents.length}</span> of{" "}
            <span className="text-white font-medium">{events.length}</span> events
          </>
        )}
      </div>
    </div>
  )
}
