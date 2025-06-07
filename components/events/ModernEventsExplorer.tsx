"use client"

import { useState, useEffect, useRef } from "react"
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
  TrendingUp,
  Navigation,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { CLIENT_CONFIG } from "@/lib/env"

// Import Mapbox GL JS
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"

// This component now uses real events passed via props

const CATEGORIES = [
  { id: "All", label: "All Events", color: "bg-gradient-to-r from-purple-500 to-pink-500", icon: "🎪", count: 6 },
  { id: "Music", label: "Music", color: "bg-gradient-to-r from-purple-600 to-blue-600", icon: "🎵", count: 1 },
  { id: "Technology", label: "Tech", color: "bg-gradient-to-r from-blue-600 to-cyan-600", icon: "💻", count: 1 },
  { id: "Arts", label: "Arts", color: "bg-gradient-to-r from-pink-600 to-rose-600", icon: "🎨", count: 1 },
  { id: "Food", label: "Food", color: "bg-gradient-to-r from-orange-600 to-red-600", icon: "🍽️", count: 1 },
  { id: "Sports", label: "Sports", color: "bg-gradient-to-r from-green-600 to-emerald-600", icon: "⚽", count: 1 },
  { id: "Business", label: "Business", color: "bg-gradient-to-r from-gray-600 to-slate-600", icon: "💼", count: 1 },
]

interface ModernEventsExplorerProps {
  events?: any[]
}

export default function ModernEventsExplorer({ events = [] }: ModernEventsExplorerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<mapboxgl.Marker[]>([])

  // State management
  const [filteredEvents, setFilteredEvents] = useState(events)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [viewMode, setViewMode] = useState<"map" | "grid">("map")
  const [showFilters, setShowFilters] = useState(false)
  const [userLocation, setUserLocation] = useState("New York, NY")
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  // Filter states
  const [priceRange, setPriceRange] = useState([0, 500])
  const [dateFilter, setDateFilter] = useState("all")
  const [showFreeOnly, setShowFreeOnly] = useState(false)
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false)
  const [sortBy, setSortBy] = useState("date")

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
        center: [-73.9654, 40.7829],
        zoom: 11,
        pitch: 45,
        bearing: 0,
      })

      map.current.on("load", () => {
        setMapLoaded(true)
        setMapError(null)
      })

      map.current.on("error", (e) => {
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
      setMapError("Failed to initialize map")
    }

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [viewMode])

  // Add event markers to map
  useEffect(() => {
    if (!map.current || !mapLoaded || mapError || viewMode !== "map") return

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove())
    markers.current = []

    // Add new markers
    filteredEvents.forEach((event) => {
      const category = CATEGORIES.find((cat) => cat.id === event.category)

      const markerElement = document.createElement("div")
      markerElement.className = "event-marker"
      markerElement.innerHTML = `
        <div class="relative cursor-pointer group">
          <div class="w-12 h-12 ${category?.color || "bg-gray-500"} rounded-full border-3 border-white shadow-xl flex items-center justify-center transform transition-all duration-300 group-hover:scale-125 group-hover:shadow-2xl">
            <span class="text-white text-lg">${category?.icon || "📍"}</span>
          </div>
          ${event.featured ? '<div class="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full border-2 border-white flex items-center justify-center"><span class="text-xs">⭐</span></div>' : ""}
          ${event.trending ? '<div class="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center"><span class="text-xs">🔥</span></div>' : ""}
        </div>
      `

      const marker = new mapboxgl.Marker(markerElement).setLngLat([event.lng, event.lat]).addTo(map.current!)

      markerElement.addEventListener("click", () => {
        setSelectedEvent(event)
        map.current?.flyTo({
          center: [event.lng, event.lat],
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
        <div class="p-4 min-w-[250px] bg-white rounded-lg shadow-xl">
          <div class="flex items-start justify-between mb-2">
            <h3 class="font-bold text-sm text-gray-900 pr-2">${event.title}</h3>
            ${event.featured ? '<span class="text-yellow-500 text-xs">⭐</span>' : ""}
          </div>
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs px-2 py-1 ${category?.color} text-white rounded-full">${event.category}</span>
            <span class="text-xs text-gray-500">${event.rating} ⭐</span>
          </div>
          <p class="text-xs text-gray-600 mb-2">${event.date} • ${event.time}</p>
          <p class="text-xs text-gray-800 mb-2">${event.location}</p>
          <div class="flex items-center justify-between">
            <span class="text-sm font-bold text-green-600">${event.price}</span>
            <span class="text-xs text-gray-500">${event.attendees.toLocaleString()} attending</span>
          </div>
          <div class="text-xs text-purple-600 mt-1">${event.distance} away</div>
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
  }, [filteredEvents, mapLoaded, mapError, viewMode])

  // Update filtered events when events prop changes
  useEffect(() => {
    setFilteredEvents(events)
  }, [events])

  // Filter events
  useEffect(() => {
    let filtered = events

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (event) =>
          event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (event.tags && event.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))),
      )
    }

    // Category filter
    if (selectedCategory !== "All") {
      filtered = filtered.filter((event) => event.category === selectedCategory)
    }

    // Free events filter
    if (showFreeOnly) {
      filtered = filtered.filter((event) => event.price?.toLowerCase().includes("free"))
    }

    // Featured events filter
    if (showFeaturedOnly) {
      filtered = filtered.filter((event) => event.featured)
    }

    // Sort events
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime()
        case "popularity":
          return (b.attendees || 0) - (a.attendees || 0)
        case "rating":
          return (b.rating || 0) - (a.rating || 0)
        case "distance":
          return Number.parseFloat(a.distance || "0") - Number.parseFloat(b.distance || "0")
        default:
          return 0
      }
    })

    setFilteredEvents(filtered)
  }, [events, searchQuery, selectedCategory, showFreeOnly, showFeaturedOnly, sortBy])

  const getCategoryInfo = (categoryId: string) => {
    return CATEGORIES.find((cat) => cat.id === categoryId) || CATEGORIES[0]
  }

  const handleEventSelect = (event: any) => {
    setSelectedEvent(event)
    if (map.current && viewMode === "map") {
      map.current.flyTo({
        center: [event.lng, event.lat],
        zoom: 14,
        duration: 1000,
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="relative z-20 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">Events Explorer</h1>
              <Badge className="bg-purple-600/80 text-white">{filteredEvents.length} events</Badge>
            </div>

            <div className="flex items-center space-x-4">
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
                  Grid
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
            <Button
              variant="outline"
              size="lg"
              className="border-white/20 text-white hover:bg-white/10 h-12 px-6 rounded-xl"
            >
              <MapPin className="h-4 w-4 mr-2" />
              {userLocation}
            </Button>
          </div>

          {/* Category Pills */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((category) => (
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
                  {category.count}
                </Badge>
              </Button>
            ))}
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
                    <option value="date" className="bg-gray-800">
                      Date
                    </option>
                    <option value="popularity" className="bg-gray-800">
                      Popularity
                    </option>
                    <option value="rating" className="bg-gray-800">
                      Rating
                    </option>
                    <option value="distance" className="bg-gray-800">
                      Distance
                    </option>
                  </select>
                </div>

                {/* Date Filter */}
                <div>
                  <Label className="text-white mb-2 block">Date Range</Label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full h-10 bg-white/10 border border-white/20 rounded-lg text-white px-3"
                  >
                    <option value="all" className="bg-gray-800">
                      All Dates
                    </option>
                    <option value="today" className="bg-gray-800">
                      Today
                    </option>
                    <option value="week" className="bg-gray-800">
                      This Week
                    </option>
                    <option value="month" className="bg-gray-800">
                      This Month
                    </option>
                  </select>
                </div>

                {/* Toggle Filters */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Free Events Only</Label>
                    <Switch checked={showFreeOnly} onCheckedChange={setShowFreeOnly} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Featured Only</Label>
                    <Switch checked={showFeaturedOnly} onCheckedChange={setShowFeaturedOnly} />
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-2">Quick Stats</h3>
                  <div className="space-y-2 text-sm text-white/80">
                    <div className="flex justify-between">
                      <span>Total Events:</span>
                      <span className="text-purple-400">{filteredEvents.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Free Events:</span>
                      <span className="text-green-400">
                        {filteredEvents.filter((e) => e.price.toLowerCase().includes("free")).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Featured:</span>
                      <span className="text-yellow-400">{filteredEvents.filter((e) => e.featured).length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
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
                  <p className="text-gray-400 mb-4">Switching to grid view...</p>
                  <Button onClick={() => setViewMode("grid")} className="bg-purple-600 hover:bg-purple-700">
                    <Grid3X3 className="h-4 w-4 mr-2" />
                    View Grid
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
                  onClick={() => handleEventSelect(event)}
                >
                  <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white overflow-hidden hover:bg-white/15 transition-all duration-300 group">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={
                          event.image || "/placeholder.svg?height=192&width=400&text=" + encodeURIComponent(event.title)
                        }
                        alt={event.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        <Badge className={`${getCategoryInfo(event.category).color} text-white`}>
                          {getCategoryInfo(event.category).icon} {event.category}
                        </Badge>
                        {event.featured && (
                          <Badge className="bg-yellow-500/90 text-white">
                            <Star className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                        {event.trending && (
                          <Badge className="bg-red-500/90 text-white">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Trending
                          </Badge>
                        )}
                      </div>

                      {/* Price */}
                      <div className="absolute bottom-3 right-3">
                        <div className="bg-black/70 rounded-full px-3 py-1 backdrop-blur-sm">
                          <span className="text-white font-bold text-sm">{event.price}</span>
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="absolute bottom-3 left-3">
                        <div className="bg-black/70 rounded-full px-2 py-1 backdrop-blur-sm flex items-center">
                          <Star className="h-3 w-3 text-yellow-400 mr-1" />
                          <span className="text-white text-sm">{event.rating}</span>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-6">
                      <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors">
                        {event.title}
                      </h3>

                      <div className="space-y-2 mb-4 text-sm text-white/80">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-purple-400" />
                          <span>
                            {event.date} • {event.time}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-purple-400" />
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-purple-400" />
                          <span>{event.attendees.toLocaleString()} attending</span>
                        </div>
                        <div className="flex items-center">
                          <Navigation className="h-4 w-4 mr-2 text-purple-400" />
                          <span>{event.distance} away</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src={event.organizer.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs">{event.organizer.name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-400 truncate">{event.organizer.name}</span>
                          {event.organizer.verified && (
                            <Badge variant="secondary" className="ml-2 text-xs">
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

            {filteredEvents.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No Events Found</h3>
                <p className="text-gray-400 mb-4">Try adjusting your search criteria or filters</p>
                <Button
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedCategory("All")
                    setShowFreeOnly(false)
                    setShowFeaturedOnly(false)
                  }}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

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
              <img
                src={
                  selectedEvent.image ||
                  "/placeholder.svg?height=320&width=500&text=" + encodeURIComponent(selectedEvent.title)
                }
                alt={selectedEvent.title}
                className="w-full h-full object-cover"
              />
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
                  <Badge className={`${getCategoryInfo(selectedEvent.category).color} text-white`}>
                    {getCategoryInfo(selectedEvent.category).icon} {selectedEvent.category}
                  </Badge>
                  {selectedEvent.featured && (
                    <Badge className="bg-yellow-500/90 text-white">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  <div className="flex items-center bg-black/50 rounded-full px-2 py-1">
                    <Star className="h-3 w-3 text-yellow-400 mr-1" />
                    <span className="text-white text-sm">{selectedEvent.rating}</span>
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">{selectedEvent.title}</h1>
                <div className="flex items-center text-white/90">
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarImage src={selectedEvent.organizer.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{selectedEvent.organizer.name[0]}</AvatarFallback>
                  </Avatar>
                  <span>by {selectedEvent.organizer.name}</span>
                  {selectedEvent.organizer.verified && (
                    <Badge variant="secondary" className="ml-2 text-xs">
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
                  <div className="font-semibold">{selectedEvent.date}</div>
                  <div className="text-sm text-gray-600">
                    {selectedEvent.time} - {selectedEvent.endTime}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center text-gray-600 mb-1">
                    <Users className="h-4 w-4 mr-2" />
                    <span className="text-sm">Attendance</span>
                  </div>
                  <div className="font-semibold">{selectedEvent.attendees.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">of {selectedEvent.capacity.toLocaleString()}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center text-gray-600 mb-1">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="text-sm">Location</span>
                  </div>
                  <div className="font-semibold">{selectedEvent.venue.name}</div>
                  <div className="text-sm text-gray-600">{selectedEvent.distance} away</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center text-gray-600 mb-1">
                    <Ticket className="h-4 w-4 mr-2" />
                    <span className="text-sm">Price</span>
                  </div>
                  <div className="font-semibold text-green-600">{selectedEvent.price}</div>
                  {selectedEvent.originalPrice !== selectedEvent.price && (
                    <div className="text-sm text-gray-500 line-through">{selectedEvent.originalPrice}</div>
                  )}
                </div>
              </div>

              <Separator className="my-6" />

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">About This Event</h3>
                <p className="text-gray-700 leading-relaxed">{selectedEvent.description}</p>
              </div>

              {/* Venue Details */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Venue Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="font-medium">{selectedEvent.venue.name}</div>
                  <div className="text-sm text-gray-600 mb-2">{selectedEvent.address}</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Type: {selectedEvent.venue.type}</span>
                    <span className="text-gray-600">Capacity: {selectedEvent.venue.capacity.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white h-12">
                  <Ticket className="h-4 w-4 mr-2" />
                  Get Tickets - {selectedEvent.price}
                </Button>
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
