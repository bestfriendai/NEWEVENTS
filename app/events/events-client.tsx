"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { fetchEnhancedEvents } from "@/app/actions/event-actions"
import { EventCard } from "@/components/event-card"
import { EnhancedMapExplorer } from "@/components/enhanced-map-explorer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  RefreshCw,
  Search,
  MapPin,
  Calendar,
  Filter,
  X,
  ChevronDown,
  Loader2,
  Map,
  List,
  Locate,
  Clock,
  DollarSign,
} from "lucide-react"
import type { EventDetailProps } from "@/components/event-detail-modal"
import { EventDetailModal } from "@/components/event-detail-modal"
import { reverseGeocode } from "@/lib/api/map-api"

const CATEGORIES = [
  { id: "all", label: "All Categories", color: "bg-gray-500/20 text-gray-300" },
  { id: "music", label: "Music", color: "bg-purple-500/20 text-purple-300" },
  { id: "arts", label: "Arts", color: "bg-blue-500/20 text-blue-300" },
  { id: "sports", label: "Sports", color: "bg-green-500/20 text-green-300" },
  { id: "food", label: "Food", color: "bg-pink-500/20 text-pink-300" },
  { id: "business", label: "Business", color: "bg-yellow-500/20 text-yellow-300" },
]

const POPULAR_LOCATIONS = [
  { id: "new-york", label: "New York", value: "New York" },
  { id: "los-angeles", label: "Los Angeles", value: "Los Angeles" },
  { id: "chicago", label: "Chicago", value: "Chicago" },
  { id: "miami", label: "Miami", value: "Miami" },
  { id: "austin", label: "Austin", value: "Austin" },
  { id: "san-francisco", label: "San Francisco", value: "San Francisco" },
  { id: "seattle", label: "Seattle", value: "Seattle" },
  { id: "denver", label: "Denver", value: "Denver" },
]

const DATE_FILTERS = [
  { id: "any", label: "Any date" },
  { id: "today", label: "Today" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "this-week", label: "This week" },
  { id: "this-weekend", label: "This weekend" },
  { id: "next-week", label: "Next week" },
  { id: "this-month", label: "This month" },
]

const PRICE_FILTERS = [
  { id: "any", label: "Any price" },
  { id: "free", label: "Free" },
  { id: "paid", label: "Paid" },
  { id: "0-25", label: "$0-$25" },
  { id: "25-50", label: "$25-$50" },
  { id: "50-100", label: "$50-$100" },
  { id: "100+", label: "$100+" },
]

const TIME_FILTERS = [
  { id: "any", label: "Any time" },
  { id: "morning", label: "Morning" },
  { id: "afternoon", label: "Afternoon" },
  { id: "evening", label: "Evening" },
]

export function EventsClient() {
  const [events, setEvents] = useState<EventDetailProps[]>([])
  const [filteredEvents, setFilteredEvents] = useState<EventDetailProps[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [locationQuery, setLocationQuery] = useState("")
  const [location, setLocation] = useState<string>("")
  const [locationName, setLocationName] = useState<string>("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EventDetailProps | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [isRequestingLocation, setIsRequestingLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [userCoordinates, setUserCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [searchRadius, setSearchRadius] = useState(25)
  const [_locationPermissionStatus, setLocationPermissionStatus] = useState<PermissionState | null>(null)
  const [isFirstLoad, setIsFirstLoad] = useState(true)
  const [dateFilter, setDateFilter] = useState("any")
  const [priceFilter, setPriceFilter] = useState("any")
  const [timeFilter, setTimeFilter] = useState("any")
  const [dataSources, setDataSources] = useState<string[]>([])
  const [totalEvents, setTotalEvents] = useState(0)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const defaultLocation = "New York"

  // Check location permission status
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions) return

    const checkPermission = async () => {
      try {
        const result = await navigator.permissions.query({ name: "geolocation" as PermissionName })
        setLocationPermissionStatus(result.state)

        // Listen for changes to permission state
        result.onchange = () => {
          setLocationPermissionStatus(result.state)
        }
      } catch (_error) {
        // console.error("Error checking geolocation permission:", error)
      }
    }

    checkPermission()
  }, [])

  // Show location modal on first load
  useEffect(() => {
    if (isFirstLoad) {
      setShowLocationModal(true)
      setIsFirstLoad(false)
    }
  }, [isFirstLoad])

  // Memoized loadEvents function to prevent infinite loops
  const loadEvents = useCallback(
    async (locationParam?: string) => {
      setLoading(true)
      setError(null)

      try {
        const locationToUse = locationParam || location || defaultLocation
        // console.log("Loading events for location:", locationToUse)

        // Prepare date range if date filter is set
        let startDateTime: string | undefined
        let endDateTime: string | undefined

        if (dateFilter !== "any") {
          const now = new Date()

          switch (dateFilter) {
            case "today":
              startDateTime = now.toISOString().split("T")[0]
              endDateTime = now.toISOString().split("T")[0]
              break
            case "tomorrow":
              const tomorrow = new Date(now)
              tomorrow.setDate(tomorrow.getDate() + 1)
              startDateTime = tomorrow.toISOString().split("T")[0]
              endDateTime = tomorrow.toISOString().split("T")[0]
              break
            case "this-week":
              const endOfWeek = new Date(now)
              endOfWeek.setDate(now.getDate() + (7 - now.getDay()))
              startDateTime = now.toISOString().split("T")[0]
              endDateTime = endOfWeek.toISOString().split("T")[0]
              break
            case "this-weekend":
              const saturday = new Date(now)
              saturday.setDate(now.getDate() + (6 - now.getDay()))
              const sunday = new Date(saturday)
              sunday.setDate(saturday.getDate() + 1)
              startDateTime = saturday.toISOString().split("T")[0]
              endDateTime = sunday.toISOString().split("T")[0]
              break
            case "next-week":
              const nextWeekStart = new Date(now)
              nextWeekStart.setDate(now.getDate() + (7 - now.getDay()) + 1)
              const nextWeekEnd = new Date(nextWeekStart)
              nextWeekEnd.setDate(nextWeekStart.getDate() + 6)
              startDateTime = nextWeekStart.toISOString().split("T")[0]
              endDateTime = nextWeekEnd.toISOString().split("T")[0]
              break
            case "this-month":
              const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
              startDateTime = now.toISOString().split("T")[0]
              endDateTime = lastDay.toISOString().split("T")[0]
              break
          }
        }

        // Prepare price range if price filter is set
        let priceRange: { min: number; max: number } | undefined

        if (priceFilter !== "any") {
          switch (priceFilter) {
            case "free":
              priceRange = { min: 0, max: 0 }
              break
            case "0-25":
              priceRange = { min: 0, max: 25 }
              break
            case "25-50":
              priceRange = { min: 25, max: 50 }
              break
            case "50-100":
              priceRange = { min: 50, max: 100 }
              break
            case "100+":
              priceRange = { min: 100, max: 1000 }
              break
          }
        }

        // Prepare user preferences
        const userPreferences = {
          timePreference: timeFilter !== "any" ? timeFilter as "morning" | "afternoon" | "evening" : undefined,
          pricePreference: priceFilter === "free" ? "free" as const : priceFilter === "paid" ? "paid" as const : "any" as const,
          favoriteCategories: selectedCategory !== "all" ? [selectedCategory] : undefined,
        }

        // Use enhanced events API
        const result = await fetchEnhancedEvents({
          keyword: searchQuery || "events",
          location: locationToUse,
          coordinates: userCoordinates || undefined,
          radius: searchRadius,
          size: 50,
          startDateTime,
          endDateTime,
          priceRange,
          userPreferences,
        })

        // console.log("Fetch result:", result)

        if (result.error) {
          setError(result.error)
          setEvents([])
          setFilteredEvents([])
          setDataSources([])
          setTotalEvents(0)
        } else if (result.events && result.events.length > 0) {
          setEvents(result.events)
          setFilteredEvents(result.events)
          setTotalEvents(result.totalCount || 0)
          setDataSources(result.sources || [])
        } else {
          // If no events found, try with a larger radius
          // console.log("No events found, trying with larger radius")
          const largerRadiusResult = await fetchEnhancedEvents({
            keyword: searchQuery || "events",
            location: locationToUse,
            coordinates: userCoordinates || undefined,
            radius: searchRadius * 2, // Double the radius
            size: 50,
            startDateTime,
            endDateTime,
            priceRange,
            userPreferences,
          })

          if (largerRadiusResult.events && largerRadiusResult.events.length > 0) {
            setEvents(largerRadiusResult.events)
            setFilteredEvents(largerRadiusResult.events)
            setTotalEvents(largerRadiusResult.totalCount || 0)
            setDataSources(largerRadiusResult.sources || [])
          } else {
            setError("No events found in this area. Try a different location or search term.")
            setEvents([])
            setFilteredEvents([])
            setDataSources([])
            setTotalEvents(0)
          }
        }
      } catch (err) {
        // console.error("Error loading events:", err)
        const errorMessage = err instanceof Error ? err.message : "Failed to load events"
        setError(errorMessage)
        setEvents([])
        setFilteredEvents([])
        setDataSources([])
        setTotalEvents(0)
      } finally {
        setLoading(false)
      }
    },
    [
      location,
      searchQuery,
      userCoordinates,
      searchRadius,
      dateFilter,
      priceFilter,
      timeFilter,
      selectedCategory,
      defaultLocation,
    ],
  )

  // Filter events when category changes
  useEffect(() => {
    if (selectedCategory === "all") {
      setFilteredEvents(events)
    } else {
      const filtered = events.filter((event) => event.category.toLowerCase() === selectedCategory.toLowerCase())
      setFilteredEvents(filtered)
    }
  }, [selectedCategory, events])

  // Load events when location changes (but not on first render)
  useEffect(() => {
    if (location && !isFirstLoad) {
      loadEvents()
    }
  }, [location, loadEvents, isFirstLoad])

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      loadEvents()
    },
    [loadEvents],
  )

  const handleLocationSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (locationQuery.trim()) {
        setLocation(locationQuery)
        setLocationName(locationQuery)
        setShowLocationModal(false)
      }
    },
    [locationQuery],
  )

  const handleViewDetails = useCallback((event: EventDetailProps) => {
    setSelectedEvent(event)
    setShowDetailModal(true)
  }, [])

  const handleToggleFavorite = useCallback((eventId: number) => {
    setEvents((prevEvents) =>
      prevEvents.map((event) => (event.id === eventId ? { ...event, isFavorite: !event.isFavorite } : event)),
    )

    setFilteredEvents((prevFilteredEvents) =>
      prevFilteredEvents.map((event) => (event.id === eventId ? { ...event, isFavorite: !event.isFavorite } : event)),
    )
  }, [])

  const handleSelectPopularLocation = useCallback((locationValue: string) => {
    setLocation(locationValue)
    setLocationName(locationValue)
    setLocationQuery(locationValue)
    setShowLocationModal(false)
  }, [])

  const promptForLocation = useCallback(() => {
    setIsRequestingLocation(true)
    setLocationError(null)

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser. Please enter your location manually.")
      setIsRequestingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          // console.log("Got user coordinates:", latitude, longitude)
          setUserCoordinates({ lat: latitude, lng: longitude })

          // Get location name with error handling - use fallback if API fails
          try {
            const locationName = await reverseGeocode(latitude, longitude)
            setLocationName(locationName || "Your Location")
          } catch (_error) {
            // console.warn("Reverse geocoding failed, using generic location name:", error)
            setLocationName("Your Location")
          }

          // Set the location as coordinates for more accurate results
          const locationString = `${latitude},${longitude}`
          setLocation(locationString)
          setShowLocationModal(false)

          // Load events with the coordinates
          await loadEvents(locationString)
        } catch (_error) {
          // console.error("Error processing location:", error)
          setLocationError("Error processing your location. Please try again.")
        } finally {
          setIsRequestingLocation(false)
        }
      },
      (error) => {
        // console.error("Error getting location:", error)
        setLocationError(
          error.code === 1
            ? "Location permission denied. Please enable location services or enter your location manually."
            : "Could not get your location. Please try again or enter your location manually.",
        )
        setIsRequestingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }, [loadEvents])

  // Handle radius change
  const handleRadiusChange = useCallback((value: string) => {
    const radius = Number.parseInt(value, 10)
    setSearchRadius(radius)
  }, [])

  // Handle filter changes
  const handleDateFilterChange = useCallback((value: string) => {
    setDateFilter(value)
  }, [])

  const handlePriceFilterChange = useCallback((value: string) => {
    setPriceFilter(value)
  }, [])

  const handleTimeFilterChange = useCallback((value: string) => {
    setTimeFilter(value)
  }, [])

  // Apply all filters
  const applyFilters = useCallback(() => {
    loadEvents()
  }, [loadEvents])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setDateFilter("any")
    setPriceFilter("any")
    setTimeFilter("any")
    setSelectedCategory("all")
    setSearchRadius(25)
  }, [])

  const retryLoadEvents = useCallback(() => {
    loadEvents()
  }, [loadEvents])

  const tryLargerArea = useCallback(() => {
    setSearchRadius(100)
    loadEvents()
  }, [loadEvents])

  return (
    <div className="min-h-screen bg-[#0F1116]">
      {/* Hero section with search */}
      <div className="relative bg-gradient-to-b from-[#1A1D25] to-[#0F1116] pt-8 pb-16">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/hero-pattern.png')] bg-repeat opacity-5"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Discover Amazing Events</h1>
            <p className="text-gray-400 text-lg mb-8">Find the best events happening near you</p>

            {/* Search form */}
            <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    type="text"
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 py-6 bg-[#1A1D25]/80 border-gray-800 rounded-xl text-white focus:ring-purple-500 w-full"
                  />
                </div>
                <div className="relative md:w-48">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Button
                    type="button"
                    onClick={() => setShowLocationModal(true)}
                    className="pl-10 py-6 bg-[#1A1D25]/80 border-gray-800 rounded-xl text-white hover:bg-[#22252F] text-left font-normal justify-start w-full overflow-hidden"
                  >
                    <span className="truncate">{locationName || "Select location"}</span>
                  </Button>
                </div>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white py-6 px-6 rounded-xl">
                  Search
                </Button>
              </div>
            </form>
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {CATEGORIES.map((category) => (
              <Badge
                key={category.id}
                className={`px-4 py-2 rounded-full cursor-pointer text-sm font-medium border-0 transition-colors ${
                  selectedCategory === category.id
                    ? "bg-purple-600 text-white"
                    : `${category.color} hover:bg-opacity-30`
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.label}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 -mt-8 relative z-20">
        {/* Error message */}
        {error && (
          <Alert variant="destructive" className="mb-8 bg-red-900/30 border border-red-800 text-white">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <Button
              onClick={retryLoadEvents}
              variant="outline"
              size="sm"
              className="mt-2 border-red-700 text-white hover:bg-red-800"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </Alert>
        )}

        {/* Data sources info */}
        {dataSources.length > 0 && (
          <div className="mb-4 p-3 bg-[#1A1D25]/60 backdrop-blur-sm border border-gray-800/50 rounded-lg text-sm text-gray-400">
            <p>
              Found {totalEvents} events from {dataSources.length} sources: {dataSources.join(", ")}
            </p>
          </div>
        )}

        {/* Tabs for list/map view */}
        <div className="bg-[#1A1D25]/60 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden shadow-xl">
          <Tabs defaultValue="list" className="w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-800/50">
              <TabsList className="bg-[#22252F] p-1 rounded-lg">
                <TabsTrigger
                  value="list"
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-md px-4 py-2"
                >
                  <List className="h-4 w-4 mr-2" />
                  List View
                </TabsTrigger>
                <TabsTrigger
                  value="map"
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-md px-4 py-2"
                >
                  <Map className="h-4 w-4 mr-2" />
                  Map View
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-gray-300 hover:text-white"
                  onClick={() => setShowLocationModal(true)}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  {locationName ? <span className="max-w-[120px] truncate">{locationName}</span> : "Set Location"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-gray-300 hover:text-white"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showFilters ? "rotate-180" : ""}`} />
                </Button>
              </div>
            </div>

            {/* Filter panel */}
            {showFilters && (
              <div className="p-4 border-b border-gray-800/50 bg-[#22252F]/50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
                    <div className="relative">
                      <Calendar
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={16}
                      />
                      <Select value={dateFilter} onValueChange={handleDateFilterChange}>
                        <SelectTrigger className="pl-10 bg-[#1A1D25]/80 border-gray-800 rounded-lg text-white">
                          <SelectValue placeholder="Any date" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1A1D25] border-gray-800">
                          {DATE_FILTERS.map((filter) => (
                            <SelectItem key={filter.id} value={filter.id}>
                              {filter.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Price</label>
                    <div className="relative">
                      <DollarSign
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={16}
                      />
                      <Select value={priceFilter} onValueChange={handlePriceFilterChange}>
                        <SelectTrigger className="pl-10 bg-[#1A1D25]/80 border-gray-800 rounded-lg text-white">
                          <SelectValue placeholder="Any price" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1A1D25] border-gray-800">
                          {PRICE_FILTERS.map((filter) => (
                            <SelectItem key={filter.id} value={filter.id}>
                              {filter.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Time</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <Select value={timeFilter} onValueChange={handleTimeFilterChange}>
                        <SelectTrigger className="pl-10 bg-[#1A1D25]/80 border-gray-800 rounded-lg text-white">
                          <SelectValue placeholder="Any time" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1A1D25] border-gray-800">
                          {TIME_FILTERS.map((filter) => (
                            <SelectItem key={filter.id} value={filter.id}>
                              {filter.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Search radius</label>
                    <Select value={searchRadius.toString()} onValueChange={handleRadiusChange}>
                      <SelectTrigger className="bg-[#1A1D25]/80 border-gray-800 rounded-lg text-white">
                        <SelectValue placeholder="25 miles" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1D25] border-gray-800">
                        <SelectItem value="5">5 miles</SelectItem>
                        <SelectItem value="10">10 miles</SelectItem>
                        <SelectItem value="25">25 miles</SelectItem>
                        <SelectItem value="50">50 miles</SelectItem>
                        <SelectItem value="100">100 miles</SelectItem>
                        <SelectItem value="200">200 miles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-700 text-gray-300 hover:text-white mr-2"
                    onClick={clearFilters}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={applyFilters}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="flex justify-center items-center py-20">
                <div className="text-center">
                  <Loader2 className="h-10 w-10 text-purple-500 animate-spin mx-auto mb-4" />
                  <p className="text-gray-400">Loading events near {locationName || "you"}...</p>
                </div>
              </div>
            )}

            {/* List view */}
            <TabsContent value="list" className="focus:outline-none">
              {!loading && filteredEvents.length > 0 ? (
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <EventCard
                          event={event}
                          onViewDetails={() => handleViewDetails(event)}
                          onToggleFavorite={() => handleToggleFavorite(event.id)}
                          index={index}
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : !loading && !error ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="bg-[#22252F]/50 rounded-full p-4 mb-4">
                    <Search className="h-8 w-8 text-gray-500" />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2">No events found</h3>
                  <p className="text-gray-400 mb-6 text-center max-w-md">
                    Try adjusting your search criteria, increasing the search radius, or changing your location to find
                    more events
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Button onClick={tryLargerArea} className="bg-purple-600 hover:bg-purple-700 text-white">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Try Larger Area
                    </Button>
                    <Button
                      onClick={() => setShowLocationModal(true)}
                      variant="outline"
                      className="border-gray-700 text-gray-300 hover:text-white"
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      Change Location
                    </Button>
                  </div>
                </div>
              ) : null}
            </TabsContent>

            {/* Map view */}
            <TabsContent value="map" className="focus:outline-none">
              <div className="h-[70vh] relative">
                <EnhancedMapExplorer
                  events={filteredEvents}
                  initialLocation={userCoordinates || undefined}
                  initialLocationName={locationName || undefined}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Location selection modal */}
      <AnimatePresence>
        {showLocationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1A1D25] rounded-xl p-6 max-w-md w-full border border-gray-800 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Where do you want to explore?</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-white"
                  onClick={() => setShowLocationModal(false)}
                >
                  <X size={18} />
                </Button>
              </div>

              <form onSubmit={handleLocationSearch} className="mb-6">
                <div className="relative mb-4">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Enter city, address or zip code..."
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    className="pl-10 py-6 bg-[#22252F] border-gray-800 rounded-xl text-white focus:ring-purple-500 w-full"
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3"
                  disabled={!locationQuery.trim()}
                >
                  Search This Location
                </Button>
              </form>

              <div className="mb-6">
                <Button
                  variant="outline"
                  className="w-full border-gray-700 text-gray-300 hover:text-white flex items-center justify-center py-3"
                  onClick={promptForLocation}
                  disabled={isRequestingLocation}
                >
                  {isRequestingLocation ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Locate className="h-4 w-4 mr-2" />
                  )}
                  Use My Current Location
                </Button>

                {locationError && (
                  <div className="mt-3 p-2 bg-red-900/30 border border-red-800 rounded-md text-sm text-red-300 flex items-start">
                    <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{locationError}</span>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Popular Locations</h3>
                <div className="grid grid-cols-2 gap-2">
                  {POPULAR_LOCATIONS.map((loc) => (
                    <Button
                      key={loc.id}
                      variant="outline"
                      className="border-gray-700 text-gray-300 hover:text-white justify-start"
                      onClick={() => handleSelectPopularLocation(loc.value)}
                    >
                      <MapPin className="h-3.5 w-3.5 mr-2 text-purple-400" />
                      {loc.label}
                    </Button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event detail modal */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onFavorite={handleToggleFavorite}
      />
    </div>
  )
}
