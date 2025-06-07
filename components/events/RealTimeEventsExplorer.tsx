"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  MapPin,
  Filter,
  Grid3X3,
  MapIcon,
  Calendar,
  Users,
  Heart,
  Share2,
  Ticket,
  Star,
  Navigation,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
  Clock,
  DollarSign,
  ExternalLink,
  Target,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CLIENT_CONFIG } from "@/lib/env"
import { realTimeEventsAPI, type RealTimeEvent } from "@/lib/api/real-time-events-api"
import { locationService, type UserLocation, type LocationError } from "@/lib/services/location-service"
import { logger } from "@/lib/utils/logger"

// Import Mapbox GL JS
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"

const CATEGORIES = [
  { id: "all", label: "All Events", color: "bg-gradient-to-r from-purple-500 to-pink-500", icon: "🎪" },
  { id: "Music", label: "Music", color: "bg-gradient-to-r from-purple-600 to-blue-600", icon: "🎵" },
  { id: "Sports", label: "Sports", color: "bg-gradient-to-r from-green-600 to-emerald-600", icon: "⚽" },
  { id: "Arts", label: "Arts & Theater", color: "bg-gradient-to-r from-pink-600 to-rose-600", icon: "🎨" },
  { id: "Comedy", label: "Comedy", color: "bg-gradient-to-r from-yellow-600 to-orange-600", icon: "😂" },
  { id: "Family", label: "Family", color: "bg-gradient-to-r from-blue-600 to-cyan-600", icon: "👨‍👩‍👧‍👦" },
  { id: "Business", label: "Business", color: "bg-gradient-to-r from-gray-600 to-slate-600", icon: "💼" },
]

export default function RealTimeEventsExplorer() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<mapboxgl.Marker[]>([])

  // Location state
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [locationInput, setLocationInput] = useState("")
  const [isLocationLoading, setIsLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [showLocationSelector, setShowLocationSelector] = useState(true)

  // Events state
  const [events, setEvents] = useState<RealTimeEvent[]>([])
  const [filteredEvents, setFilteredEvents] = useState<RealTimeEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<RealTimeEvent | null>(null)
  const [isEventsLoading, setIsEventsLoading] = useState(false)
  const [eventsError, setEventsError] = useState<string | null>(null)
  const [lastSearchTime, setLastSearchTime] = useState<Date | null>(null)

  // UI state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [viewMode, setViewMode] = useState<"map" | "grid">("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  // Filter states
  const [showFreeOnly, setShowFreeOnly] = useState(false)
  const [sortBy, setSortBy] = useState("distance")
  const [radiusFilter, setRadiusFilter] = useState(30) // miles

  // Get current location
  const handleGetCurrentLocation = useCallback(async () => {
    setIsLocationLoading(true)
    setLocationError(null)

    try {
      const location = await locationService.getCurrentLocation()
      setUserLocation(location)
      setLocationInput(location.displayName)
      setShowLocationSelector(false)

      logger.info("Current location set", {
        component: "RealTimeEventsExplorer",
        action: "getCurrentLocation",
        metadata: { location: location.displayName },
      })
    } catch (error) {
      const locationError = error as LocationError
      setLocationError(locationError.message)

      logger.error("Failed to get current location", {
        component: "RealTimeEventsExplorer",
        action: "getCurrentLocation",
        error: locationError.message,
      })
    } finally {
      setIsLocationLoading(false)
    }
  }, [])

  // Search for location
  const handleLocationSearch = useCallback(async (query: string) => {
    if (!query.trim()) return

    setIsLocationLoading(true)
    setLocationError(null)

    try {
      const location = await locationService.searchLocation(query)
      setUserLocation(location)
      setLocationInput(location.displayName)
      setShowLocationSelector(false)

      logger.info("Location search successful", {
        component: "RealTimeEventsExplorer",
        action: "searchLocation",
        metadata: { query, location: location.displayName },
      })
    } catch (error) {
      const locationError = error as LocationError
      setLocationError(locationError.message)

      logger.error("Location search failed", {
        component: "RealTimeEventsExplorer",
        action: "searchLocation",
        error: locationError.message,
        metadata: { query },
      })
    } finally {
      setIsLocationLoading(false)
    }
  }, [])

  // Search for events
  const searchEvents = useCallback(async () => {
    if (!userLocation) return

    setIsEventsLoading(true)
    setEventsError(null)

    try {
      const searchParams = {
        lat: userLocation.lat,
        lng: userLocation.lng,
        radius: radiusFilter,
        keyword: searchQuery || undefined,
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        limit: 100,
      }

      logger.info("Starting event search", {
        component: "RealTimeEventsExplorer",
        action: "searchEvents",
        metadata: searchParams,
      })

      const foundEvents = await realTimeEventsAPI.searchEvents(searchParams)
      setEvents(foundEvents)
      setLastSearchTime(new Date())

      logger.info("Event search completed", {
        component: "RealTimeEventsExplorer",
        action: "searchEvents",
        metadata: {
          eventsFound: foundEvents.length,
          location: userLocation.displayName,
          radius: radiusFilter,
        },
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to search events"
      setEventsError(errorMessage)

      logger.error("Event search failed", {
        component: "RealTimeEventsExplorer",
        action: "searchEvents",
        error: errorMessage,
      })
    } finally {
      setIsEventsLoading(false)
    }
  }, [userLocation, radiusFilter, searchQuery, selectedCategory])

  // Initialize Mapbox
  useEffect(() => {
    if (!mapContainer.current || map.current || viewMode !== "map") return

    if (!CLIENT_CONFIG.mapbox.apiKey) {
      setMapError("Mapbox API key not configured")
      return
    }

    try {
      mapboxgl.accessToken = CLIENT_CONFIG.mapbox.apiKey

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: userLocation ? [userLocation.lng, userLocation.lat] : [-98.5795, 39.8283], // Center of US
        zoom: userLocation ? 11 : 4,
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

      // Add controls
      map.current.addControl(new mapboxgl.NavigationControl(), "top-right")
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
  }, [viewMode, userLocation])

  // Add event markers to map
  useEffect(() => {
    if (!map.current || !mapLoaded || mapError || viewMode !== "map") return

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove())
    markers.current = []

    // Add user location marker
    if (userLocation) {
      const userMarkerElement = document.createElement("div")
      userMarkerElement.innerHTML = `
        <div class="w-6 h-6 bg-blue-500 rounded-full border-3 border-white shadow-lg flex items-center justify-center">
          <div class="w-3 h-3 bg-white rounded-full"></div>
        </div>
      `

      const userMarker = new mapboxgl.Marker(userMarkerElement)
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map.current)

      markers.current.push(userMarker)
    }

    // Add event markers
    filteredEvents.forEach((event) => {
      if (!event.venue.lat || !event.venue.lng) return

      const category = CATEGORIES.find((cat) => cat.id === event.category) || CATEGORIES[0]

      const markerElement = document.createElement("div")
      markerElement.className = "event-marker"
      markerElement.innerHTML = `
        <div class="relative cursor-pointer group">
          <div class="w-10 h-10 ${category.color} rounded-full border-2 border-white shadow-xl flex items-center justify-center transform transition-all duration-300 group-hover:scale-125 group-hover:shadow-2xl">
            <span class="text-white text-sm">${category.icon}</span>
          </div>
          <div class="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
            <span class="text-xs text-white">•</span>
          </div>
        </div>
      `

      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([event.venue.lng, event.venue.lat])
        .addTo(map.current!)

      markerElement.addEventListener("click", () => {
        setSelectedEvent(event)
        map.current?.flyTo({
          center: [event.venue.lng, event.venue.lat],
          zoom: 14,
          duration: 1000,
        })
      })

      // Enhanced popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        closeOnClick: false,
      }).setHTML(`
        <div class="p-4 min-w-[280px] bg-white rounded-lg shadow-xl">
          <div class="flex items-start justify-between mb-2">
            <h3 class="font-bold text-sm text-gray-900 pr-2 line-clamp-2">${event.title}</h3>
            <span class="text-xs px-2 py-1 ${category.color} text-white rounded-full flex-shrink-0">${event.category}</span>
          </div>
          <div class="space-y-1 mb-3 text-xs text-gray-600">
            <div class="flex items-center">
              <span class="mr-1">📅</span>
              <span>${event.startDate} • ${event.startTime}</span>
            </div>
            <div class="flex items-center">
              <span class="mr-1">📍</span>
              <span class="line-clamp-1">${event.venue.name}</span>
            </div>
            <div class="flex items-center">
              <span class="mr-1">🎫</span>
              <span class="font-semibold ${event.pricing.isFree ? "text-green-600" : "text-blue-600"}">
                ${event.pricing.isFree ? "Free" : `$${event.pricing.min}${event.pricing.max > event.pricing.min ? ` - $${event.pricing.max}` : ""}`}
              </span>
            </div>
            ${event.distance ? `<div class="flex items-center"><span class="mr-1">📏</span><span>${event.distance.toFixed(1)} miles away</span></div>` : ""}
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <span class="text-xs text-gray-500">by ${event.organizer.name}</span>
              ${event.organizer.verified ? '<span class="ml-1 text-blue-500">✓</span>' : ""}
            </div>
            <span class="text-xs px-2 py-1 bg-gray-100 rounded">${event.source}</span>
          </div>
        </div>
      `)

      markerElement.addEventListener("mouseenter", () => {
        popup.setLngLat([event.venue.lng, event.venue.lat]).addTo(map.current!)
      })

      markerElement.addEventListener("mouseleave", () => {
        popup.remove()
      })

      markers.current.push(marker)
    })

    // Fit map to show all events
    if (filteredEvents.length > 0 && userLocation) {
      const bounds = new mapboxgl.LngLatBounds()

      // Include user location
      bounds.extend([userLocation.lng, userLocation.lat])

      // Include all events
      filteredEvents.forEach((event) => {
        if (event.venue.lat && event.venue.lng) {
          bounds.extend([event.venue.lng, event.venue.lat])
        }
      })

      map.current.fitBounds(bounds, { padding: 100, maxZoom: 12 })
    }
  }, [filteredEvents, mapLoaded, mapError, viewMode, userLocation])

  // Filter events
  useEffect(() => {
    let filtered = events

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.venue.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((event) => event.category === selectedCategory)
    }

    // Free events filter
    if (showFreeOnly) {
      filtered = filtered.filter((event) => event.pricing.isFree)
    }

    // Sort events
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "distance":
          return (a.distance || 0) - (b.distance || 0)
        case "date":
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        case "popularity":
          return b.popularity - a.popularity
        case "price":
          if (a.pricing.isFree && !b.pricing.isFree) return -1
          if (!a.pricing.isFree && b.pricing.isFree) return 1
          return a.pricing.min - b.pricing.min
        default:
          return 0
      }
    })

    setFilteredEvents(filtered)
  }, [events, searchQuery, selectedCategory, showFreeOnly, sortBy])

  // Auto-search events when location is set
  useEffect(() => {
    if (userLocation && !showLocationSelector) {
      searchEvents()
    }
  }, [userLocation, showLocationSelector, searchEvents])

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    } catch {
      return dateString
    }
  }

  const formatTime = (timeString: string) => {
    if (!timeString || timeString === "TBD") return "TBD"
    try {
      const [hours, minutes] = timeString.split(":")
      const hour = Number.parseInt(hours)
      const ampm = hour >= 12 ? "PM" : "AM"
      const displayHour = hour % 12 || 12
      return `${displayHour}:${minutes} ${ampm}`
    } catch {
      return timeString
    }
  }

  // Location Selector Component
  if (showLocationSelector) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl"
        >
          <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-purple-400" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Find Events Near You</h1>
                <p className="text-gray-400 text-lg">Discover real-time events within 30 miles of your location</p>
              </div>

              {locationError && (
                <Alert className="mb-6 bg-red-500/10 border-red-500/20">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-400">{locationError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-6">
                {/* Current Location Button */}
                <Button
                  onClick={handleGetCurrentLocation}
                  disabled={isLocationLoading}
                  size="lg"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-14 text-lg"
                >
                  {isLocationLoading ? (
                    <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                  ) : (
                    <Navigation className="h-5 w-5 mr-3" />
                  )}
                  Use My Current Location
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-slate-900 px-4 text-gray-400">or enter a location</span>
                  </div>
                </div>

                {/* Manual Location Input */}
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 h-5 w-5" />
                    <Input
                      placeholder="Enter city, address, or zip code..."
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleLocationSearch(locationInput)
                        }
                      }}
                      className="pl-12 h-14 bg-white/10 border-white/20 text-white placeholder-white/70 focus:bg-white/20 transition-all text-lg"
                      disabled={isLocationLoading}
                    />
                  </div>
                  <Button
                    onClick={() => handleLocationSearch(locationInput)}
                    disabled={!locationInput.trim() || isLocationLoading}
                    size="lg"
                    className="bg-white/20 hover:bg-white/30 px-8 h-14"
                  >
                    {isLocationLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                  </Button>
                </div>

                {/* Popular Locations */}
                <div>
                  <p className="text-gray-400 text-sm mb-3">Popular locations:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {locationService
                      .getPopularLocations()
                      .slice(0, 8)
                      .map((location) => (
                        <Button
                          key={location.query}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLocationSearch(location.query)}
                          className="text-gray-400 hover:text-white hover:bg-white/10 text-xs p-2 h-auto"
                          disabled={isLocationLoading}
                        >
                          {location.name}
                        </Button>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="relative z-20 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">Live Events</h1>
              <Badge className="bg-green-600/80 text-white">{filteredEvents.length} events found</Badge>
              {lastSearchTime && (
                <Badge variant="outline" className="border-white/20 text-white/70">
                  <Clock className="h-3 w-3 mr-1" />
                  {lastSearchTime.toLocaleTimeString()}
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {/* Location Display */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLocationSelector(true)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <MapPin className="h-4 w-4 mr-2" />
                {userLocation?.city || "Change Location"}
              </Button>

              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={searchEvents}
                disabled={isEventsLoading}
                className="border-white/20 text-white hover:bg-white/10"
              >
                {isEventsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>

              {/* View Toggle */}
              <div className="flex items-center bg-white/10 rounded-lg p-1">
                <Button
                  variant={viewMode === "map" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("map")}
                  className={`${viewMode === "map" ? "bg-white text-black" : "text-white hover:bg-white/20"}`}
                >
                  <MapIcon className="h-4 w-4 mr-2" />
                  Map
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={`${viewMode === "grid" ? "bg-white text-black" : "text-white hover:bg-white/20"}`}
                >
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  List
                </Button>
              </div>

              {/* Filters Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Categories Bar */}
      <div className="relative z-10 bg-black/10 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Search Bar */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 h-5 w-5" />
              <Input
                placeholder="Search events, venues, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-white/10 border-white/20 text-white placeholder-white/70 focus:bg-white/20 transition-all rounded-xl"
              />
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((category) => {
              const count =
                category.id === "all" ? events.length : events.filter((e) => e.category === category.id).length

              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className={`whitespace-nowrap transition-all rounded-full ${
                    selectedCategory === category.id
                      ? `${category.color} text-white border-transparent shadow-lg`
                      : "border-white/20 text-white hover:bg-white/10"
                  }`}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.label}
                  <Badge variant="secondary" className="ml-2 bg-white/20 text-white">
                    {count}
                  </Badge>
                </Button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative z-10 bg-black/20 backdrop-blur-md border-b border-white/10 overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Sort By */}
                <div>
                  <Label className="text-white mb-2 block">Sort By</Label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full h-10 bg-white/10 border border-white/20 rounded-lg text-white px-3"
                  >
                    <option value="distance" className="bg-gray-800">
                      Distance
                    </option>
                    <option value="date" className="bg-gray-800">
                      Date
                    </option>
                    <option value="popularity" className="bg-gray-800">
                      Popularity
                    </option>
                    <option value="price" className="bg-gray-800">
                      Price
                    </option>
                  </select>
                </div>

                {/* Radius Filter */}
                <div>
                  <Label className="text-white mb-2 block">Search Radius</Label>
                  <select
                    value={radiusFilter}
                    onChange={(e) => setRadiusFilter(Number(e.target.value))}
                    className="w-full h-10 bg-white/10 border border-white/20 rounded-lg text-white px-3"
                  >
                    <option value={10} className="bg-gray-800">
                      10 miles
                    </option>
                    <option value={25} className="bg-gray-800">
                      25 miles
                    </option>
                    <option value={30} className="bg-gray-800">
                      30 miles
                    </option>
                    <option value={50} className="bg-gray-800">
                      50 miles
                    </option>
                    <option value={100} className="bg-gray-800">
                      100 miles
                    </option>
                  </select>
                </div>

                {/* Toggle Filters */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Free Events Only</Label>
                    <Switch checked={showFreeOnly} onCheckedChange={setShowFreeOnly} />
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-2">Search Results</h3>
                  <div className="space-y-2 text-sm text-white/80">
                    <div className="flex justify-between">
                      <span>Total Events:</span>
                      <span className="text-purple-400">{filteredEvents.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Free Events:</span>
                      <span className="text-green-400">{filteredEvents.filter((e) => e.pricing.isFree).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Radius:</span>
                      <span className="text-blue-400">{radiusFilter} miles</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {isEventsLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg">Searching for events...</p>
            <p className="text-gray-400 text-sm">Fetching real-time data from multiple sources</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {eventsError && !isEventsLoading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert className="bg-red-500/10 border-red-500/20">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-400">{eventsError}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      {!isEventsLoading && !eventsError && (
        <div className="relative flex-1">
          {viewMode === "map" ? (
            // Map View
            <div className="relative h-[calc(100vh-200px)]">
              {mapError ? (
                <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                  <div className="text-center text-white">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <X className="h-8 w-8 text-red-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Map Unavailable</h3>
                    <p className="text-gray-400 mb-4">Switching to list view...</p>
                    <Button onClick={() => setViewMode("grid")} className="bg-purple-600 hover:bg-purple-700">
                      <Grid3X3 className="h-4 w-4 mr-2" />
                      View List
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div ref={mapContainer} className="w-full h-full" />
                  {!mapLoaded && (
                    <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-lg">Loading Interactive Map...</p>
                        <p className="text-sm text-gray-400 mt-2">Powered by Mapbox</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            // Grid View
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="cursor-pointer"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white overflow-hidden hover:bg-white/15 transition-all duration-300 group h-full">
                      <div className="relative h-48 overflow-hidden">
                        {event.images.length > 0 ? (
                          <img
                            src={event.images[0] || "/placeholder.svg"}
                            alt={event.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                            <span className="text-6xl opacity-50">
                              {CATEGORIES.find((cat) => cat.id === event.category)?.icon || "🎪"}
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex gap-2">
                          <Badge
                            className={`${CATEGORIES.find((cat) => cat.id === event.category)?.color || "bg-gray-500"} text-white`}
                          >
                            {CATEGORIES.find((cat) => cat.id === event.category)?.icon} {event.category}
                          </Badge>
                          {event.pricing.isFree && <Badge className="bg-green-500/90 text-white">Free</Badge>}
                        </div>

                        {/* Price */}
                        <div className="absolute bottom-3 right-3">
                          <div className="bg-black/70 rounded-full px-3 py-1 backdrop-blur-sm">
                            <span className="text-white font-bold text-sm">
                              {event.pricing.isFree
                                ? "Free"
                                : `$${event.pricing.min}${event.pricing.max > event.pricing.min ? ` - $${event.pricing.max}` : ""}`}
                            </span>
                          </div>
                        </div>

                        {/* Rating */}
                        {event.rating && (
                          <div className="absolute bottom-3 left-3">
                            <div className="bg-black/70 rounded-full px-2 py-1 backdrop-blur-sm flex items-center">
                              <Star className="h-3 w-3 text-yellow-400 mr-1" />
                              <span className="text-white text-sm">{event.rating.toFixed(1)}</span>
                            </div>
                          </div>
                        )}

                        {/* Source Badge */}
                        <div className="absolute top-3 right-3">
                          <Badge variant="outline" className="bg-black/50 border-white/20 text-white text-xs">
                            {event.source}
                          </Badge>
                        </div>
                      </div>

                      <CardContent className="p-6 flex-1 flex flex-col">
                        <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors">
                          {event.title}
                        </h3>

                        <div className="space-y-2 mb-4 text-sm text-white/80 flex-1">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-purple-400 flex-shrink-0" />
                            <span>
                              {formatDate(event.startDate)} • {formatTime(event.startTime)}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-purple-400 flex-shrink-0" />
                            <span className="line-clamp-1">{event.venue.name}</span>
                          </div>
                          <div className="flex items-center">
                            <Navigation className="h-4 w-4 mr-2 text-purple-400 flex-shrink-0" />
                            <span>
                              {event.distance ? `${event.distance.toFixed(1)} miles away` : "Distance unknown"}
                            </span>
                          </div>
                          {event.venue.city && (
                            <div className="flex items-center">
                              <span className="h-4 w-4 mr-2 text-purple-400 flex-shrink-0">🏙️</span>
                              <span className="line-clamp-1">
                                {event.venue.city}, {event.venue.state}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center">
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarFallback className="text-xs bg-purple-600">
                                {event.organizer.name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-gray-400 truncate">{event.organizer.name}</span>
                            {event.organizer.verified && (
                              <Badge variant="secondary" className="ml-2 text-xs bg-blue-500/20 text-blue-400">
                                ✓
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {filteredEvents.length === 0 && !isEventsLoading && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No Events Found</h3>
                  <p className="text-gray-400 mb-4">
                    No events found within {radiusFilter} miles of {userLocation?.displayName}
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => setRadiusFilter(50)} className="bg-purple-600 hover:bg-purple-700">
                      Expand to 50 miles
                    </Button>
                    <Button
                      onClick={() => {
                        setSearchQuery("")
                        setSelectedCategory("all")
                        setShowFreeOnly(false)
                      }}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Event Details Panel */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto"
          >
            {/* Event Header */}
            <div className="relative h-80 overflow-hidden">
              {selectedEvent.images.length > 0 ? (
                <img
                  src={selectedEvent.images[0] || "/placeholder.svg"}
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                  <span className="text-8xl opacity-50">
                    {CATEGORIES.find((cat) => cat.id === selectedEvent.category)?.icon || "🎪"}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Header Controls */}
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full"
                >
                  <Share2 className="h-4 w-4 text-white" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full"
                >
                  <Heart className="h-4 w-4 text-white" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEvent(null)}
                  className="h-10 w-10 p-0 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full"
                >
                  <X className="h-4 w-4 text-white" />
                </Button>
              </div>

              {/* Event Info Overlay */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center gap-2 mb-3">
                  <Badge
                    className={`${CATEGORIES.find((cat) => cat.id === selectedEvent.category)?.color || "bg-gray-500"} text-white`}
                  >
                    {CATEGORIES.find((cat) => cat.id === selectedEvent.category)?.icon} {selectedEvent.category}
                  </Badge>
                  {selectedEvent.pricing.isFree && <Badge className="bg-green-500/90 text-white">Free Event</Badge>}
                  <Badge variant="outline" className="bg-black/50 border-white/20 text-white">
                    {selectedEvent.source}
                  </Badge>
                  {selectedEvent.rating && (
                    <div className="flex items-center bg-black/50 rounded-full px-2 py-1">
                      <Star className="h-3 w-3 text-yellow-400 mr-1" />
                      <span className="text-white text-sm">{selectedEvent.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-white mb-2 line-clamp-3">{selectedEvent.title}</h1>
                <div className="flex items-center text-white/90">
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarFallback className="bg-purple-600">{selectedEvent.organizer.name[0]}</AvatarFallback>
                  </Avatar>
                  <span>by {selectedEvent.organizer.name}</span>
                  {selectedEvent.organizer.verified && (
                    <Badge variant="secondary" className="ml-2 text-xs bg-blue-500/20 text-blue-400">
                      ✓ Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Event Content */}
            <div className="p-6">
              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center text-gray-600 mb-1">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="text-sm">Date & Time</span>
                  </div>
                  <div className="font-semibold">{formatDate(selectedEvent.startDate)}</div>
                  <div className="text-sm text-gray-600">
                    {formatTime(selectedEvent.startTime)}
                    {selectedEvent.endTime && ` - ${formatTime(selectedEvent.endTime)}`}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center text-gray-600 mb-1">
                    <DollarSign className="h-4 w-4 mr-2" />
                    <span className="text-sm">Pricing</span>
                  </div>
                  <div className="font-semibold text-green-600">
                    {selectedEvent.pricing.isFree
                      ? "Free"
                      : `$${selectedEvent.pricing.min}${selectedEvent.pricing.max > selectedEvent.pricing.min ? ` - $${selectedEvent.pricing.max}` : ""}`}
                  </div>
                  <div className="text-sm text-gray-600">{selectedEvent.pricing.currency}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center text-gray-600 mb-1">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="text-sm">Location</span>
                  </div>
                  <div className="font-semibold">{selectedEvent.venue.name}</div>
                  <div className="text-sm text-gray-600">
                    {selectedEvent.distance ? `${selectedEvent.distance.toFixed(1)} miles away` : "Distance unknown"}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center text-gray-600 mb-1">
                    <Users className="h-4 w-4 mr-2" />
                    <span className="text-sm">Popularity</span>
                  </div>
                  <div className="font-semibold">{selectedEvent.popularity}</div>
                  <div className="text-sm text-gray-600">interest score</div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Description */}
              {selectedEvent.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">About This Event</h3>
                  <p className="text-gray-700 leading-relaxed">{selectedEvent.description}</p>
                </div>
              )}

              {/* Venue Details */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Venue Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="font-medium">{selectedEvent.venue.name}</div>
                  <div className="text-sm text-gray-600 mb-2">
                    {selectedEvent.venue.address && `${selectedEvent.venue.address}, `}
                    {selectedEvent.venue.city}, {selectedEvent.venue.state} {selectedEvent.venue.country}
                  </div>
                  {selectedEvent.venue.lat && selectedEvent.venue.lng && (
                    <div className="text-sm text-gray-500">
                      Coordinates: {selectedEvent.venue.lat.toFixed(4)}, {selectedEvent.venue.lng.toFixed(4)}
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {selectedEvent.tags.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {selectedEvent.ticketUrl && (
                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white h-12"
                    onClick={() => window.open(selectedEvent.ticketUrl, "_blank")}
                  >
                    <Ticket className="h-4 w-4 mr-2" />
                    Get Tickets - {selectedEvent.pricing.isFree ? "Free" : `$${selectedEvent.pricing.min}+`}
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-10">
                    <Heart className="h-4 w-4 mr-2" />
                    Save Event
                  </Button>
                  <Button variant="outline" className="h-10">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
