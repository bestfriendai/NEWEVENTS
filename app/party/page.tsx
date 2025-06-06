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
} from "lucide-react"
import type { EventDetailProps } from "@/components/event-detail-modal"
import { unifiedEventsService } from "@/lib/api/unified-events-service"
import { logger } from "@/lib/utils/logger"
import { AppLayout } from "@/components/app-layout"
import { EventCard } from "@/components/event-card"
import { PartyHero } from "@/components/party/party-hero"
import { FeaturedArtists } from "@/components/party/featured-artists"
import { PartyFooter } from "@/components/party/party-footer"
import { useLocationContext } from "@/contexts/LocationContext"
import { locationService } from "@/lib/services/location-service"

// Distance calculation utility
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 3959 // Earth's radius in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLng = (lng2 - lng1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Function to filter out sports events
const filterOutSportsEvents = (events: any[]): any[] => {
  const sportsKeywords = [
    "football", "basketball", "baseball", "soccer", "hockey", "tennis",
    "golf", "volleyball", "swimming", "track", "field", "marathon",
    "game", "match", "tournament", "championship", "league", "playoffs",
    "stadium", "arena", "court", "field", "track", "pool", "gym",
    "sport", "sports", "athletic", "athletics", "team", "vs", "versus",
    "nfl", "nba", "mlb", "nhl", "mls", "fifa", "olympics", "ncaa"
  ]

  return events.filter(event => {
    const eventText = `${event.title || ""} ${event.description || ""} ${event.category || ""} ${event.location || ""}`.toLowerCase()

    // Check if any sports keywords are present
    const hasSportsKeywords = sportsKeywords.some(keyword => eventText.includes(keyword))

    // Also check venue type for sports venues
    const venueText = `${event.venue?.name || ""} ${event.venue?.address || ""}`.toLowerCase()
    const isSportsVenue = ["stadium", "arena", "field", "court", "gym", "track"].some(venue => venueText.includes(venue))

    // Filter out if it contains sports keywords or is at a sports venue
    return !hasSportsKeywords && !isSportsVenue
  })
}

// Party-specific categories with enhanced keywords
const partyCategories = [
  { id: "all", name: "All Parties", icon: PartyPopper, color: "bg-purple-500", keywords: [] },
  {
    id: "day-parties",
    name: "Day Parties",
    icon: Sun,
    color: "bg-yellow-500",
    keywords: [
      "day party", "pool party", "brunch", "daytime", "afternoon", "outdoor", "rooftop",
      "beach party", "garden party", "patio", "terrace", "lawn", "picnic", "bbq",
      "pool", "swimming", "sun", "summer", "spring", "weekend", "saturday", "sunday"
    ],
  },
  {
    id: "festivals",
    name: "Festivals",
    icon: Sparkles,
    color: "bg-pink-500",
    keywords: [
      "festival", "fest", "music festival", "outdoor festival", "concert", "live music",
      "art festival", "food festival", "street festival", "summer festival", "winter festival",
      "cultural festival", "community festival", "local festival", "annual festival",
      "multi-day", "weekend festival", "camping", "fairgrounds", "amphitheater"
    ],
  },
  {
    id: "nightlife",
    name: "Nightlife",
    icon: Zap,
    color: "bg-blue-500",
    keywords: [
      "nightclub", "club", "nightlife", "night party", "dance", "dj", "disc jockey",
      "late night", "after party", "bar", "lounge", "cocktail", "drinks", "dancing",
      "electronic", "house", "techno", "edm", "rave", "underground", "warehouse",
      "friday night", "saturday night", "weekend", "vip", "bottle service"
    ],
  },
  {
    id: "brunches",
    name: "Brunches",
    icon: Users,
    color: "bg-green-500",
    keywords: [
      "brunch", "bottomless brunch", "weekend brunch", "mimosa", "breakfast", "lunch",
      "sunday brunch", "saturday brunch", "morning", "eggs", "pancakes", "waffles",
      "bloody mary", "champagne", "prosecco", "coffee", "cafe", "restaurant",
      "buffet", "all you can eat", "unlimited", "social dining"
    ],
  },
  {
    id: "public-events",
    name: "Public Events",
    icon: Music,
    color: "bg-indigo-500",
    keywords: [
      "public", "community", "free", "outdoor", "street", "park", "plaza", "square",
      "city event", "municipal", "government", "local", "neighborhood", "family friendly",
      "all ages", "cultural", "educational", "charity", "fundraiser", "volunteer",
      "civic", "town hall", "library", "museum", "gallery", "market", "fair"
    ],
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
  // Location context
  const { userLocation, getCurrentLocation, searchLocation, isLoading: locationLoading, error: locationError } = useLocationContext()

  // State management
  const [isLoading, setIsLoading] = useState(true)
  const [events, setEvents] = useState<EventDetailProps[]>([])
  const [filteredEvents, setFilteredEvents] = useState<EventDetailProps[]>([])
  const [selectedEvent, setSelectedEvent] = useState<EventDetailProps | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<"loading" | "success" | "error" | "partial">("loading")
  const [searchStats, setSearchStats] = useState({ successful: 0, total: 0, events: 0 })

  // Location states
  const [showLocationPrompt, setShowLocationPrompt] = useState(true)
  const [locationQuery, setLocationQuery] = useState("")
  const [currentLocationName, setCurrentLocationName] = useState("")
  const [searchRadius, setSearchRadius] = useState(50) // miles - increased for better coverage

  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [priceRange, setPriceRange] = useState([0, 200])
  const [dateFilter, setDateFilter] = useState("all")
  const [sortBy, setSortBy] = useState("date") // Default to date (soonest first)
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [eventsPerPage] = useState(24)

  // Load party events with enhanced filtering and location-based search
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
        location: userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : "none",
        radius: searchRadius,
      })

      // Build comprehensive party-specific search terms for Ticketmaster/RapidAPI (NO SPORTS)
      const partyKeywords = [
        // Core party terms
        "party", "parties", "celebration", "bash", "gathering", "social",

        // Festival & outdoor events
        "festival", "fest", "music festival", "outdoor festival", "street festival",
        "food festival", "art festival", "summer festival", "winter festival",

        // Nightlife & clubs
        "nightlife", "club", "nightclub", "night club", "dance club", "lounge",
        "bar", "pub", "cocktail", "happy hour", "after party", "late night",

        // Music & entertainment
        "concert", "live music", "band", "dj", "disc jockey", "performance",
        "show", "entertainment", "music", "acoustic", "live band",

        // Electronic & dance music
        "electronic", "edm", "house", "techno", "trance", "dubstep", "rave",
        "dance", "dancing", "dance party", "dance music", "beats",

        // Day events
        "brunch", "day party", "daytime", "afternoon", "morning", "lunch",
        "bottomless brunch", "weekend brunch", "sunday brunch",

        // Outdoor & venue types
        "outdoor", "rooftop", "pool party", "beach party", "garden party",
        "patio", "terrace", "park", "plaza", "courtyard", "lawn",

        // Special events
        "birthday", "anniversary", "graduation", "holiday", "new year",
        "halloween", "christmas", "valentine", "st patrick", "cinco de mayo",

        // Activity types
        "karaoke", "trivia", "game night", "comedy", "stand up", "open mic",
        "networking", "mixer", "meetup", "social hour", "wine tasting",

        // Venue descriptors
        "venue", "space", "hall", "center", "ballroom", "warehouse", "loft",
        "studio", "gallery", "theater", "amphitheater", "pavilion",

        // Event styles
        "themed", "costume", "dress up", "formal", "casual", "upscale",
        "underground", "exclusive", "vip", "premium", "luxury",

        // Food & drink
        "food truck", "beer garden", "wine bar", "brewery", "distillery",
        "tasting", "culinary", "chef", "gourmet", "buffet", "catering"
      ]

      // Sports exclusion keywords to filter out
      const sportsExclusionKeywords = [
        "football", "basketball", "baseball", "soccer", "hockey", "tennis",
        "golf", "volleyball", "swimming", "track", "field", "marathon",
        "game", "match", "tournament", "championship", "league", "playoffs",
        "stadium", "arena", "court", "field", "track", "pool", "gym",
        "sport", "sports", "athletic", "athletics", "team", "vs", "versus"
      ]

      // Build more comprehensive search terms
      let searchTerm = searchQuery || partyKeywords.slice(0, 15).join(" ") // Use more keywords

      // Add category-specific keywords
      if (selectedCategory !== "all") {
        const category = partyCategories.find((c) => c.id === selectedCategory)
        if (category && category.keywords.length > 0) {
          const categoryKeywords = category.keywords.join(" ")
          searchTerm = searchQuery
            ? `${searchQuery} ${categoryKeywords}`
            : `${categoryKeywords} ${partyKeywords.slice(0, 10).join(" ")}`
        }
      }

      // Add date filtering for upcoming events (next 3 months)
      const now = new Date()
      const threeMonthsFromNow = new Date()
      threeMonthsFromNow.setMonth(now.getMonth() + 3)

      // Use unified events service with location-based search and date filtering
      const searchParams: any = {
        query: searchTerm,
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        startDate: now.toISOString(), // Only future events
        endDate: threeMonthsFromNow.toISOString(), // Within next 3 months
        limit: 200, // Increased limit for better results
      }

      // ALWAYS add location parameters if available (fix for location filtering issue)
      if (userLocation) {
        searchParams.lat = userLocation.lat
        searchParams.lng = userLocation.lng
        searchParams.radius = searchRadius

        logger.info("Using location-based search for party events", {
          component: "PartyPage",
          location: { lat: userLocation.lat, lng: userLocation.lng },
          radius: searchRadius,
          category: selectedCategory,
        })
      }

      // Execute multiple parallel searches for better party coverage
      const parallelSearches = [
        // Main search with comprehensive terms
        unifiedEventsService.searchEvents(searchParams),

        // Additional targeted searches for more party events
        unifiedEventsService.searchEvents({
          ...searchParams,
          query: "nightlife club bar lounge dance party",
          limit: 75,
        }),

        unifiedEventsService.searchEvents({
          ...searchParams,
          query: "festival music concert live entertainment",
          limit: 75,
        }),

        unifiedEventsService.searchEvents({
          ...searchParams,
          query: "brunch social gathering celebration event",
          limit: 75,
        }),

        unifiedEventsService.searchEvents({
          ...searchParams,
          query: "dj electronic house techno dance music",
          limit: 75,
        }),
      ]

      logger.info("Executing parallel party searches", {
        component: "PartyPage",
        searchCount: parallelSearches.length,
        location: userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : null,
      })

      const searchResults = await Promise.allSettled(parallelSearches)

      // Combine all successful results
      let allEvents: any[] = []
      let successfulSources = 0
      let totalSources = 0

      searchResults.forEach((result, index) => {
        totalSources++
        if (result.status === 'fulfilled' && result.value.events) {
          allEvents = [...allEvents, ...result.value.events]
          successfulSources++
          logger.info(`Parallel search ${index + 1} successful`, {
            component: "PartyPage",
            eventCount: result.value.events.length,
          })
        } else {
          logger.warn(`Parallel search ${index + 1} failed`, {
            component: "PartyPage",
            error: result.status === 'rejected' ? result.reason : 'No events',
          })
        }
      })

      // Remove duplicates based on event ID or title+date
      const uniqueEvents = allEvents.filter((event, index, self) =>
        index === self.findIndex(e =>
          e.id === event.id ||
          (e.title === event.title && e.date === event.date && e.location === event.location)
        )
      )

      logger.info("Combined parallel search results", {
        component: "PartyPage",
        totalEvents: allEvents.length,
        uniqueEvents: uniqueEvents.length,
        successfulSources,
        totalSources,
      })

      const searchResult = {
        events: uniqueEvents,
        sources: successfulSources,
        total: totalSources,
      }

      logger.info(`Search completed: ${searchResult.events.length} events found`, {
        sources: searchResult.sources,
        totalCount: searchResult.totalCount,
        error: searchResult.error,
      })

      if (searchResult.events.length === 0) {
        setApiStatus("partial")
        setError("No party events found from APIs. Trying broader search...")

        // Try multiple comprehensive fallback searches with different keyword combinations (NO SPORTS)
        const fallbackSearches = [
          "party music dance club nightlife entertainment",
          "festival concert live music performance show",
          "brunch bar restaurant social event gathering",
          "celebration birthday anniversary party event",
          "nightclub lounge cocktail party drinks",
          "dj electronic house techno dance music",
          "outdoor festival park plaza event",
          "rooftop pool party summer event",
          "comedy karaoke trivia social night",
          "wine beer tasting social gathering",
          "art gallery opening cultural event",
          "food truck festival street fair"
        ]

        let fallbackResult = null
        for (const fallbackQuery of fallbackSearches) {
          const fallbackParams: any = {
            query: fallbackQuery,
            startDate: now.toISOString(),
            endDate: threeMonthsFromNow.toISOString(),
            limit: 75,
          }

          // ALWAYS include location if available (fix for location filtering)
          if (userLocation) {
            fallbackParams.lat = userLocation.lat
            fallbackParams.lng = userLocation.lng
            fallbackParams.radius = searchRadius * 2 // Expand radius for fallback

            logger.info("Using location-based fallback search", {
              component: "PartyPage",
              query: fallbackQuery,
              location: { lat: userLocation.lat, lng: userLocation.lng },
              radius: searchRadius * 2,
            })
          }

          fallbackResult = await unifiedEventsService.searchEvents(fallbackParams)
          if (fallbackResult.events.length > 0) {
            logger.info(`Fallback search successful with query: ${fallbackQuery}`, {
              component: "PartyPage",
              eventCount: fallbackResult.events.length,
            })
            break
          }
        }

        if (fallbackResult.events.length > 0) {
          const nonSportsEvents = filterOutSportsEvents(fallbackResult.events)
          const partyEvents = filterPartyEvents(nonSportsEvents)
          const enhancedEvents = enhanceEventsForParty(partyEvents)

          // Filter for quality events with images and descriptions
          const qualityEvents = enhancedEvents.filter(event => {
            const hasImage = event.image || event.thumbnail || (event.images && event.images.length > 0)
            const hasDescription = event.description && event.description.trim().length > 20
            return hasImage && hasDescription
          })

          setEvents(qualityEvents)
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
        // Filter out sports events first, then filter and enhance for party relevance
        const nonSportsEvents = filterOutSportsEvents(searchResult.events)
        const partyEvents = filterPartyEvents(nonSportsEvents)
        const enhancedEvents = enhanceEventsForParty(partyEvents)

        // Filter out events without images or descriptions (as per user preference)
        const qualityEvents = enhancedEvents.filter(event => {
          const hasImage = event.image || event.thumbnail || (event.images && event.images.length > 0)
          const hasDescription = event.description && event.description.trim().length > 20
          return hasImage && hasDescription
        })

        logger.info("Applied comprehensive event filtering", {
          component: "PartyPage",
          originalCount: searchResult.events.length,
          afterSportsFilter: nonSportsEvents.length,
          afterPartyFilter: partyEvents.length,
          afterQualityFilter: qualityEvents.length,
        })

        // Sort by date first (soonest events), then by party relevance
        const sortedEvents = qualityEvents.sort((a, b) => {
          const aDate = new Date(a.date).getTime()
          const bDate = new Date(b.date).getTime()
          const now = Date.now()

          // Prioritize events happening soon (within next 7 days)
          const aIsUpcoming = aDate - now <= 7 * 24 * 60 * 60 * 1000 && aDate > now
          const bIsUpcoming = bDate - now <= 7 * 24 * 60 * 60 * 1000 && bDate > now

          if (aIsUpcoming && !bIsUpcoming) return -1
          if (!aIsUpcoming && bIsUpcoming) return 1

          // If both are upcoming or both are not, sort by date (soonest first)
          if (aDate !== bDate) {
            return aDate - bDate
          }

          // If dates are the same, sort by party relevance
          const aRelevance = getPartyRelevanceScore(a)
          const bRelevance = getPartyRelevanceScore(b)
          return bRelevance - aRelevance
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

        logger.info(`Successfully loaded ${sortedEvents.length} party events (sorted by date - soonest first)`, {
          sources: searchResult.sources,
          originalCount: searchResult.events.length,
          finalCount: sortedEvents.length,
          upcomingEvents: sortedEvents.filter(e => {
            const eventDate = new Date(e.date).getTime()
            return eventDate - now <= 7 * 24 * 60 * 60 * 1000 && eventDate > now
          }).length,
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
  }, [searchQuery, selectedCategory, userLocation, searchRadius])

  // Location handling functions
  const handleGetCurrentLocation = useCallback(async () => {
    try {
      setShowLocationPrompt(false)
      await getCurrentLocation()
      setCurrentLocationName("Your Current Location")
      logger.info("Current location obtained for party search", {
        component: "PartyPage",
        action: "getCurrentLocation",
      })
    } catch (error) {
      logger.error("Failed to get current location", {
        component: "PartyPage",
        action: "getCurrentLocation",
        error: error instanceof Error ? error.message : String(error),
      })
      setError("Unable to get your current location. Please try searching for a location manually.")
    }
  }, [getCurrentLocation])

  const handleLocationSearch = useCallback(async () => {
    if (!locationQuery.trim()) return

    try {
      setShowLocationPrompt(false)
      await searchLocation(locationQuery)
      setCurrentLocationName(locationQuery)
      logger.info("Location search completed for party search", {
        component: "PartyPage",
        action: "searchLocation",
        query: locationQuery,
      })
    } catch (error) {
      logger.error("Failed to search location", {
        component: "PartyPage",
        action: "searchLocation",
        error: error instanceof Error ? error.message : String(error),
      })
      setError("Unable to find that location. Please try a different search term.")
    }
  }, [locationQuery, searchLocation])

  const handleSkipLocation = useCallback(() => {
    setShowLocationPrompt(false)
    setCurrentLocationName("All Locations")
    logger.info("User skipped location for party search", {
      component: "PartyPage",
      action: "skipLocation",
    })
  }, [])

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

    // Sort events with enhanced date prioritization
    filtered.sort((a, b) => {
      const now = Date.now()
      const aDate = new Date(a.date).getTime()
      const bDate = new Date(b.date).getTime()

      switch (sortBy) {
        case "date":
          // Enhanced date sorting: prioritize upcoming events (next 7 days), then chronological
          const aIsUpcoming = aDate - now <= 7 * 24 * 60 * 60 * 1000 && aDate > now
          const bIsUpcoming = bDate - now <= 7 * 24 * 60 * 60 * 1000 && bDate > now

          if (aIsUpcoming && !bIsUpcoming) return -1
          if (!aIsUpcoming && bIsUpcoming) return 1

          // Both upcoming or both not upcoming - sort chronologically
          return aDate - bDate

        case "popularity":
          // Sort by relevance score, but prioritize upcoming events
          const aIsUpcomingPop = aDate - now <= 7 * 24 * 60 * 60 * 1000 && aDate > now
          const bIsUpcomingPop = bDate - now <= 7 * 24 * 60 * 60 * 1000 && bDate > now

          if (aIsUpcomingPop && !bIsUpcomingPop) return -1
          if (!aIsUpcomingPop && bIsUpcomingPop) return 1

          const aRelevance = getPartyRelevanceScore(a)
          const bRelevance = getPartyRelevanceScore(b)
          return bRelevance - aRelevance

        case "price":
          const priceA = extractPrice(a.price)
          const priceB = extractPrice(b.price)
          return priceA - priceB

        case "alphabetical":
          return a.title.localeCompare(b.title)

        case "distance":
          // Sort by distance if user location is available, but prioritize upcoming events
          if (userLocation && a.coordinates && b.coordinates) {
            const aIsUpcomingDist = aDate - now <= 7 * 24 * 60 * 60 * 1000 && aDate > now
            const bIsUpcomingDist = bDate - now <= 7 * 24 * 60 * 60 * 1000 && bDate > now

            if (aIsUpcomingDist && !bIsUpcomingDist) return -1
            if (!aIsUpcomingDist && bIsUpcomingDist) return 1

            const distanceA = calculateDistance(userLocation.lat, userLocation.lng, a.coordinates.lat, a.coordinates.lng)
            const distanceB = calculateDistance(userLocation.lat, userLocation.lng, b.coordinates.lat, b.coordinates.lng)
            return distanceA - distanceB
          }
          return 0

        case "relevance":
          // Sort by relevance, but prioritize upcoming events
          const aIsUpcomingRel = aDate - now <= 7 * 24 * 60 * 60 * 1000 && aDate > now
          const bIsUpcomingRel = bDate - now <= 7 * 24 * 60 * 60 * 1000 && bDate > now

          if (aIsUpcomingRel && !bIsUpcomingRel) return -1
          if (!aIsUpcomingRel && bIsUpcomingRel) return 1

          const aRel = getPartyRelevanceScore(a)
          const bRel = getPartyRelevanceScore(b)
          return bRel - aRel

        default:
          // Default: prioritize upcoming events, then by date
          const aIsUpcomingDefault = aDate - now <= 7 * 24 * 60 * 60 * 1000 && aDate > now
          const bIsUpcomingDefault = bDate - now <= 7 * 24 * 60 * 60 * 1000 && bDate > now

          if (aIsUpcomingDefault && !bIsUpcomingDefault) return -1
          if (!aIsUpcomingDefault && bIsUpcomingDefault) return 1

          return aDate - bDate
      }
    })

    return filtered
  }, [events, selectedCategory, searchQuery, priceRange, dateFilter, sortBy, userLocation])

  // Update filtered events and reset pagination when filters change
  useEffect(() => {
    setFilteredEvents(filterEvents)
    setCurrentPage(1)
  }, [filterEvents])

  // Load events when location changes or on mount (but only if location prompt is dismissed)
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

  // Reload events when category or radius changes to ensure location filtering is applied
  useEffect(() => {
    if (!showLocationPrompt && userLocation) {
      logger.info("Category or radius changed, reloading events with location", {
        component: "PartyPage",
        category: selectedCategory,
        radius: searchRadius,
        location: { lat: userLocation.lat, lng: userLocation.lng },
      })
      loadPartyEvents()
    }
  }, [selectedCategory, searchRadius, userLocation, showLocationPrompt, loadPartyEvents])

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
    setSortBy("date") // Default to soonest first
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

                  <Button
                    onClick={handleSkipLocation}
                    variant="ghost"
                    className="text-gray-400 hover:text-white"
                  >
                    Skip - Show All Parties
                  </Button>

                  {locationError && (
                    <div className="text-red-400 text-sm mt-2">
                      {locationError}
                    </div>
                  )}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Current Location Display */}
        {!showLocationPrompt && currentLocationName && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-7xl mx-auto px-4 py-2"
          >
            <div className="flex items-center justify-between bg-gray-800/50 rounded-lg px-4 py-2 border border-gray-700">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-300">
                  Showing parties near: <span className="text-white font-medium">{currentLocationName}</span>
                </span>
                {userLocation && (
                  <span className="text-xs text-gray-500">
                    (within {searchRadius} miles)
                  </span>
                )}
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
                <p className="text-gray-400">
                  {userLocation
                    ? `Finding parties near ${currentLocationName}...`
                    : "Finding the best party events..."
                  }
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {apiStatus === "loading" ? "Searching live APIs..." : "Processing results..."}
                </p>
                {userLocation && (
                  <p className="text-xs text-gray-600 mt-1">
                    Searching within {searchRadius} miles of your location
                  </p>
                )}
                <div className="mt-4 text-xs text-gray-600">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    <span>Ticketmaster</span>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-100"></div>
                    <span>RapidAPI</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-200"></div>
                    <span>Multiple Sources</span>
                  </div>
                  <div className="text-xs text-gray-700">
                    Enhanced search: 5 parallel queries • 60+ party keywords • Quality filtering
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
                      {(() => {
                        const upcomingCount = events.filter(e => {
                          const eventDate = new Date(e.date).getTime()
                          const now = Date.now()
                          return eventDate - now <= 7 * 24 * 60 * 60 * 1000 && eventDate > now
                        }).length

                        if (apiStatus === "success") {
                          return `Live Party Events • ${searchStats.successful} sources • ${events.length} events found${userLocation ? ` near ${currentLocationName}` : ""} • ${upcomingCount} happening soon`
                        } else if (apiStatus === "partial") {
                          return `Partial Results • ${searchStats.successful}/${searchStats.total} sources • ${events.length} events${userLocation ? ` near ${currentLocationName}` : ""} • ${upcomingCount} happening soon`
                        } else {
                          return `API Error • Using sample party events`
                        }
                      })()}
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
                                  <SelectItem value="relevance">Party Relevance</SelectItem>
                                  {userLocation && <SelectItem value="distance">Nearest First</SelectItem>}
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
                        {paginatedEvents.map((event, i) => {
                          // Calculate distance if user location is available
                          let distance: number | null = null
                          if (userLocation && event.coordinates) {
                            distance = calculateDistance(
                              userLocation.lat,
                              userLocation.lng,
                              event.coordinates.lat,
                              event.coordinates.lng
                            )
                          }

                          // Check if event is happening soon (within next 7 days)
                          const eventDate = new Date(event.date).getTime()
                          const now = Date.now()
                          const isUpcoming = eventDate - now <= 7 * 24 * 60 * 60 * 1000 && eventDate > now
                          const isToday = new Date(event.date).toDateString() === new Date().toDateString()
                          const isTomorrow = new Date(event.date).toDateString() === new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString()

                          return (
                            <motion.div
                              key={event.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.05 * i, duration: 0.4 }}
                              whileHover={{ y: -5 }}
                            >
                              <div className="relative">
                                <EventCard
                                  event={event}
                                  onViewDetails={() => handleViewEventDetails(event)}
                                  onToggleFavorite={() => handleToggleFavorite(event.id)}
                                  index={i}
                                />

                                {/* Upcoming event badge */}
                                {isToday && (
                                  <div className="absolute top-2 left-2 bg-red-600/90 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm border border-red-400/30 animate-pulse">
                                    <span className="font-semibold">TODAY</span>
                                  </div>
                                )}
                                {isTomorrow && !isToday && (
                                  <div className="absolute top-2 left-2 bg-orange-600/90 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm border border-orange-400/30">
                                    <span className="font-semibold">TOMORROW</span>
                                  </div>
                                )}
                                {isUpcoming && !isToday && !isTomorrow && (
                                  <div className="absolute top-2 left-2 bg-green-600/90 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm border border-green-400/30">
                                    <span className="font-semibold">SOON</span>
                                  </div>
                                )}

                                {/* Distance badge */}
                                {distance !== null && (
                                  <div className={`absolute top-2 right-2 bg-purple-600/90 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm border border-purple-400/30 ${isUpcoming ? 'top-12' : ''}`}>
                                    <MapPin className="w-3 h-3 inline mr-1" />
                                    {distance < 1 ? "< 1 mi" : `${distance.toFixed(1)} mi`}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )
                        })}
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
  return events.map((event) => {
    const enhancedCategory = mapToPartyCategory(event.category, event.title, event.description)

    // Enhanced image handling - ensure events have good images
    let enhancedImages = event.images || []
    let primaryImage = event.image || event.thumbnail

    // If no primary image, try to get from different sources
    if (!primaryImage) {
      const possibleImages = [
        event.poster,
        event.banner,
        event.photo,
        event.picture,
      ].filter(Boolean)

      primaryImage = possibleImages[0] || getPartyImage(enhancedCategory)
    }

    // If no images array, create one from available sources
    if (enhancedImages.length === 0) {
      const allImages = [
        primaryImage,
        event.poster,
        event.banner,
        event.photo,
        event.picture,
      ].filter(Boolean)

      enhancedImages = [...new Set(allImages)].slice(0, 3) // Remove duplicates and limit to 3
    }

    return {
      ...event,
      category: enhancedCategory,
      image: primaryImage,
      images: enhancedImages,
      thumbnail: primaryImage,
      // Enhance party-specific attributes
      tags: [...(event.tags || []), "party", "social", "entertainment"],
    }
  })
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
