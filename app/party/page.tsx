"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EventDetailModal } from "@/components/event-detail-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Music,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  PartyPopper,
  Sparkles,
  Zap,
  Sun,
  MapPin,
  Navigation,
  Target,
  Loader2,
} from "lucide-react"
import type { EventDetailProps } from "@/components/event-detail-modal"
import { AppLayout } from "@/components/app-layout"
import { EventCard } from "@/components/event-card"
import { PartyHero } from "@/components/party/party-hero"
import { FeaturedArtists } from "@/components/party/featured-artists"
import { PartyFooter } from "@/components/party/party-footer"
import { useLocationContext } from "@/contexts/LocationContext"
import { fetchEvents, type EventSearchResult } from "@/app/actions/event-actions"
import { logger } from "@/lib/utils/logger"

// Party-specific categories
const partyCategories = [
  { id: "all", name: "All Parties", icon: PartyPopper, color: "bg-purple-500", keywords: [] },
  {
    id: "nightlife",
    name: "Nightlife",
    icon: Zap,
    color: "bg-blue-500",
    keywords: ["nightclub", "club", "nightlife", "dance", "dj", "electronic", "house", "techno"],
  },
  {
    id: "festivals",
    name: "Festivals",
    icon: Sparkles,
    color: "bg-pink-500",
    keywords: ["festival", "music festival", "outdoor", "concert", "live music"],
  },
  {
    id: "day-parties",
    name: "Day Parties",
    icon: Sun,
    color: "bg-yellow-500",
    keywords: ["day party", "pool party", "brunch", "daytime", "outdoor", "rooftop"],
  },
  {
    id: "brunches",
    name: "Brunches",
    icon: Users,
    color: "bg-green-500",
    keywords: ["brunch", "bottomless brunch", "weekend brunch", "mimosa", "breakfast"],
  },
  {
    id: "music",
    name: "Music Events",
    icon: Music,
    color: "bg-indigo-500",
    keywords: ["concert", "live music", "band", "performance", "acoustic"],
  },
]

// Featured artists data
const featuredArtists = [
  {
    id: 1,
    name: "DJ Pulse",
    genre: "Techno / House",
    image: "/dj-1.png",
    upcoming: 3,
    followers: "125K",
    verified: true,
    bio: "International techno sensation known for underground warehouse sets",
  },
  {
    id: 2,
    name: "Neon Dreams",
    genre: "Electronic / Ambient",
    image: "/dj-2.png",
    upcoming: 2,
    followers: "89K",
    verified: true,
    bio: "Rising star in the electronic music scene with ethereal soundscapes",
  },
  {
    id: 3,
    name: "Bass Collective",
    genre: "Drum & Bass / Jungle",
    image: "/dj-3.png",
    upcoming: 4,
    followers: "156K",
    verified: true,
    bio: "Heavy bass drops and jungle rhythms that move crowds worldwide",
  },
  {
    id: 4,
    name: "Midnight Vibes",
    genre: "Deep House / Progressive",
    image: "/dj-4.png",
    upcoming: 1,
    followers: "67K",
    verified: false,
    bio: "Deep house specialist creating immersive late-night experiences",
  },
]

export default function PartyPage() {
  const {
    userLocation,
    getCurrentLocation,
    searchLocation,
    isLoading: locationLoading,
    error: locationError,
  } = useLocationContext()

  // State management
  const [isLoading, setIsLoading] = useState(true)
  const [events, setEvents] = useState<EventDetailProps[]>([])
  const [filteredEvents, setFilteredEvents] = useState<EventDetailProps[]>([])
  const [selectedEvent, setSelectedEvent] = useState<EventDetailProps | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<"loading" | "success" | "error" | "partial">("loading")

  // Location states
  const [showLocationPrompt, setShowLocationPrompt] = useState(true)
  const [locationQuery, setLocationQuery] = useState("")
  const [currentLocationName, setCurrentLocationName] = useState("")
  const [searchRadius, setSearchRadius] = useState(50)

  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [priceRange, setPriceRange] = useState([0, 200])
  const [dateFilter, setDateFilter] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [eventsPerPage] = useState(24)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Load party events from real APIs
  const loadPartyEvents = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      setApiStatus("loading")

      logger.info("Loading party events from real APIs", {
        component: "PartyPage",
        action: "loadPartyEvents",
        searchQuery: searchQuery || "party events",
        category: selectedCategory,
        location: userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : "none",
        radius: searchRadius,
      })

      // Build party-specific search terms
      let searchTerm = searchQuery || "party nightlife music festival concert"

      // Add category-specific keywords
      if (selectedCategory !== "all") {
        const category = partyCategories.find((c) => c.id === selectedCategory)
        if (category && category.keywords.length > 0) {
          searchTerm = searchQuery
            ? `${searchQuery} ${category.keywords.join(" ")}`
            : `${category.keywords.join(" ")} party event`
        }
      }

      // Prepare search parameters
      const searchParams = {
        query: searchTerm,
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        location: userLocation ? `${userLocation.lat},${userLocation.lng}` : "New York, NY",
        radius: searchRadius,
        limit: 100,
        page: currentPage - 1, // Adjust page for server action
        size: eventsPerPage,
      }

      logger.info("Fetching events with parameters", { searchParams })

      // Fetch events from real API
      const result: EventSearchResult = await fetchEvents(searchParams)

      if (result && result.events) {
        // Filter events for party relevance
        const partyEvents = result.events.filter((event) => {
          const eventText = `${event.title} ${event.description} ${event.category}`.toLowerCase()

          // Party-related keywords
          const partyKeywords = [
            "party",
            "nightlife",
            "club",
            "dance",
            "dj",
            "music",
            "festival",
            "concert",
            "live",
            "entertainment",
            "celebration",
            "brunch",
            "rooftop",
            "outdoor",
            "electronic",
            "house",
            "techno",
          ]

          return partyKeywords.some((keyword) => eventText.includes(keyword))
        })

        // Sort by date (soonest first)
        const sortedEvents = partyEvents.sort((a, b) => {
          const dateA = new Date(a.date).getTime()
          const dateB = new Date(b.date).getTime()
          return dateA - dateB
        })

        setEvents(sortedEvents)
        setApiStatus("success")
        setError(null)

        logger.info(`Successfully loaded ${sortedEvents.length} party events`, {
          originalCount: result.events.length,
          filteredCount: sortedEvents.length,
        })
      } else {
        setApiStatus("error")
        setError(result.error?.message || "Failed to load events")
        setEvents([])
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load events"
      logger.error("Party events search failed", { error: errorMessage })
      setError(`Error: ${errorMessage}`)
      setApiStatus("error")
      setEvents([])
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, selectedCategory, userLocation, searchRadius, currentPage, eventsPerPage])

  // Location handling functions
  const handleGetCurrentLocation = useCallback(async () => {
    try {
      setShowLocationPrompt(false)
      await getCurrentLocation()
      setCurrentLocationName("Your Current Location")
      logger.info("Current location obtained for party search")
    } catch (error) {
      logger.error("Failed to get current location", { error })
      setError("Unable to get your current location. Please try searching for a location manually.")
    }
  }, [getCurrentLocation])

  const handleLocationSearch = useCallback(async () => {
    if (!locationQuery.trim()) return

    try {
      setShowLocationPrompt(false)
      await searchLocation(locationQuery)
      setCurrentLocationName(locationQuery)
      logger.info("Location search completed for party search", { query: locationQuery })
    } catch (error) {
      logger.error("Failed to search location", { error })
      setError("Unable to find that location. Please try a different search term.")
    }
  }, [locationQuery, searchLocation])

  const handleSkipLocation = useCallback(() => {
    setShowLocationPrompt(false)
    setCurrentLocationName("All Locations")
    logger.info("User skipped location for party search")
  }, [])

  // Enhanced event filtering
  const filterEvents = useMemo(() => {
    let filtered = events

    // Filter by category
    if (selectedCategory !== "all") {
      const category = partyCategories.find((c) => c.id === selectedCategory)
      if (category && category.keywords.length > 0) {
        filtered = filtered.filter((event) => {
          const eventText = `${event.title} ${event.description} ${event.category}`.toLowerCase()
          return category.keywords.some((keyword) => eventText.includes(keyword.toLowerCase()))
        })
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query) ||
          event.location.toLowerCase().includes(query) ||
          event.organizer.name.toLowerCase().includes(query) ||
          event.category.toLowerCase().includes(query),
      )
    }

    // Filter by price range
    filtered = filtered.filter((event) => {
      if (event.price.toLowerCase() === "free") return priceRange[0] === 0
      const priceMatch = event.price.match(/\$(\d+)/)
      if (priceMatch) {
        const price = Number.parseInt(priceMatch[1])
        return price >= priceRange[0] && price <= priceRange[1]
      }
      return true
    })

    // Filter by date
    if (dateFilter !== "all") {
      const now = new Date()
      filtered = filtered.filter((event) => {
        const eventDate = new Date(event.date)
        switch (dateFilter) {
          case "today":
            return eventDate.toDateString() === now.toDateString()
          case "tomorrow":
            const tomorrow = new Date(now)
            tomorrow.setDate(tomorrow.getDate() + 1)
            return eventDate.toDateString() === tomorrow.toDateString()
          case "weekend":
            const day = eventDate.getDay()
            return day === 5 || day === 6 || day === 0
          case "week":
            const weekFromNow = new Date(now)
            weekFromNow.setDate(weekFromNow.getDate() + 7)
            return eventDate >= now && eventDate <= weekFromNow
          case "month":
            const monthFromNow = new Date(now)
            monthFromNow.setMonth(monthFromNow.getMonth() + 1)
            return eventDate >= now && eventDate <= monthFromNow
          default:
            return true
        }
      })
    }

    // Sort events
    filtered.sort((a, b) => {
      const now = Date.now()
      const aDate = new Date(a.date).getTime()
      const bDate = new Date(b.date).getTime()

      switch (sortBy) {
        case "date":
          return aDate - bDate
        case "popularity":
          return b.attendees - a.attendees
        case "price":
          const priceA = extractPrice(a.price)
          const priceB = extractPrice(b.price)
          return priceA - priceB
        case "alphabetical":
          return a.title.localeCompare(b.title)
        default:
          return aDate - bDate
      }
    })

    return filtered
  }, [events, selectedCategory, searchQuery, priceRange, dateFilter, sortBy])

  // Update filtered events and reset pagination when filters change
  useEffect(() => {
    setFilteredEvents(filterEvents)
  }, [filterEvents])

  // Load events when location changes or on mount
  useEffect(() => {
    if (!showLocationPrompt) {
      loadPartyEvents()
    }
  }, [loadPartyEvents, showLocationPrompt])

  // Auto-load events when user location is obtained
  useEffect(() => {
    if (userLocation && !showLocationPrompt) {
      loadPartyEvents()
    }
  }, [userLocation, loadPartyEvents, showLocationPrompt])

  // Reload events when category or radius changes
  useEffect(() => {
    if (!showLocationPrompt) {
      loadPartyEvents()
    }
  }, [selectedCategory, searchRadius, showLocationPrompt, loadPartyEvents])

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage)
  const startIndex = (currentPage - 1) * eventsPerPage
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + eventsPerPage)

  // Event handlers
  const handleViewEventDetails = (event: EventDetailProps) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setTimeout(() => setSelectedEvent(null), 300)
  }

  const handleToggleFavorite = (id: number) => {
    logger.info("Favorite toggled", { eventId: id })
  }

  const handleClearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
    setPriceRange([0, 200])
    setDateFilter("all")
    setSortBy("date")
    setCurrentPage(1)
  }

  const handleRefreshEvents = () => {
    setIsRefreshing(true)
    loadPartyEvents().finally(() => setIsRefreshing(false))
  }

  const extractPrice = (priceString: string): number => {
    if (priceString.toLowerCase() === "free") return 0
    const match = priceString.match(/\$(\d+)/)
    return match ? Number.parseInt(match[1]) : 999999
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  return (
    <AppLayout>
      <div className="flex flex-col min-h-screen bg-[#0F1116] text-gray-200">
        {/* Hero Section */}
        <PartyHero />

        {/* Location Prompt */}
        {showLocationPrompt && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-4xl mx-auto px-4 py-6"
          >
            <Card className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-500/30">
              <CardContent className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="flex flex-col items-center space-y-6"
                >
                  <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-purple-400" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white">Find Parties Near You</h2>
                    <p className="text-gray-300 max-w-md">
                      Discover the hottest parties, festivals, and events happening around your location.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                    <Button
                      onClick={handleGetCurrentLocation}
                      disabled={locationLoading}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      {locationLoading ? "Getting Location..." : "Use My Location"}
                    </Button>

                    <div className="flex gap-2 flex-1">
                      <Input
                        placeholder="Enter city or address"
                        value={locationQuery}
                        onChange={(e) => setLocationQuery(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleLocationSearch()}
                        className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                      />
                      <Button
                        onClick={handleLocationSearch}
                        disabled={!locationQuery.trim() || locationLoading}
                        variant="outline"
                        className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
                      >
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <Button onClick={handleSkipLocation} variant="ghost" className="text-gray-400 hover:text-white">
                    Skip - Show All Parties
                  </Button>

                  {locationError && <div className="text-red-400 text-sm mt-2">{locationError}</div>}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Current Location Display */}
        {!showLocationPrompt && currentLocationName && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center justify-between bg-gray-800/50 rounded-lg px-4 py-2 border border-gray-700">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-300">
                  Showing parties near: <span className="text-white font-medium">{currentLocationName}</span>
                </span>
                {userLocation && <span className="text-xs text-gray-500">(within {searchRadius} miles)</span>}
              </div>

              <div className="flex items-center space-x-2">
                <Select value={searchRadius.toString()} onValueChange={(value) => setSearchRadius(Number(value))}>
                  <SelectTrigger className="w-24 h-8 bg-gray-700 border-gray-600 text-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25 mi</SelectItem>
                    <SelectItem value="50">50 mi</SelectItem>
                    <SelectItem value="75">75 mi</SelectItem>
                    <SelectItem value="100">100 mi</SelectItem>
                    <SelectItem value="150">150 mi</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={() => setShowLocationPrompt(true)}
                  variant="ghost"
                  size="sm"
                  className="text-purple-400 hover:text-purple-300 text-xs"
                >
                  Change Location
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main content */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-[60vh]">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
                <Loader2 className="h-12 w-12 animate-spin text-purple-500 mb-4" />
                <p className="text-gray-400">
                  {userLocation ? `Finding parties near ${currentLocationName}...` : "Finding the best party events..."}
                </p>
                <p className="text-sm text-gray-500 mt-2">Searching live APIs for real events...</p>
              </motion.div>
            </div>
          ) : (
            <>
              {/* API Status */}
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <div
                  className={`border rounded-lg p-3 flex items-center justify-between ${
                    apiStatus === "success"
                      ? "bg-green-900/20 border-green-700"
                      : apiStatus === "partial"
                        ? "bg-yellow-900/20 border-yellow-700"
                        : "bg-red-900/20 border-red-700"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {apiStatus === "success" ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                    )}
                    <span
                      className={`text-sm ${
                        apiStatus === "success"
                          ? "text-green-400"
                          : apiStatus === "partial"
                            ? "text-yellow-400"
                            : "text-red-400"
                      }`}
                    >
                      {apiStatus === "success"
                        ? `Live Party Events • ${events.length} events found${userLocation ? ` near ${currentLocationName}` : ""}`
                        : apiStatus === "partial"
                          ? `Partial Results • ${events.length} events${userLocation ? ` near ${currentLocationName}` : ""}`
                          : `API Error • No events available`}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefreshEvents}
                    disabled={isRefreshing}
                    className="text-purple-400 hover:text-purple-300"
                  >
                    {isRefreshing ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-1" />
                    )}
                    Refresh
                  </Button>
                </div>
              </motion.div>

              {/* Error message */}
              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
                  <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-yellow-400 font-medium">API Notice</h4>
                        <p className="text-yellow-300 text-sm mt-1">{error}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Search and Filters */}
              <div className="space-y-4 mb-6">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search party events, venues, or organizers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-[#1A1D25] border-gray-700 text-gray-200 placeholder-gray-400"
                  />
                </div>

                {/* Category Tabs */}
                <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 bg-[#1A1D25] border-gray-700">
                    {partyCategories.map((category) => {
                      const Icon = category.icon
                      return (
                        <TabsTrigger
                          key={category.id}
                          value={category.id}
                          className="flex items-center gap-1 text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                        >
                          <Icon className="w-3 h-3" />
                          <span className="hidden sm:inline">{category.name}</span>
                        </TabsTrigger>
                      )
                    })}
                  </TabsList>
                </Tabs>

                {/* Advanced Filters Toggle */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="border-gray-700 text-gray-300"
                  >
                    <Filter className="w-4 h-4 mr-1" />
                    Advanced Filters
                  </Button>

                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>{filteredEvents.length} events found</span>
                    {userLocation && (
                      <span className="text-xs bg-purple-600/20 text-purple-400 px-2 py-1 rounded-full">
                        📍 Location Active ({searchRadius}mi)
                      </span>
                    )}
                    {filteredEvents.length > 0 && (
                      <span>
                        Page {currentPage} of {totalPages}
                      </span>
                    )}
                  </div>
                </div>

                {/* Advanced Filters */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <Card className="bg-[#1A1D25] border-gray-800">
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Price Range */}
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                <DollarSign className="w-4 h-4 inline mr-1" />
                                Price: ${priceRange[0]} - ${priceRange[1]}
                              </label>
                              <Slider
                                value={priceRange}
                                onValueChange={setPriceRange}
                                max={200}
                                step={5}
                                className="w-full"
                              />
                            </div>

                            {/* Date Filter */}
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Date
                              </label>
                              <Select value={dateFilter} onValueChange={setDateFilter}>
                                <SelectTrigger className="bg-[#0F1116] border-gray-700">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Dates</SelectItem>
                                  <SelectItem value="today">Today</SelectItem>
                                  <SelectItem value="tomorrow">Tomorrow</SelectItem>
                                  <SelectItem value="weekend">This Weekend</SelectItem>
                                  <SelectItem value="week">This Week</SelectItem>
                                  <SelectItem value="month">This Month</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Sort By */}
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
                              <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="bg-[#0F1116] border-gray-700">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="date">Soonest First</SelectItem>
                                  <SelectItem value="popularity">Most Popular</SelectItem>
                                  <SelectItem value="price">Price (Low to High)</SelectItem>
                                  <SelectItem value="alphabetical">A-Z</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="flex justify-end mt-4">
                            <Button
                              onClick={handleClearFilters}
                              variant="outline"
                              size="sm"
                              className="border-gray-700 text-gray-300"
                            >
                              Clear All Filters
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Events Grid */}
              <Tabs value={selectedCategory} className="w-full">
                <TabsContent value={selectedCategory} className="mt-0">
                  {paginatedEvents.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                      <PartyPopper className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-400 mb-2">No party events found</h3>
                      <p className="text-gray-500 mb-4">
                        {searchQuery
                          ? `No results for "${searchQuery}". Try different search terms.`
                          : "Try adjusting your filters or search for different terms"}
                      </p>
                      <div className="space-x-2">
                        <Button onClick={handleClearFilters} variant="outline">
                          Clear Filters
                        </Button>
                        <Button onClick={handleRefreshEvents} className="bg-purple-600 hover:bg-purple-700">
                          Refresh Events
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {paginatedEvents.map((event, i) => (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 * i, duration: 0.4 }}
                            whileHover={{ y: -5 }}
                          >
                            <EventCard
                              event={event}
                              onViewDetails={() => handleViewEventDetails(event)}
                              onToggleFavorite={() => handleToggleFavorite(event.id)}
                              index={i}
                            />
                          </motion.div>
                        ))}
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex justify-center items-center space-x-2 mt-8"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="border-gray-700"
                          >
                            Previous
                          </Button>

                          <div className="flex space-x-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                              return (
                                <Button
                                  key={pageNum}
                                  variant={currentPage === pageNum ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handlePageChange(pageNum)}
                                  className={
                                    currentPage === pageNum
                                      ? "bg-purple-600 text-white"
                                      : "border-gray-700 text-gray-300"
                                  }
                                >
                                  {pageNum}
                                </Button>
                              )
                            })}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="border-gray-700"
                          >
                            Next
                          </Button>
                        </motion.div>
                      )}
                    </>
                  )}
                </TabsContent>
              </Tabs>

              {/* Featured Artists Section */}
              <FeaturedArtists artists={featuredArtists} />
            </>
          )}
        </main>

        {/* Footer */}
        <PartyFooter />

        {/* Event detail modal */}
        <EventDetailModal
          event={selectedEvent}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onFavorite={handleToggleFavorite}
        />
      </div>
    </AppLayout>
  )
}
