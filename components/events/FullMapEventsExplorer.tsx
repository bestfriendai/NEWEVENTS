"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, MapPin, X, Calendar, Users, Heart, Share2, Ticket, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CLIENT_CONFIG } from "@/lib/env"
import { MapStatusIndicator } from "./MapStatusIndicator"

// Import Mapbox GL JS
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"

// Enhanced mock events with more realistic data
const ENHANCED_EVENTS = [
  {
    id: "1",
    title: "Summer Music Festival 2024",
    description:
      "Experience the ultimate summer music festival featuring top artists from around the world. Three days of non-stop music, food, and fun in the heart of Central Park.",
    category: "Music",
    date: "2024-07-15",
    time: "18:00",
    location: "Central Park, New York",
    address: "Central Park, Manhattan, NY 10024",
    lat: 40.7829,
    lng: -73.9654,
    price: "$85-250",
    image: "/event-1.png",
    attendees: 15000,
    organizer: "NYC Music Events",
    tags: ["Festival", "Outdoor", "Multi-day"],
    venue: { name: "Central Park Great Lawn", capacity: 20000 },
    ticketLinks: [{ url: "https://tickets.example.com", provider: "Ticketmaster" }],
  },
  {
    id: "2",
    title: "TechCrunch Disrupt 2024",
    description:
      "Join the world's leading technology conference featuring groundbreaking startups, industry leaders, and the latest innovations shaping our future.",
    category: "Technology",
    date: "2024-08-22",
    time: "09:00",
    location: "Moscone Center, San Francisco",
    address: "747 Howard St, San Francisco, CA 94103",
    lat: 37.7749,
    lng: -122.4194,
    price: "$299-1299",
    image: "/event-2.png",
    attendees: 8000,
    organizer: "TechCrunch",
    tags: ["Conference", "Networking", "Innovation"],
    venue: { name: "Moscone Center", capacity: 10000 },
    ticketLinks: [{ url: "https://tickets.example.com", provider: "Eventbrite" }],
  },
  {
    id: "3",
    title: "Contemporary Art Showcase",
    description:
      "Discover emerging artists and contemporary masterpieces in this exclusive gallery opening featuring works from local and international artists.",
    category: "Arts",
    date: "2024-06-30",
    time: "19:00",
    location: "LACMA, Los Angeles",
    address: "5905 Wilshire Blvd, Los Angeles, CA 90036",
    lat: 34.0639,
    lng: -118.3592,
    price: "Free",
    image: "/event-3.png",
    attendees: 500,
    organizer: "Los Angeles County Museum of Art",
    tags: ["Art", "Gallery", "Opening"],
    venue: { name: "LACMA", capacity: 800 },
    ticketLinks: [{ url: "https://tickets.example.com", provider: "LACMA" }],
  },
  {
    id: "4",
    title: "Chicago Food & Wine Festival",
    description:
      "Taste the finest cuisine from Chicago's top chefs paired with exceptional wines from around the world. A culinary journey you won't forget.",
    category: "Food",
    date: "2024-09-10",
    time: "16:00",
    location: "Grant Park, Chicago",
    address: "337 E Randolph St, Chicago, IL 60601",
    lat: 41.8781,
    lng: -87.6298,
    price: "$125-300",
    image: "/event-4.png",
    attendees: 5000,
    organizer: "Chicago Culinary Society",
    tags: ["Food", "Wine", "Festival"],
    venue: { name: "Grant Park", capacity: 8000 },
    ticketLinks: [{ url: "https://tickets.example.com", provider: "Eventbrite" }],
  },
  {
    id: "5",
    title: "NBA Finals Watch Party",
    description:
      "Join thousands of basketball fans for the ultimate NBA Finals viewing experience with giant screens, food trucks, and live entertainment.",
    category: "Sports",
    date: "2024-06-20",
    time: "20:00",
    location: "Madison Square Garden, New York",
    address: "4 Pennsylvania Plaza, New York, NY 10001",
    lat: 40.7505,
    lng: -73.9934,
    price: "$45-150",
    image: "/event-5.png",
    attendees: 12000,
    organizer: "MSG Entertainment",
    tags: ["Sports", "Basketball", "Watch Party"],
    venue: { name: "Madison Square Garden", capacity: 20000 },
    ticketLinks: [{ url: "https://tickets.example.com", provider: "Ticketmaster" }],
  },
  {
    id: "6",
    title: "Startup Pitch Competition",
    description:
      "Watch the next generation of entrepreneurs pitch their innovative ideas to top investors. Network with founders, VCs, and industry leaders.",
    category: "Business",
    date: "2024-07-05",
    time: "14:00",
    location: "WeWork, Austin",
    address: "600 Congress Ave, Austin, TX 78701",
    lat: 30.2672,
    lng: -97.7431,
    price: "$25-75",
    image: "/event-6.png",
    attendees: 300,
    organizer: "Austin Startup Week",
    tags: ["Startup", "Pitch", "Networking"],
    venue: { name: "WeWork Congress", capacity: 500 },
    ticketLinks: [{ url: "https://tickets.example.com", provider: "Eventbrite" }],
  },
]

const CATEGORIES = [
  { id: "All", label: "All Events", color: "bg-gray-500", icon: "🎪" },
  { id: "Music", label: "Music", color: "bg-purple-500", icon: "🎵" },
  { id: "Technology", label: "Tech", color: "bg-blue-500", icon: "💻" },
  { id: "Arts", label: "Arts", color: "bg-pink-500", icon: "🎨" },
  { id: "Food", label: "Food", color: "bg-orange-500", icon: "🍽️" },
  { id: "Sports", label: "Sports", color: "bg-green-500", icon: "⚽" },
  { id: "Business", label: "Business", color: "bg-gray-600", icon: "💼" },
]

export default function FullMapEventsExplorer() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<mapboxgl.Marker[]>([])

  const [events] = useState(ENHANCED_EVENTS)
  const [filteredEvents, setFilteredEvents] = useState(ENHANCED_EVENTS)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [showLocationBar, setShowLocationBar] = useState(false)
  const [userLocation, setUserLocation] = useState<string>("New York, NY")
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  // Initialize Mapbox
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    // Check if Mapbox API key is available
    if (!CLIENT_CONFIG.mapbox.apiKey) {
      setMapError("Mapbox API key not configured")
      return
    }

    try {
      mapboxgl.accessToken = CLIENT_CONFIG.mapbox.apiKey

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [-73.9654, 40.7829], // NYC
        zoom: 11,
        pitch: 45,
        bearing: 0,
      })

      map.current.on("load", () => {
        setMapLoaded(true)
        setMapError(null)
      })

      map.current.on("error", (e) => {
        console.error("Mapbox error:", e)
        setMapError("Failed to load map")
      })

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), "top-right")

      // Add geolocate control
      map.current.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserHeading: true,
        }),
        "top-right",
      )
    } catch (error) {
      console.error("Error initializing Mapbox:", error)
      setMapError("Failed to initialize map")
    }

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Add event markers to map
  useEffect(() => {
    if (!map.current || !mapLoaded || mapError) return

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove())
    markers.current = []

    // Add new markers
    filteredEvents.forEach((event) => {
      const category = CATEGORIES.find((cat) => cat.id === event.category)

      // Create custom marker element
      const markerElement = document.createElement("div")
      markerElement.className = "event-marker"
      markerElement.innerHTML = `
        <div class="relative cursor-pointer group">
          <div class="w-10 h-10 ${category?.color || "bg-gray-500"} rounded-full border-3 border-white shadow-lg flex items-center justify-center transform transition-all duration-200 group-hover:scale-110 group-hover:shadow-xl">
            <span class="text-white text-lg">${category?.icon || "📍"}</span>
          </div>
          <div class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-xs text-white flex items-center justify-center font-bold">
            ${event.attendees > 1000 ? "🔥" : ""}
          </div>
        </div>
      `

      const marker = new mapboxgl.Marker(markerElement).setLngLat([event.lng, event.lat]).addTo(map.current!)

      // Add click handler
      markerElement.addEventListener("click", () => {
        setSelectedEvent(event)
        map.current?.flyTo({
          center: [event.lng, event.lat],
          zoom: 14,
          duration: 1000,
        })
      })

      // Add hover popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        closeOnClick: false,
      }).setHTML(`
        <div class="p-3 min-w-[200px]">
          <h3 class="font-bold text-sm mb-1">${event.title}</h3>
          <p class="text-xs text-gray-600 mb-2">${event.category} • ${event.date}</p>
          <p class="text-xs text-gray-800">${event.location}</p>
          <div class="flex items-center justify-between mt-2">
            <span class="text-xs font-semibold text-green-600">${event.price}</span>
            <span class="text-xs text-gray-500">${event.attendees.toLocaleString()} attending</span>
          </div>
        </div>
      `)

      markerElement.addEventListener("mouseenter", () => {
        popup.setLngLat([event.lng, event.lat]).addTo(map.current!)
      })

      markerElement.addEventListener("mouseleave", () => {
        popup.remove()
      })

      markers.current.push(marker)
    })

    // Fit map to show all events
    if (filteredEvents.length > 0) {
      const bounds = new mapboxgl.LngLatBounds()
      filteredEvents.forEach((event) => {
        bounds.extend([event.lng, event.lat])
      })
      map.current.fitBounds(bounds, { padding: 100, maxZoom: 12 })
    }
  }, [filteredEvents, mapLoaded, mapError])

  // Filter events
  useEffect(() => {
    let filtered = events

    if (searchQuery) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    if (selectedCategory !== "All") {
      filtered = filtered.filter((event) => event.category === selectedCategory)
    }

    setFilteredEvents(filtered)
  }, [events, searchQuery, selectedCategory])

  const handleLocationSet = useCallback((location: string) => {
    setUserLocation(location)
    setShowLocationBar(false)
  }, [])

  const getCategoryInfo = (categoryId: string) => {
    return CATEGORIES.find((cat) => cat.id === categoryId) || CATEGORIES[0]
  }

  // Render fallback if map fails to load
  if (mapError) {
    return (
      <div className="h-screen w-full relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
        {/* Fallback Grid View */}
        <div className="absolute inset-0 p-6">
          {/* Search Bar */}
          <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 h-5 w-5" />
                  <Input
                    placeholder="Search events, venues, or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 bg-white/10 border-white/20 text-white placeholder-white/70 focus:bg-white/20 transition-all"
                  />
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowLocationBar(true)}
                  className="border-white/20 text-white hover:bg-white/10 h-12 px-6"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  {userLocation}
                </Button>
              </div>

              {/* Category Pills */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {CATEGORIES.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className={`whitespace-nowrap transition-all ${
                      selectedCategory === category.id
                        ? `${category.color} text-white border-transparent`
                        : "border-white/20 text-white hover:bg-white/10"
                    }`}
                  >
                    <span className="mr-2">{category.icon}</span>
                    {category.label}
                  </Button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {filteredEvents.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                className="cursor-pointer"
                onClick={() => setSelectedEvent(event)}
              >
                <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white overflow-hidden">
                  <div className="relative h-48">
                    <img
                      src={
                        event.image ||
                        "/placeholder.svg?height=192&width=400&text=" + encodeURIComponent(event.title) ||
                        "/placeholder.svg" ||
                        "/placeholder.svg"
                      }
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className={`${getCategoryInfo(event.category).color} text-white`}>
                        {getCategoryInfo(event.category).icon} {event.category}
                      </Badge>
                    </div>
                    <div className="absolute bottom-3 right-3">
                      <div className="bg-black/70 rounded-full px-3 py-1 backdrop-blur-sm">
                        <span className="text-white font-bold text-sm">{event.price}</span>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg mb-2">{event.title}</h3>
                    <div className="space-y-2 text-sm text-white/80">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {event.date} at {event.time}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        {event.location}
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        {event.attendees.toLocaleString()} attending
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Location Input Modal */}
        <AnimatePresence>
          {showLocationBar && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm z-30"
                onClick={() => setShowLocationBar(false)}
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 w-full max-w-md mx-4"
              >
                <Card className="bg-white/95 backdrop-blur-md border-0 shadow-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold">Set Your Location</h3>
                      <Button variant="ghost" size="sm" onClick={() => setShowLocationBar(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <div className="relative">
                        <Navigation className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Enter city, address, or venue..."
                          className="pl-10"
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              handleLocationSet((e.target as HTMLInputElement).value)
                            }
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          "New York, NY",
                          "Los Angeles, CA",
                          "Chicago, IL",
                          "San Francisco, CA",
                          "Austin, TX",
                          "Miami, FL",
                        ].map((city) => (
                          <Button
                            key={city}
                            variant="outline"
                            size="sm"
                            onClick={() => handleLocationSet(city)}
                            className="justify-start"
                          >
                            <MapPin className="h-3 w-3 mr-2" />
                            {city}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Event Details Panel */}
        <AnimatePresence>
          {selectedEvent && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-30 overflow-y-auto"
            >
              {/* Event Image Header */}
              <div className="relative h-64 overflow-hidden">
                <img
                  src={
                    selectedEvent.image ||
                    "/placeholder.svg?height=256&width=400&text=" + encodeURIComponent(selectedEvent.title) ||
                    "/placeholder.svg" ||
                    "/placeholder.svg"
                  }
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                {/* Header Controls */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 p-0 bg-black/50 hover:bg-black/70 backdrop-blur-sm"
                  >
                    <Share2 className="h-4 w-4 text-white" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 p-0 bg-black/50 hover:bg-black/70 backdrop-blur-sm"
                  >
                    <Heart className="h-4 w-4 text-white" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedEvent(null)}
                    className="h-10 w-10 p-0 bg-black/50 hover:bg-black/70 backdrop-blur-sm"
                  >
                    <X className="h-4 w-4 text-white" />
                  </Button>
                </div>

                {/* Category Badge */}
                <div className="absolute top-4 left-4">
                  <Badge className={`${getCategoryInfo(selectedEvent.category).color} text-white`}>
                    {getCategoryInfo(selectedEvent.category).icon} {selectedEvent.category}
                  </Badge>
                </div>

                {/* Price */}
                <div className="absolute bottom-4 right-4">
                  <div className="bg-black/70 rounded-full px-4 py-2 backdrop-blur-sm">
                    <span className="text-white font-bold">{selectedEvent.price}</span>
                  </div>
                </div>
              </div>

              {/* Event Content */}
              <div className="p-6">
                {/* Title and Organizer */}
                <div className="mb-6">
                  <h1 className="text-2xl font-bold mb-2">{selectedEvent.title}</h1>
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-3">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback>{selectedEvent.organizer[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-gray-600">by {selectedEvent.organizer}</span>
                  </div>
                </div>

                {/* Event Details Grid */}
                <div className="grid grid-cols-1 gap-4 mb-6">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-3 text-blue-500" />
                    <div>
                      <div className="font-medium">{selectedEvent.date}</div>
                      <div className="text-sm text-gray-500">{selectedEvent.time}</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 mr-3 text-red-500" />
                    <div>
                      <div className="font-medium">{selectedEvent.location}</div>
                      <div className="text-sm text-gray-500">{selectedEvent.address}</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-3 text-green-500" />
                    <div>
                      <div className="font-medium">{selectedEvent.attendees.toLocaleString()} attending</div>
                      <div className="text-sm text-gray-500">
                        Capacity: {selectedEvent.venue.capacity.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">About This Event</h3>
                  <p className="text-gray-700 leading-relaxed">{selectedEvent.description}</p>
                </div>

                {/* Tags */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <Ticket className="h-4 w-4 mr-2" />
                    Get Tickets
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Heart className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="h-screen w-full relative overflow-hidden bg-gray-900">
      {/* Mapbox Container */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Glassmorphism Search Bar */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-6 left-6 right-6 z-20"
      >
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl">
          <div className="p-4">
            {/* Main Search Row */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 h-5 w-5" />
                <Input
                  placeholder="Search events, venues, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 bg-white/10 border-white/20 text-white placeholder-white/70 focus:bg-white/20 transition-all"
                />
              </div>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowLocationBar(true)}
                className="border-white/20 text-white hover:bg-white/10 h-12 px-6"
              >
                <MapPin className="h-4 w-4 mr-2" />
                {userLocation}
              </Button>
            </div>

            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {CATEGORIES.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className={`whitespace-nowrap transition-all ${
                    selectedCategory === category.id
                      ? `${category.color} text-white border-transparent`
                      : "border-white/20 text-white hover:bg-white/10"
                  }`}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.label}
                </Button>
              ))}
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between text-sm text-white/80 mt-3">
              <span>
                {filteredEvents.length} events found near {userLocation}
              </span>
              <span>
                {filteredEvents.reduce((sum, event) => sum + event.attendees, 0).toLocaleString()} total attendees
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Location Input Modal */}
      <AnimatePresence>
        {showLocationBar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm z-30"
              onClick={() => setShowLocationBar(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 w-full max-w-md mx-4"
            >
              <Card className="bg-white/95 backdrop-blur-md border-0 shadow-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">Set Your Location</h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowLocationBar(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div className="relative">
                      <Navigation className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Enter city, address, or venue..."
                        className="pl-10"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleLocationSet((e.target as HTMLInputElement).value)
                          }
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        "New York, NY",
                        "Los Angeles, CA",
                        "Chicago, IL",
                        "San Francisco, CA",
                        "Austin, TX",
                        "Miami, FL",
                      ].map((city) => (
                        <Button
                          key={city}
                          variant="outline"
                          size="sm"
                          onClick={() => handleLocationSet(city)}
                          className="justify-start"
                        >
                          <MapPin className="h-3 w-3 mr-2" />
                          {city}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Event Details Panel */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-30 overflow-y-auto"
          >
            {/* Event Image Header */}
            <div className="relative h-64 overflow-hidden">
              <img
                src={
                  selectedEvent.image ||
                  "/placeholder.svg?height=256&width=400&text=" + encodeURIComponent(selectedEvent.title) ||
                  "/placeholder.svg" ||
                  "/placeholder.svg"
                }
                alt={selectedEvent.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

              {/* Header Controls */}
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0 bg-black/50 hover:bg-black/70 backdrop-blur-sm"
                >
                  <Share2 className="h-4 w-4 text-white" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0 bg-black/50 hover:bg-black/70 backdrop-blur-sm"
                >
                  <Heart className="h-4 w-4 text-white" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEvent(null)}
                  className="h-10 w-10 p-0 bg-black/50 hover:bg-black/70 backdrop-blur-sm"
                >
                  <X className="h-4 w-4 text-white" />
                </Button>
              </div>

              {/* Category Badge */}
              <div className="absolute top-4 left-4">
                <Badge className={`${getCategoryInfo(selectedEvent.category).color} text-white`}>
                  {getCategoryInfo(selectedEvent.category).icon} {selectedEvent.category}
                </Badge>
              </div>

              {/* Price */}
              <div className="absolute bottom-4 right-4">
                <div className="bg-black/70 rounded-full px-4 py-2 backdrop-blur-sm">
                  <span className="text-white font-bold">{selectedEvent.price}</span>
                </div>
              </div>
            </div>

            {/* Event Content */}
            <div className="p-6">
              {/* Title and Organizer */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">{selectedEvent.title}</h1>
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>{selectedEvent.organizer[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-gray-600">by {selectedEvent.organizer}</span>
                </div>
              </div>

              {/* Event Details Grid */}
              <div className="grid grid-cols-1 gap-4 mb-6">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-3 text-blue-500" />
                  <div>
                    <div className="font-medium">{selectedEvent.date}</div>
                    <div className="text-sm text-gray-500">{selectedEvent.time}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-3 text-red-500" />
                  <div>
                    <div className="font-medium">{selectedEvent.location}</div>
                    <div className="text-sm text-gray-500">{selectedEvent.address}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-3 text-green-500" />
                  <div>
                    <div className="font-medium">{selectedEvent.attendees.toLocaleString()} attending</div>
                    <div className="text-sm text-gray-500">
                      Capacity: {selectedEvent.venue.capacity.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">About This Event</h3>
                <p className="text-gray-700 leading-relaxed">{selectedEvent.description}</p>
              </div>

              {/* Tags */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <Ticket className="h-4 w-4 mr-2" />
                  Get Tickets
                </Button>
                <Button variant="outline" className="flex-1">
                  <Heart className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-40">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-lg">Loading Interactive Map...</p>
            <p className="text-sm text-gray-400 mt-2">Powered by Mapbox</p>
          </div>
        </div>
      )}

      {/* Map Status Indicator */}
      <MapStatusIndicator />
    </div>
  )
}
