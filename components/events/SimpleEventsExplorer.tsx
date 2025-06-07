"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  MapPin,
  Filter,
  Calendar,
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
import { logger } from "@/lib/utils/logger"

// Simple event interface
interface SimpleEvent {
  id: string
  title: string
  description: string
  category: string
  startDate: string
  startTime: string
  venue: {
    name: string
    address: string
    city: string
    state: string
    lat: number
    lng: number
  }
  pricing: {
    min: number
    max: number
    isFree: boolean
  }
  organizer: {
    name: string
    verified: boolean
  }
  images: string[]
  ticketUrl?: string
  rating?: number
  tags: string[]
  source: string
  distance?: number
  popularity: number
}

// Simple location interface
interface SimpleLocation {
  lat: number
  lng: number
  city: string
  state: string
  displayName: string
}

const CATEGORIES = [
  { id: "all", label: "All Events", color: "bg-gradient-to-r from-purple-500 to-pink-500", icon: "🎪" },
  { id: "Music", label: "Music", color: "bg-gradient-to-r from-purple-600 to-blue-600", icon: "🎵" },
  { id: "Sports", label: "Sports", color: "bg-gradient-to-r from-green-600 to-emerald-600", icon: "⚽" },
  { id: "Arts", label: "Arts & Theater", color: "bg-gradient-to-r from-pink-600 to-rose-600", icon: "🎨" },
  { id: "Comedy", label: "Comedy", color: "bg-gradient-to-r from-yellow-600 to-orange-600", icon: "😂" },
  { id: "Family", label: "Family", color: "bg-gradient-to-r from-blue-600 to-cyan-600", icon: "👨‍👩‍👧‍👦" },
  { id: "Business", label: "Business", color: "bg-gradient-to-r from-gray-600 to-slate-600", icon: "💼" },
]

// Sample events data that always works
const SAMPLE_EVENTS: SimpleEvent[] = [
  {
    id: "1",
    title: "Summer Music Festival 2024",
    description: "Join us for an amazing outdoor music festival featuring top artists from around the world.",
    category: "Music",
    startDate: "2024-07-15",
    startTime: "18:00",
    venue: {
      name: "Central Park",
      address: "Central Park West",
      city: "New York",
      state: "NY",
      lat: 40.7829,
      lng: -73.9654,
    },
    pricing: { min: 75, max: 150, isFree: false },
    organizer: { name: "Music Events Co", verified: true },
    images: ["/placeholder.svg?height=300&width=400&text=Music+Festival"],
    ticketUrl: "https://example.com/tickets",
    rating: 4.8,
    tags: ["music", "festival", "outdoor", "summer"],
    source: "Ticketmaster",
    popularity: 950,
  },
  {
    id: "2",
    title: "Tech Conference 2024",
    description: "Learn about the latest in technology and innovation from industry leaders.",
    category: "Business",
    startDate: "2024-08-20",
    startTime: "09:00",
    venue: {
      name: "Convention Center",
      address: "123 Tech Street",
      city: "San Francisco",
      state: "CA",
      lat: 37.7749,
      lng: -122.4194,
    },
    pricing: { min: 200, max: 500, isFree: false },
    organizer: { name: "Tech Events", verified: true },
    images: ["/placeholder.svg?height=300&width=400&text=Tech+Conference"],
    ticketUrl: "https://example.com/tech-tickets",
    rating: 4.6,
    tags: ["technology", "conference", "networking", "innovation"],
    source: "Eventbrite",
    popularity: 800,
  },
  {
    id: "3",
    title: "Comedy Night Live",
    description: "Laugh out loud with the best comedians in the city. A night full of humor and entertainment.",
    category: "Comedy",
    startDate: "2024-06-30",
    startTime: "20:00",
    venue: {
      name: "Comedy Club Downtown",
      address: "456 Laugh Lane",
      city: "Chicago",
      state: "IL",
      lat: 41.8781,
      lng: -87.6298,
    },
    pricing: { min: 25, max: 50, isFree: false },
    organizer: { name: "Laugh Factory", verified: true },
    images: ["/placeholder.svg?height=300&width=400&text=Comedy+Night"],
    ticketUrl: "https://example.com/comedy-tickets",
    rating: 4.9,
    tags: ["comedy", "entertainment", "nightlife", "standup"],
    source: "Local Venue",
    popularity: 650,
  },
  {
    id: "4",
    title: "Art Gallery Opening",
    description: "Discover amazing contemporary art from local and international artists.",
    category: "Arts",
    startDate: "2024-07-05",
    startTime: "18:30",
    venue: {
      name: "Modern Art Gallery",
      address: "789 Art Avenue",
      city: "Los Angeles",
      state: "CA",
      lat: 34.0522,
      lng: -118.2437,
    },
    pricing: { min: 0, max: 0, isFree: true },
    organizer: { name: "Art Collective", verified: false },
    images: ["/placeholder.svg?height=300&width=400&text=Art+Gallery"],
    rating: 4.4,
    tags: ["art", "gallery", "contemporary", "culture"],
    source: "PredictHQ",
    popularity: 400,
  },
  {
    id: "5",
    title: "Family Fun Day",
    description: "A day full of activities for the whole family. Games, food, and entertainment for all ages.",
    category: "Family",
    startDate: "2024-07-10",
    startTime: "10:00",
    venue: {
      name: "City Park",
      address: "100 Family Street",
      city: "Austin",
      state: "TX",
      lat: 30.2672,
      lng: -97.7431,
    },
    pricing: { min: 0, max: 0, isFree: true },
    organizer: { name: "City Recreation", verified: true },
    images: ["/placeholder.svg?height=300&width=400&text=Family+Fun"],
    rating: 4.7,
    tags: ["family", "kids", "outdoor", "community"],
    source: "Community",
    popularity: 750,
  },
  {
    id: "6",
    title: "Basketball Championship",
    description: "Watch the best teams compete in this exciting basketball championship game.",
    category: "Sports",
    startDate: "2024-08-15",
    startTime: "19:00",
    venue: {
      name: "Sports Arena",
      address: "500 Sports Way",
      city: "Miami",
      state: "FL",
      lat: 25.7617,
      lng: -80.1918,
    },
    pricing: { min: 50, max: 200, isFree: false },
    organizer: { name: "Sports League", verified: true },
    images: ["/placeholder.svg?height=300&width=400&text=Basketball"],
    ticketUrl: "https://example.com/sports-tickets",
    rating: 4.5,
    tags: ["basketball", "sports", "championship", "arena"],
    source: "Ticketmaster",
    popularity: 900,
  },
]

// Predefined locations
const POPULAR_LOCATIONS: Array<{ name: string; location: SimpleLocation }> = [
  {
    name: "New York, NY",
    location: { lat: 40.7128, lng: -74.006, city: "New York", state: "NY", displayName: "New York, NY" },
  },
  {
    name: "Los Angeles, CA",
    location: { lat: 34.0522, lng: -118.2437, city: "Los Angeles", state: "CA", displayName: "Los Angeles, CA" },
  },
  {
    name: "Chicago, IL",
    location: { lat: 41.8781, lng: -87.6298, city: "Chicago", state: "IL", displayName: "Chicago, IL" },
  },
  {
    name: "San Francisco, CA",
    location: { lat: 37.7749, lng: -122.4194, city: "San Francisco", state: "CA", displayName: "San Francisco, CA" },
  },
  {
    name: "Miami, FL",
    location: { lat: 25.7617, lng: -80.1918, city: "Miami", state: "FL", displayName: "Miami, FL" },
  },
  {
    name: "Austin, TX",
    location: { lat: 30.2672, lng: -97.7431, city: "Austin", state: "TX", displayName: "Austin, TX" },
  },
]

export default function SimpleEventsExplorer() {
  // Location state
  const [userLocation, setUserLocation] = useState<SimpleLocation | null>(null)
  const [locationInput, setLocationInput] = useState("")
  const [isLocationLoading, setIsLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [showLocationSelector, setShowLocationSelector] = useState(true)

  // Events state
  const [events, setEvents] = useState<SimpleEvent[]>([])
  const [filteredEvents, setFilteredEvents] = useState<SimpleEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<SimpleEvent | null>(null)
  const [isEventsLoading, setIsEventsLoading] = useState(false)
  const [lastSearchTime, setLastSearchTime] = useState<Date | null>(null)

  // UI state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [showFilters, setShowFilters] = useState(false)

  // Filter states
  const [showFreeOnly, setShowFreeOnly] = useState(false)
  const [sortBy, setSortBy] = useState("distance")
  const [radiusFilter, setRadiusFilter] = useState(30)

  // Calculate distance between two points
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 3959 // Earth's radius in miles
    const dLat = (lat2 - lat1) * (Math.PI / 180)
    const dLng = (lng2 - lng1) * (Math.PI / 180)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }, [])

  // Get current location
  const handleGetCurrentLocation = useCallback(async () => {
    setIsLocationLoading(true)
    setLocationError(null)

    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by this browser")
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        })
      })

      const { latitude, longitude } = position.coords
      const location: SimpleLocation = {
        lat: latitude,
        lng: longitude,
        city: "Current Location",
        state: "",
        displayName: "Current Location",
      }

      setUserLocation(location)
      setLocationInput(location.displayName)
      setShowLocationSelector(false)

      logger.info("Current location set", {
        component: "SimpleEventsExplorer",
        action: "getCurrentLocation",
        metadata: { location: location.displayName },
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to get current location"
      setLocationError(errorMessage)

      logger.error("Failed to get current location", {
        component: "SimpleEventsExplorer",
        action: "getCurrentLocation",
        error: errorMessage,
      })
    } finally {
      setIsLocationLoading(false)
    }
  }, [])

  // Search for location
  const handleLocationSearch = useCallback((query: string) => {
    if (!query.trim()) return

    setIsLocationLoading(true)
    setLocationError(null)

    try {
      // Find matching location from predefined list
      const normalizedQuery = query.toLowerCase()
      const matchedLocation = POPULAR_LOCATIONS.find(
        (loc) =>
          loc.name.toLowerCase().includes(normalizedQuery) ||
          loc.location.city.toLowerCase().includes(normalizedQuery) ||
          loc.location.state.toLowerCase().includes(normalizedQuery),
      )

      if (matchedLocation) {
        setUserLocation(matchedLocation.location)
        setLocationInput(matchedLocation.location.displayName)
        setShowLocationSelector(false)

        logger.info("Location search successful", {
          component: "SimpleEventsExplorer",
          action: "searchLocation",
          metadata: { query, location: matchedLocation.location.displayName },
        })
      } else {
        // Default to San Francisco if no match
        const defaultLocation = POPULAR_LOCATIONS[3].location
        setUserLocation(defaultLocation)
        setLocationInput(defaultLocation.displayName)
        setShowLocationSelector(false)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to search location"
      setLocationError(errorMessage)

      logger.error("Location search failed", {
        component: "SimpleEventsExplorer",
        action: "searchLocation",
        error: errorMessage,
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

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Calculate distances and filter events
      const eventsWithDistance = SAMPLE_EVENTS.map((event) => ({
        ...event,
        distance: calculateDistance(userLocation.lat, userLocation.lng, event.venue.lat, event.venue.lng),
      })).filter((event) => event.distance <= radiusFilter)

      setEvents(eventsWithDistance)
      setLastSearchTime(new Date())

      logger.info("Event search completed", {
        component: "SimpleEventsExplorer",
        action: "searchEvents",
        metadata: {
          eventsFound: eventsWithDistance.length,
          location: userLocation.displayName,
          radius: radiusFilter,
        },
      })
    } catch (error) {
      logger.error("Event search failed", {
        component: "SimpleEventsExplorer",
        action: "searchEvents",
        error: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setIsEventsLoading(false)
    }
  }, [userLocation, radiusFilter, calculateDistance])

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
                <p className="text-gray-400 text-lg">Discover events within {radiusFilter} miles of your location</p>
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
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-14 text-lg disabled:opacity-50"
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
                    <span className="bg-slate-900 px-4 text-gray-400">or choose a city</span>
                  </div>
                </div>

                {/* Manual Location Input */}
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 h-5 w-5" />
                    <Input
                      placeholder="Enter city name..."
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
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {POPULAR_LOCATIONS.map((location) => (
                      <Button
                        key={location.name}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLocationSearch(location.name)}
                        className="text-gray-400 hover:text-white hover:bg-white/10 text-sm p-3 h-auto"
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
              <h1 className="text-2xl font-bold text-white">Events Explorer</h1>
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
            <p className="text-gray-400 text-sm">Finding the best events near you</p>
          </div>
        </div>
      )}

      {/* Main Content - Grid View */}
      {!isEventsLoading && (
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
                    <img
                      src={event.images[0] || "/placeholder.svg?height=300&width=400&text=Event"}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
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
                        <span>{event.distance ? `${event.distance.toFixed(1)} miles away` : "Distance unknown"}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="h-4 w-4 mr-2 text-purple-400 flex-shrink-0">🏙️</span>
                        <span className="line-clamp-1">
                          {event.venue.city}, {event.venue.state}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarFallback className="text-xs bg-purple-600">{event.organizer.name[0]}</AvatarFallback>
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
                <Button onClick={() => setRadiusFilter(100)} className="bg-purple-600 hover:bg-purple-700">
                  Expand to 100 miles
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
                src={selectedEvent.images[0] || "/placeholder.svg?height=400&width=600&text=Event"}
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
                  <div className="text-sm text-gray-600">{formatTime(selectedEvent.startTime)}</div>
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
                    <Star className="h-4 w-4 mr-2" />
                    <span className="text-sm">Rating</span>
                  </div>
                  <div className="font-semibold">{selectedEvent.rating?.toFixed(1) || "N/A"}</div>
                  <div className="text-sm text-gray-600">out of 5.0</div>
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
                  <div className="text-sm text-gray-600 mb-2">
                    {selectedEvent.venue.address && `${selectedEvent.venue.address}, `}
                    {selectedEvent.venue.city}, {selectedEvent.venue.state}
                  </div>
                  <div className="text-sm text-gray-500">
                    Coordinates: {selectedEvent.venue.lat.toFixed(4)}, {selectedEvent.venue.lng.toFixed(4)}
                  </div>
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
