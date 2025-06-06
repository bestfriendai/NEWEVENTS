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
} from "lucide-react"
import type { EventDetailProps } from "@/components/event-detail-modal"
import { unifiedEventsService } from "@/lib/api/unified-events-service"
import { logger } from "@/lib/utils/logger"
import { AppLayout } from "@/components/app-layout"
import { EventCard } from "@/components/event-card"
import { PartyHero } from "@/components/party/party-hero"
import { FeaturedArtists } from "@/components/party/featured-artists"
import { PartyFooter } from "@/components/party/party-footer"

// Party-specific categories
const partyCategories = [
  { id: "all", name: "All Parties", icon: PartyPopper, color: "bg-purple-500", keywords: [] },
  {
    id: "day-parties",
    name: "Day Parties",
    icon: Sun,
    color: "bg-yellow-500",
    keywords: ["day party", "pool party", "brunch", "daytime", "outdoor", "rooftop"],
  },
  {
    id: "festivals",
    name: "Festivals",
    icon: Sparkles,
    color: "bg-pink-500",
    keywords: ["festival", "fest", "music festival", "outdoor festival", "concert"],
  },
  {
    id: "nightlife",
    name: "Nightlife",
    icon: Zap,
    color: "bg-blue-500",
    keywords: ["nightclub", "club", "nightlife", "night party", "dance", "dj"],
  },
  {
    id: "brunches",
    name: "Brunches",
    icon: Users,
    color: "bg-green-500",
    keywords: ["brunch", "bottomless brunch", "weekend brunch", "mimosa", "breakfast"],
  },
  {
    id: "public-events",
    name: "Public Events",
    icon: Music,
    color: "bg-indigo-500",
    keywords: ["public", "community", "free", "outdoor", "street", "park"],
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
  // State management
  const [isLoading, setIsLoading] = useState(true)
  const [events, setEvents] = useState<EventDetailProps[]>([])
  const [filteredEvents, setFilteredEvents] = useState<EventDetailProps[]>([])
  const [selectedEvent, setSelectedEvent] = useState<EventDetailProps | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<"loading" | "success" | "error" | "partial">("loading")
  const [searchStats, setSearchStats] = useState({ successful: 0, total: 0, events: 0 })

  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [priceRange, setPriceRange] = useState([0, 200])
  const [dateFilter, setDateFilter] = useState("all")
  const [sortBy, setSortBy] = useState("relevance")
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [eventsPerPage] = useState(24)

  // Load party events with enhanced filtering
  const loadPartyEvents = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      setApiStatus("loading")

      logger.info("Loading party events", {
        component: "PartyPage",
        action: "loadPartyEvents",
        searchQuery: searchQuery || "none",
        category: selectedCategory,
      })

      // Build party-specific search terms
      const partyKeywords = [
        "party",
        "festival",
        "brunch",
        "nightlife",
        "club",
        "dance",
        "music",
        "concert",
        "entertainment",
        "celebration",
        "event",
        "day party",
        "pool party",
        "rooftop",
        "outdoor",
        "live music",
        "dj",
        "electronic",
        "house music",
        "techno",
      ]

      let searchTerm = searchQuery || partyKeywords.slice(0, 8).join(" ")

      // Add category-specific keywords
      if (selectedCategory !== "all") {
        const category = partyCategories.find((c) => c.id === selectedCategory)
        if (category && category.keywords.length > 0) {
          searchTerm = `${searchQuery || ""} ${category.keywords.join(" ")}`.trim()
        }
      }

      // Use unified events service for better integration
      const searchResult = await unifiedEventsService.searchEvents({
        query: searchTerm,
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        limit: 100,
      })

      logger.info(`Search completed: ${searchResult.events.length} events found`, {
        sources: searchResult.sources,
        totalCount: searchResult.totalCount,
        error: searchResult.error,
      })

      if (searchResult.events.length === 0) {
        setApiStatus("partial")
        setError("No party events found from APIs. Trying fallback...")

        // Try a broader search with just "party" and "music"
        const fallbackResult = await unifiedEventsService.searchEvents({
          query: "party music",
          limit: 50,
        })

        if (fallbackResult.events.length > 0) {
          const partyEvents = filterPartyEvents(fallbackResult.events)
          const enhancedEvents = enhanceEventsForParty(partyEvents)
          setEvents(enhancedEvents)
          setApiStatus("success")
          setError(null)
          setSearchStats({
            successful: 1,
            total: 1,
            events: enhancedEvents.length
          })
        } else {
          const fallbackEvents = generateFallbackPartyEvents()
          setEvents(fallbackEvents)
          setSearchStats({ successful: 0, total: 1, events: fallbackEvents.length })
        }
      } else {
        // Filter and enhance events for party relevance
        const partyEvents = filterPartyEvents(searchResult.events)
        const enhancedEvents = enhanceEventsForParty(partyEvents)

        // Sort by party relevance first, then by date
        const sortedEvents = enhancedEvents.sort((a, b) => {
          const aRelevance = getPartyRelevanceScore(a)
          const bRelevance = getPartyRelevanceScore(b)

          if (aRelevance !== bRelevance) {
            return bRelevance - aRelevance
          }

          return new Date(a.date).getTime() - new Date(b.date).getTime()
        })

        setEvents(sortedEvents)
        setApiStatus(searchResult.error ? "partial" : "success")
        setSearchStats({
          successful: searchResult.sources.length,
          total: searchResult.sources.length + (searchResult.error ? 1 : 0),
          events: sortedEvents.length,
        })

        if (searchResult.error) {
          setError(`Some API sources had issues: ${searchResult.error}`)
        }

        logger.info(`Successfully loaded ${sortedEvents.length} party events`, {
          sources: searchResult.sources,
          originalCount: searchResult.events.length,
          finalCount: sortedEvents.length,
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load events"
      logger.error("Party events search failed", { error: errorMessage })
      setError(`Error: ${errorMessage}`)
      setApiStatus("error")

      const fallbackEvents = generateFallbackPartyEvents()
      setEvents(fallbackEvents)
      setSearchStats({ successful: 0, total: 1, events: fallbackEvents.length })
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, selectedCategory])

  // Enhanced event filtering
  const filterEvents = useMemo(() => {
    let filtered = events

    // Filter by category
    if (selectedCategory !== "all") {
      const category = partyCategories.find((c) => c.id === selectedCategory)
      if (category && category.keywords.length > 0) {
        filtered = filtered.filter((event) => {
          const eventText = `${event.category} ${event.title} ${event.description}`.toLowerCase()
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
      switch (sortBy) {
        case "date":
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        case "popularity":
          // Sort by relevance score instead of attendees
          const aRelevance = getPartyRelevanceScore(a)
          const bRelevance = getPartyRelevanceScore(b)
          return bRelevance - aRelevance
        case "price":
          const priceA = extractPrice(a.price)
          const priceB = extractPrice(b.price)
          return priceA - priceB
        case "alphabetical":
          return a.title.localeCompare(b.title)
        case "relevance":
          const aRel = getPartyRelevanceScore(a)
          const bRel = getPartyRelevanceScore(b)
          return bRel - aRel
        default:
          return 0
      }
    })

    return filtered
  }, [events, selectedCategory, searchQuery, priceRange, dateFilter, sortBy])

  // Update filtered events and reset pagination when filters change
  useEffect(() => {
    setFilteredEvents(filterEvents)
    setCurrentPage(1)
  }, [filterEvents])

  // Load events on mount
  useEffect(() => {
    loadPartyEvents()
  }, [loadPartyEvents])

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
    // Favorite functionality can be implemented with user authentication
    logger.info("Favorite toggled", { eventId: id })
    // For now, just log the action - can be connected to user preferences later
  }

  const handleClearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
    setPriceRange([0, 200])
    setDateFilter("all")
    setSortBy("relevance")
    setCurrentPage(1)
  }

  const handleRefreshEvents = () => {
    loadPartyEvents()
  }

  return (
    <AppLayout>
      <div className="flex flex-col min-h-screen bg-[#0F1116] text-gray-200">
        {/* Hero Section */}
        <PartyHero />

        {/* Main content */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-[60vh]">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
                <p className="text-gray-400">Finding the best party events...</p>
                <p className="text-sm text-gray-500 mt-2">
                  {apiStatus === "loading" ? "Searching live APIs..." : "Processing results..."}
                </p>
                <div className="mt-4 text-xs text-gray-600">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    <span>Ticketmaster</span>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-100"></div>
                    <span>RapidAPI</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-200"></div>
                    <span>Cached Events</span>
                  </div>
                </div>
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
                        ? `Live Party Events • ${searchStats.successful} sources • ${events.length} events found`
                        : apiStatus === "partial"
                          ? `Partial Results • ${searchStats.successful}/${searchStats.total} sources • ${events.length} events`
                          : `API Error • Using sample party events`}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefreshEvents}
                    className="text-purple-400 hover:text-purple-300"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
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
                        <p className="text-yellow-200 text-xs mt-2">
                          Don't worry! We're showing you sample party events below.
                        </p>
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
                                  <SelectItem value="relevance">Party Relevance</SelectItem>
                                  <SelectItem value="date">Date</SelectItem>
                                  <SelectItem value="popularity">Popularity</SelectItem>
                                  <SelectItem value="price">Price</SelectItem>
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
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
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
                                  onClick={() => setCurrentPage(pageNum)}
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
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
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

// Helper functions remain the same...
function filterPartyEvents(events: EventDetailProps[]): EventDetailProps[] {
  const partyKeywords = [
    "party",
    "festival",
    "brunch",
    "nightlife",
    "club",
    "dance",
    "music",
    "concert",
    "entertainment",
    "celebration",
    "dj",
    "live",
    "outdoor",
    "rooftop",
    "pool",
    "day party",
    "night",
    "weekend",
    "event",
  ]

  return events.filter((event) => {
    const text = `${event.title} ${event.description} ${event.category}`.toLowerCase()
    return partyKeywords.some((keyword) => text.includes(keyword))
  })
}

function enhanceEventsForParty(events: EventDetailProps[]): EventDetailProps[] {
  return events.map((event) => ({
    ...event,
    category: mapToPartyCategory(event.category, event.title, event.description),
    image: event.image || getPartyImage(event.category),
  }))
}

function mapToPartyCategory(category: string, title: string, description: string): string {
  const text = `${category} ${title} ${description}`.toLowerCase()

  if (text.includes("brunch") || text.includes("bottomless")) return "Brunch"
  if (text.includes("day party") || text.includes("pool") || text.includes("daytime")) return "Day Party"
  if (text.includes("festival") || text.includes("fest")) return "Festival"
  if (text.includes("club") || text.includes("nightlife") || text.includes("nightclub")) return "Nightlife"
  if (text.includes("public") || text.includes("community") || text.includes("free")) return "Public Event"
  if (text.includes("party")) return "Party"
  if (text.includes("music") || text.includes("concert")) return "Music"

  return category || "Event"
}

function getPartyImage(category: string): string {
  const partyImages = {
    "Day Party": "/event-7.png",
    Festival: "/event-6.png",
    Nightlife: "/event-4.png",
    Brunch: "/event-8.png",
    "Public Event": "/community-event.png",
    Party: "/event-1.png",
    Music: "/event-2.png",
  }
  return partyImages[category as keyof typeof partyImages] || "/vibrant-community-event.png"
}

function extractPrice(priceString: string): number {
  if (priceString.toLowerCase() === "free") return 0
  const match = priceString.match(/\$(\d+)/)
  return match ? Number.parseInt(match[1]) : 999999
}

function getPartyRelevanceScore(event: EventDetailProps): number {
  const text = `${event.title} ${event.description} ${event.category}`.toLowerCase()
  let score = 0

  // High relevance keywords
  if (text.includes("party")) score += 15
  if (text.includes("festival")) score += 12
  if (text.includes("brunch")) score += 10
  if (text.includes("club") || text.includes("nightclub")) score += 10
  if (text.includes("day party")) score += 12
  if (text.includes("pool party")) score += 10

  // Medium relevance keywords
  if (text.includes("dj")) score += 8
  if (text.includes("dance")) score += 7
  if (text.includes("music")) score += 6
  if (text.includes("live")) score += 5
  if (text.includes("outdoor")) score += 5
  if (text.includes("rooftop")) score += 6

  // Low relevance keywords
  if (text.includes("entertainment")) score += 3
  if (text.includes("celebration")) score += 4
  if (text.includes("weekend")) score += 2

  return score
}

function generateFallbackPartyEvents(): EventDetailProps[] {
  return [
    {
      id: 1001,
      title: "Rooftop Pool Party Extravaganza",
      description:
        "Join us for the ultimate rooftop pool party with DJs, cocktails, and stunning city views. Swim, dance, and party under the sun!",
      category: "Day Party",
      date: "December 15, 2024",
      time: "2:00 PM - 8:00 PM",
      location: "Skyline Rooftop",
      address: "123 High Street, Downtown",
      price: "$45",
      image: "/event-7.png",
      organizer: { name: "Pool Party Productions", avatar: "/avatar-1.png" },
      isFavorite: false,
    },
    {
      id: 1002,
      title: "Electric Music Festival 2024",
      description:
        "Three-day electronic music festival featuring top international DJs, food trucks, and art installations.",
      category: "Festival",
      date: "December 20, 2024",
      time: "12:00 PM - 11:00 PM",
      location: "Festival Grounds",
      address: "555 Music Park, Festival City",
      price: "$120",
      image: "/event-6.png",
      organizer: { name: "Electric Dreams", avatar: "/avatar-2.png" },
      isFavorite: false,
    },
    {
      id: 1003,
      title: "Bottomless Brunch & Beats",
      description: "Unlimited mimosas, delicious brunch menu, and live DJ sets. The perfect weekend vibe!",
      category: "Brunch",
      date: "December 16, 2024",
      time: "11:00 AM - 4:00 PM",
      location: "Brunch Club",
      address: "789 Brunch Boulevard, Midtown",
      price: "$65",
      image: "/event-8.png",
      organizer: { name: "Brunch Society", avatar: "/avatar-3.png" },
      isFavorite: false,
    },
    {
      id: 1004,
      title: "Underground Nightclub Experience",
      description: "Exclusive underground club night with world-class DJs, premium bottle service, and VIP treatment.",
      category: "Nightlife",
      date: "December 21, 2024",
      time: "10:00 PM - 4:00 AM",
      location: "The Underground",
      address: "456 Club Street, Nightlife District",
      price: "$80",
      image: "/event-4.png",
      organizer: { name: "Night Owl Events", avatar: "/avatar-4.png" },
      isFavorite: false,
    },
    {
      id: 1005,
      title: "Community Street Festival",
      description: "Free public festival with live music, food vendors, art displays, and family-friendly activities.",
      category: "Public Event",
      date: "December 18, 2024",
      time: "10:00 AM - 6:00 PM",
      location: "Central Park",
      address: "100 Park Avenue, City Center",
      price: "Free",
      image: "/community-event.png",
      organizer: { name: "City Events", avatar: "/avatar-5.png" },
      isFavorite: false,
    },
    {
      id: 1006,
      title: "Neon Glow Party Night",
      description: "Glow-in-the-dark party with neon decorations, UV lights, body paint, and electronic music.",
      category: "Party",
      date: "December 22, 2024",
      time: "9:00 PM - 3:00 AM",
      location: "Glow Arena",
      address: "321 Neon Street, Party District",
      price: "$35",
      image: "/event-1.png",
      organizer: { name: "Glow Events", avatar: "/avatar-6.png" },
      isFavorite: false,
    },
    {
      id: 1007,
      title: "Sunset Beach Party",
      description: "Beach party with live bands, beach volleyball, bonfire, and tropical cocktails as the sun sets.",
      category: "Day Party",
      date: "December 19, 2024",
      time: "4:00 PM - 11:00 PM",
      location: "Sunset Beach",
      address: "Ocean Drive, Beach District",
      price: "$30",
      image: "/event-9.png",
      organizer: { name: "Beach Vibes", avatar: "/avatar-4.png" },
      isFavorite: false,
    },
    {
      id: 1008,
      title: "Wine & Jazz Brunch",
      description: "Sophisticated brunch experience with live jazz music, wine pairings, and gourmet cuisine.",
      category: "Brunch",
      date: "December 17, 2024",
      time: "10:00 AM - 3:00 PM",
      location: "Jazz Lounge",
      address: "456 Music Street, Arts District",
      price: "$85",
      image: "/event-10.png",
      organizer: { name: "Jazz & Dine", avatar: "/avatar-5.png" },
      isFavorite: false,
    },
  ]
}
