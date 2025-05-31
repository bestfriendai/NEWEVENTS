"use client"

import { useState, useEffect, useMemo } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { fetchEvents, getFeaturedEvents } from "@/app/actions/event-actions"
import { advancedCache, cacheKeys, cacheTags } from "@/lib/cache/advanced-cache"
import { logger } from "@/lib/utils/logger"
import type { EventDetailProps } from "@/components/event-detail-modal"

interface UseEventsPageProps {
  userLocation: { lat: number; lng: number; name: string } | null
  hasLocation: boolean
}

interface EventFilters {
  categories?: string[]
  priceRange?: [number, number]
  dateRange?: string
  distance?: number
  showFeaturedOnly?: boolean
  showFreeOnly?: boolean
  availableTickets?: boolean
}

export function useEventsPage({ userLocation, hasLocation }: UseEventsPageProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [filters, setFilters] = useState<EventFilters>({})
  const [favoriteEvents, setFavoriteEvents] = useState<Set<number>>(new Set())

  // API state
  const [events, setEvents] = useState<EventDetailProps[]>([])
  const [featuredEvents, setFeaturedEvents] = useState<EventDetailProps[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFeaturedLoading, setIsFeaturedLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  const debouncedSearch = useDebounce(searchQuery, 300)

  // Fetch events when search parameters change
  useEffect(() => {
    if (!hasLocation || !userLocation) return

    const loadEvents = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const apiCategory = selectedCategory !== "all" ? [selectedCategory] : undefined

        // Create cache key for this search
        const cacheKey = cacheKeys.events.list({
          keyword: debouncedSearch,
          lat: userLocation.lat,
          lng: userLocation.lng,
          radius: filters.distance || 25,
          categories: apiCategory,
          page,
          size: 24,
          sort: sortBy,
        })

        // Try to get from cache first
        const cachedResult = advancedCache.get(cacheKey)
        if (cachedResult) {
          logger.info('Events loaded from cache', { cacheKey })
          setEvents(cachedResult.events)
          setTotalCount(cachedResult.totalCount)
          setTotalPages(cachedResult.totalPages)
          setIsLoading(false)
          return
        }

        const result = await fetchEvents({
          keyword: debouncedSearch || undefined,
          coordinates: userLocation,
          radius: filters.distance || 25,
          categories: apiCategory,
          page,
          size: 24, // Increased from 12 to 24 for more events per page
          sort: sortBy,
        })

        if (result.error) {
          setError(result.error.message)
        } else {
          // Cache the successful result
          advancedCache.set(
            cacheKey,
            {
              events: result.events,
              totalCount: result.totalCount,
              totalPages: result.totalPages,
            },
            5 * 60 * 1000, // 5 minutes cache
            [cacheTags.EVENTS, cacheTags.LOCATION_BASED]
          )

          setEvents(result.events)
          setTotalCount(result.totalCount)
          setTotalPages(result.totalPages)

          logger.info('Events loaded from API and cached', {
            cacheKey,
            eventsCount: result.events.length
          })
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load events"
        setError(errorMessage)
        logger.error('Failed to load events', { error: errorMessage })
      } finally {
        setIsLoading(false)
      }
    }

    loadEvents()
  }, [hasLocation, userLocation, debouncedSearch, selectedCategory, sortBy, page, filters])

  // Fetch featured events
  useEffect(() => {
    if (!hasLocation || !userLocation) return

    const loadFeaturedEvents = async () => {
      setIsFeaturedLoading(true)
      try {
        const featured = await getFeaturedEvents(6)
        setFeaturedEvents(featured.map((event) => ({ ...event, isFeatured: true })))
      } catch (err) {
        console.error("Failed to load featured events:", err)
      } finally {
        setIsFeaturedLoading(false)
      }
    }

    loadFeaturedEvents()
  }, [hasLocation, userLocation])

  // Filter events based on current filters
  const filteredEvents = useMemo(() => {
    let filtered = events

    // Apply filters
    if (filters.categories?.length > 0) {
      filtered = filtered.filter((event) => filters.categories!.includes(event.category?.toLowerCase()))
    }

    if (filters.showFeaturedOnly) {
      filtered = filtered.filter((event) => event.isFeatured)
    }

    if (filters.showFreeOnly) {
      filtered = filtered.filter((event) => event.price?.toLowerCase().includes("free") || event.price === "$0")
    }

    if (filters.priceRange) {
      filtered = filtered.filter((event) => {
        const price = Number.parseFloat(event.price?.replace(/[^0-9.]/g, "") || "0")
        return price >= filters.priceRange![0] && price <= filters.priceRange![1]
      })
    }

    return filtered
  }, [events, filters])

  const toggleFavorite = (eventId: number) => {
    setFavoriteEvents((prev) => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(eventId)) {
        newFavorites.delete(eventId)
      } else {
        newFavorites.add(eventId)
      }
      return newFavorites
    })
  }

  const shareEvent = (event: EventDetailProps) => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: window.location.href + `?event=${event.id}`,
      })
    } else {
      navigator.clipboard.writeText(window.location.href + `?event=${event.id}`)
    }
  }

  const resetFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
    setFilters({})
    setPage(0)
  }

  return {
    // Search and filters
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    filters,
    setFilters,

    // Events data
    events: filteredEvents,
    featuredEvents,
    isLoading,
    isFeaturedLoading,
    error,

    // Pagination
    page,
    setPage,
    totalPages,
    totalCount,

    // Favorites
    favoriteEvents,
    toggleFavorite,

    // Actions
    shareEvent,
    resetFilters,
  }
}
