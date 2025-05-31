"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { EventDetailModal } from "@/components/event-detail-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Music, Zap, Star, TrendingUp, Volume2, Headphones, Disc3, Radio, AlertCircle, CheckCircle } from "lucide-react"
import type { EventDetail } from "@/types/event.types"
import { PartyHero } from "@/components/party/party-hero"
import { CategoryTabs } from "@/components/party/category-tabs"
import { FeaturedArtists } from "@/components/party/featured-artists"
import { PartyFooter } from "@/components/party/party-footer"
import { EventCard } from "@/components/event-card"
import { searchEvents, testRapidApiConnection } from "@/lib/api/events-api"
import { logger } from "@/lib/utils/logger"
import { AppLayout } from "@/components/app-layout"

// Enhanced party categories with more specific music genres
const partyCategories = [
  { id: "all", name: "All Events", icon: Music, color: "bg-purple-500" },
  { id: "electronic", name: "Electronic", icon: Zap, color: "bg-blue-500" },
  { id: "techno", name: "Techno", icon: Volume2, color: "bg-red-500" },
  { id: "house", name: "House", icon: Headphones, color: "bg-green-500" },
  { id: "hip-hop", name: "Hip-Hop", icon: Radio, color: "bg-yellow-500" },
  { id: "festival", name: "Festival", icon: TrendingUp, color: "bg-indigo-500" },
  { id: "nightclub", name: "Nightclub", icon: Disc3, color: "bg-pink-500" },
  { id: "retro", name: "Retro", icon: Star, color: "bg-orange-500" },
]

// Enhanced featured artists with more details
const featuredArtists = [
  {
    id: 1,
    name: "DJ Pulse",
    genre: "Techno / House",
    image: "/dj-1.png?height=300&width=300&query=dj with headphones",
    upcoming: 3,
    followers: "125K",
    verified: true,
    bio: "International techno sensation known for underground warehouse sets",
  },
  {
    id: 2,
    name: "Neon Dreams",
    genre: "Electronic / Ambient",
    image: "/dj-2.png?height=300&width=300&query=female dj performing",
    upcoming: 2,
    followers: "89K",
    verified: true,
    bio: "Rising star in the electronic music scene with ethereal soundscapes",
  },
  {
    id: 3,
    name: "Bass Collective",
    genre: "Drum & Bass / Jungle",
    image: "/dj-3.png?height=300&width=300&query=dj at festival",
    upcoming: 4,
    followers: "156K",
    verified: true,
    bio: "Heavy bass drops and jungle rhythms that move crowds worldwide",
  },
  {
    id: 4,
    name: "Midnight Vibes",
    genre: "Deep House / Progressive",
    image: "/dj-4.png?height=300&width=300&query=dj in club",
    upcoming: 1,
    followers: "67K",
    verified: false,
    bio: "Deep house specialist creating immersive late-night experiences",
  },
]

export default function PartyPage() {
  // State management
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [events, setEvents] = useState<EventDetail[]>([])
  const [filteredEvents, setFilteredEvents] = useState<EventDetail[]>([])
  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [isFiltering, setIsFiltering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<"loading" | "success" | "error" | "partial">("loading")
  const [searchStats, setSearchStats] = useState({ successful: 0, total: 0, events: 0 })
  const [apiConfigStatus, setApiConfigStatus] = useState<"checking" | "configured" | "not-configured">("checking")

  // Filter states
  const [priceRange, setPriceRange] = useState([0, 200])
  const [dateFilter, setDateFilter] = useState("all")
  const [locationFilter, setLocationFilter] = useState("all")
  const [sortBy, setSortBy] = useState("date")

  // Check RapidAPI configuration
  useEffect(() => {
    const checkApiConfig = async () => {
      try {
        const isConfigured = await testRapidApiConnection()
        setApiConfigStatus(isConfigured ? "configured" : "not-configured")

        logger.info(`RapidAPI configuration check: ${isConfigured ? "Configured" : "Not configured"}`)
      } catch (error) {
        setApiConfigStatus("not-configured")
        logger.error("Failed to check RapidAPI configuration", { error })
      }
    }

    checkApiConfig()
  }, [])

  // Load party events using the standard searchEvents function
  const loadPartyEvents = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      setApiStatus("loading")

      logger.info("Loading party events", {
        component: "PartyPage",
        action: "loadPartyEvents",
        apiConfigStatus,
        searchQuery: searchQuery || "none",
      })

      // If RapidAPI is not configured, use fallback events immediately
      if (apiConfigStatus === "not-configured") {
        logger.warn("RapidAPI not configured, using fallback events")
        setApiStatus("error")
        setError("RapidAPI is not configured. Please check your API key and configuration.")
        const fallbackEvents = generateFallbackPartyEvents()
        setEvents(fallbackEvents)
        setSearchStats({ successful: 0, total: 0, events: fallbackEvents.length })
        return
      }

      // Use the standard searchEvents function which combines multiple APIs
      const searchResult = await searchEvents({
        keyword: searchQuery || "music concert party nightlife",
        size: 50,
        sort: "date",
      })

      logger.info(`Search completed: ${searchResult.events.length} events found`, {
        sources: searchResult.sources,
        totalCount: searchResult.totalCount,
        error: searchResult.error,
      })

      if (searchResult.events.length === 0) {
        // If no events found, use fallback events
        setApiStatus("partial")
        setError("No events found. Using sample events instead.")

        const fallbackEvents = generateFallbackPartyEvents()
        setEvents(fallbackEvents)
        setSearchStats({ successful: 0, total: 1, events: fallbackEvents.length })

        logger.info("No events found, using fallback events", {
          fallbackCount: fallbackEvents.length,
        })
      } else {
        // Process and enhance the events we found
        const partyEvents = enhanceEventsForParty(searchResult.events)

        // Sort by relevance and date
        const sortedEvents = partyEvents.sort((a, b) => {
          const aIsParty = isPartyEvent(a)
          const bIsParty = isPartyEvent(b)

          if (aIsParty && !bIsParty) return -1
          if (!aIsParty && bIsParty) return 1

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

        logger.info(`Successfully loaded ${sortedEvents.length} events`, {
          sources: searchResult.sources,
          originalCount: searchResult.events.length,
          finalCount: sortedEvents.length,
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load events"

      logger.error("Event search completely failed", {
        error: errorMessage,
        searchQuery: searchQuery || "none",
      })

      setError(`Error: ${errorMessage}`)
      setApiStatus("error")

      // Always provide fallback events
      const fallbackEvents = generateFallbackPartyEvents()
      setEvents(fallbackEvents)
      setSearchStats({ successful: 0, total: 1, events: fallbackEvents.length })

      logger.info("Using fallback events due to complete search failure")
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, apiConfigStatus])

  // Enhanced event filtering
  const filterEvents = useMemo(() => {
    let filtered = events

    // Filter by category
    if (activeTab !== "all") {
      filtered = filtered.filter((event) => {
        const eventText = `${event.category} ${event.title} ${event.description}`.toLowerCase()
        const tabLower = activeTab.toLowerCase()

        switch (tabLower) {
          case "electronic":
            return (
              eventText.includes("electronic") ||
              eventText.includes("edm") ||
              eventText.includes("rave") ||
              eventText.includes("dance music")
            )
          case "techno":
            return eventText.includes("techno") || eventText.includes("underground")
          case "house":
            return eventText.includes("house") && eventText.includes("music")
          case "hip-hop":
            return eventText.includes("hip") || eventText.includes("rap") || eventText.includes("urban")
          case "festival":
            return eventText.includes("festival")
          case "nightclub":
            return eventText.includes("club") || eventText.includes("nightlife") || eventText.includes("night")
          case "retro":
            return (
              eventText.includes("retro") ||
              eventText.includes("80s") ||
              eventText.includes("90s") ||
              eventText.includes("vintage")
            )
          default:
            return eventText.includes(tabLower)
        }
      })
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
          return b.attendees - a.attendees
        case "price":
          const priceA = extractPrice(a.price)
          const priceB = extractPrice(b.price)
          return priceA - priceB
        case "alphabetical":
          return a.title.localeCompare(b.title)
        case "relevance":
          const aRelevance = getPartyRelevanceScore(a)
          const bRelevance = getPartyRelevanceScore(b)
          return bRelevance - aRelevance
        default:
          return 0
      }
    })

    return filtered
  }, [events, activeTab, searchQuery, priceRange, dateFilter, sortBy])

  // Update filtered events when filters change
  useEffect(() => {
    setFilteredEvents(filterEvents)
  }, [filterEvents])

  // Load events on mount
  useEffect(() => {
    loadPartyEvents()
  }, [loadPartyEvents])

  // Event handlers
  const handleViewEventDetails = (event: EventDetail) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setTimeout(() => setSelectedEvent(null), 300)
  }

  const handleToggleFavorite = (id: number) => {
    setEvents((prevEvents) =>
      prevEvents.map((event) => (event.id === id ? { ...event, isFavorite: !event.isFavorite } : event)),
    )
  }

  const handleFilter = () => {
    setIsFiltering(true)
    setTimeout(() => {
      setIsFiltering(false)
    }, 800)
  }

  const handleClearFilters = () => {
    setSearchQuery("")
    setPriceRange([0, 200])
    setDateFilter("all")
    setLocationFilter("all")
    setSortBy("date")
    setActiveTab("all")
  }

  const handleRefreshEvents = () => {
    loadPartyEvents()
  }

  return (
    <AppLayout>
      <div className="flex flex-col min-h-screen bg-[#0F1116] text-gray-200">
        {/* Main content */}
        <main className="flex-1 p-4 md:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-[80vh]">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
                <p className="text-gray-400">Searching for party events...</p>
                <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
              </motion.div>
            </div>
          ) : (
            <>
              {/* Hero section */}
              <PartyHero />

              {/* API Status Indicator */}
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
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
                        ? `Live Events • ${searchStats.successful} sources • ${events.length} events found`
                        : apiStatus === "partial"
                          ? `Partial Results • ${searchStats.successful}/${searchStats.total} sources • ${events.length} events`
                          : `API ${apiConfigStatus === "not-configured" ? "Not Configured" : "Error"} • Using sample events`}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefreshEvents}
                    className={
                      apiStatus === "success"
                        ? "text-green-400 hover:text-green-300"
                        : "text-yellow-400 hover:text-yellow-300"
                    }
                  >
                    Refresh
                  </Button>
                </div>
              </motion.div>

              {/* Error message if needed */}
              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4">
                  <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-yellow-400 font-medium">API Notice</h4>
                        <p className="text-yellow-300 text-sm mt-1">{error}</p>
                        {apiConfigStatus === "not-configured" && (
                          <p className="text-yellow-200 text-xs mt-2">
                            The RapidAPI key may not be configured. Please check your environment variables.
                          </p>
                        )}
                        <p className="text-yellow-200 text-xs mt-2">
                          Don't worry! We're showing you sample party events below.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Filters and categories */}
              <CategoryTabs
                categories={partyCategories}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onFilterClick={() => setShowFilters(!showFilters)}
              />

              {/* Advanced filters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6"
                  >
                    <Card className="bg-[#1A1D25] border-gray-800">
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Price Range */}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Price Range: ${priceRange[0]} - ${priceRange[1]}
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
                            <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
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

                          {/* Actions */}
                          <div className="flex items-end gap-2">
                            <Button
                              onClick={handleFilter}
                              disabled={isFiltering}
                              className="bg-purple-600 hover:bg-purple-700 flex-1"
                            >
                              {isFiltering ? "Filtering..." : "Apply"}
                            </Button>
                            <Button
                              onClick={handleClearFilters}
                              variant="outline"
                              className="border-gray-700 hover:bg-gray-800"
                            >
                              Clear
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Events Grid */}
              <Tabs defaultValue="all" className="mt-0">
                <TabsContent value="all" className="mt-0">
                  {filteredEvents.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                      <Music className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-400 mb-2">No events found</h3>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredEvents.map((event, i) => (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * i, duration: 0.4 }}
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
                  )}
                </TabsContent>
              </Tabs>

              {/* Featured DJs/Artists */}
              <FeaturedArtists artists={featuredArtists} />

              {/* Load More Button */}
              {filteredEvents.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-8">
                  <Button
                    onClick={handleRefreshEvents}
                    variant="outline"
                    className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
                  >
                    Load More Events
                  </Button>
                </motion.div>
              )}
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

// Helper functions
function enhanceEventsForParty(events: EventDetail[]): EventDetail[] {
  return events.map((event) => ({
    ...event,
    category: mapToPartyCategory(event.category, event.title, event.description),
    image: event.image || getPartyImage(event.category),
  }))
}

function mapToPartyCategory(category: string, title: string, description: string): string {
  const text = `${category} ${title} ${description}`.toLowerCase()

  if (text.includes("electronic") || text.includes("edm") || text.includes("rave")) return "Electronic"
  if (text.includes("techno") || text.includes("underground")) return "Techno"
  if (text.includes("house") && text.includes("music")) return "House"
  if (text.includes("hip-hop") || text.includes("hip hop") || text.includes("rap")) return "Hip-Hop"
  if (text.includes("festival") || text.includes("fest")) return "Festival"
  if (text.includes("club") || text.includes("nightlife") || text.includes("night")) return "Nightclub"
  if (text.includes("retro") || text.includes("80s") || text.includes("90s")) return "Retro"

  return category || "Music"
}

function getPartyImage(category: string): string {
  const partyImages = {
    Electronic: "/event-1.png",
    Techno: "/event-2.png",
    House: "/event-3.png",
    "Hip-Hop": "/event-4.png",
    Festival: "/event-6.png",
    Nightclub: "/event-7.png",
    Retro: "/event-5.png",
  }
  return partyImages[category as keyof typeof partyImages] || "/vibrant-community-event.png"
}

function extractPrice(priceString: string): number {
  if (priceString.toLowerCase() === "free") return 0
  const match = priceString.match(/\$(\d+)/)
  return match ? Number.parseInt(match[1]) : 999999
}

function isPartyEvent(event: EventDetail): boolean {
  const text = `${event.title} ${event.description} ${event.category}`.toLowerCase()
  const partyKeywords = [
    "party",
    "club",
    "nightlife",
    "dj",
    "dance",
    "electronic",
    "techno",
    "house",
    "rave",
    "festival",
    "music",
    "concert",
    "live",
    "night",
    "entertainment",
  ]
  return partyKeywords.some((keyword) => text.includes(keyword))
}

function getPartyRelevanceScore(event: EventDetail): number {
  const text = `${event.title} ${event.description} ${event.category}`.toLowerCase()
  let score = 0

  if (text.includes("party")) score += 10
  if (text.includes("club") || text.includes("nightclub")) score += 8
  if (text.includes("dj")) score += 7
  if (text.includes("electronic") || text.includes("edm")) score += 6
  if (text.includes("techno") || text.includes("house")) score += 6
  if (text.includes("festival")) score += 5
  if (text.includes("dance")) score += 5
  if (text.includes("music")) score += 3
  if (text.includes("live")) score += 2

  return score
}

function generateFallbackPartyEvents(): EventDetail[] {
  return [
    {
      id: 1001,
      title: "Neon Nights: Electronic Music Festival",
      description:
        "Experience the ultimate electronic music festival with world-class DJs, immersive light shows, and state-of-the-art sound systems.",
      category: "Electronic",
      date: "December 15, 2024",
      time: "9:00 PM - 4:00 AM",
      location: "Pulse Nightclub",
      address: "123 Beat Street, Downtown",
      price: "$75",
      image: "/event-1.png",
      organizer: { name: "Pulse Events", avatar: "/avatar-1.png" },
      attendees: 1850,
      isFavorite: false,
    },
    {
      id: 1002,
      title: "Underground Techno Night",
      description:
        "Dive into the underground techno scene with this exclusive warehouse party featuring cutting-edge techno artists.",
      category: "Techno",
      date: "December 16, 2024",
      time: "11:00 PM - 6:00 AM",
      location: "The Warehouse",
      address: "456 Industrial Ave, Eastside",
      price: "$40",
      image: "/event-2.png",
      organizer: { name: "Techno Collective", avatar: "/avatar-2.png" },
      attendees: 450,
      isFavorite: false,
    },
    {
      id: 1003,
      title: "Rooftop House Music Sessions",
      description:
        "Join us for a magical evening of house music as the sun sets over the city skyline with resident DJs.",
      category: "House",
      date: "December 17, 2024",
      time: "6:00 PM - 12:00 AM",
      location: "Skyline Rooftop",
      address: "789 View Terrace, Uptown",
      price: "$55",
      image: "/event-3.png",
      organizer: { name: "Skyline Events", avatar: "/avatar-3.png" },
      attendees: 320,
      isFavorite: false,
    },
    {
      id: 1004,
      title: "Hip-Hop Block Party Extravaganza",
      description:
        "Celebrate hip-hop culture with live performances, DJ battles, breakdancing competitions, and street art.",
      category: "Hip-Hop",
      date: "December 18, 2024",
      time: "2:00 PM - 10:00 PM",
      location: "Urban Square",
      address: "101 Beat Boulevard, Westside",
      price: "$25",
      image: "/event-4.png",
      organizer: { name: "Urban Collective", avatar: "/avatar-4.png" },
      attendees: 780,
      isFavorite: false,
    },
    {
      id: 1005,
      title: "Electric Dreams Music Festival",
      description:
        "Three-day electronic music festival featuring top international DJs and immersive art installations.",
      category: "Festival",
      date: "December 20, 2024",
      time: "12:00 PM - 2:00 AM",
      location: "Festival Grounds",
      address: "555 Music Park, Festival City",
      price: "$150",
      image: "/event-6.png",
      organizer: { name: "Electric Dreams", avatar: "/avatar-5.png" },
      attendees: 5000,
      isFavorite: false,
    },
    {
      id: 1006,
      title: "Midnight Club: VIP Nightlife Experience",
      description: "Exclusive nightclub experience with premium bottle service, celebrity DJs, and VIP treatment.",
      category: "Nightclub",
      date: "December 21, 2024",
      time: "10:00 PM - 4:00 AM",
      location: "Midnight Club",
      address: "777 Nightlife Ave, Club District",
      price: "$100",
      image: "/event-7.png",
      organizer: { name: "Midnight Entertainment", avatar: "/avatar-6.png" },
      attendees: 800,
      isFavorite: false,
    },
    {
      id: 1007,
      title: "80s Retro Dance Night",
      description: "Step back in time with classic 80s hits, neon lights, and vintage cocktails in a retro atmosphere.",
      category: "Retro",
      date: "December 22, 2024",
      time: "8:00 PM - 2:00 AM",
      location: "Flashback Lounge",
      address: "202 Memory Lane, Midtown",
      price: "$30",
      image: "/event-5.png",
      organizer: { name: "Time Machine Events", avatar: "/avatar-5.png" },
      attendees: 540,
      isFavorite: false,
    },
    {
      id: 1008,
      title: "Summer Pool Party Bash",
      description: "Beat the heat with this epic pool party featuring live DJs, cocktails, and poolside dancing.",
      category: "Day Party",
      date: "December 23, 2024",
      time: "2:00 PM - 8:00 PM",
      location: "Aqua Lounge",
      address: "888 Pool Plaza, Sunny District",
      price: "$45",
      image: "/event-8.png",
      organizer: { name: "Aqua Events", avatar: "/avatar-6.png" },
      attendees: 300,
      isFavorite: false,
    },
  ]
}
