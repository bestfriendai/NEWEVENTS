import { useState, useEffect, useCallback } from "react"
import { logger } from "@/lib/utils/logger"
import type { Event, EventSearchParams } from "@/types/event.types"

interface UseRealEventsResult {
  events: Event[]
  featuredEvents: Event[]
  partyEvents: Event[]
  isLoading: boolean
  isFeaturedLoading: boolean
  isPartyLoading: boolean
  error: string | null
  totalCount: number
  hasMore: boolean
  searchEvents: (params: EventSearchParams) => Promise<void>
  loadFeaturedEvents: (location?: string, limit?: number) => Promise<void>
  loadPartyEvents: (location?: string, limit?: number) => Promise<void>
  refreshEvents: () => Promise<void>
}

export function useRealEvents(initialParams?: EventSearchParams): UseRealEventsResult {
  const [events, setEvents] = useState<Event[]>([])
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([])
  const [partyEvents, setPartyEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFeaturedLoading, setIsFeaturedLoading] = useState(true)
  const [isPartyLoading, setIsPartyLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  const searchEvents = useCallback(async (params: EventSearchParams) => {
    try {
      setIsLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          if (Array.isArray(value)) {
            searchParams.set(key, value.join(","))
          } else {
            searchParams.set(key, String(value))
          }
        }
      })

      logger.info("Searching events", {
        component: "useRealEvents",
        action: "searchEvents",
        metadata: { params }
      })

      const response = await fetch(`/api/events/real?${searchParams.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch events")
      }

      setEvents(data.data || [])
      setTotalCount(data.totalCount || 0)
      setHasMore(data.hasMore || false)

      logger.info(`Successfully loaded ${data.data?.length || 0} events`, {
        component: "useRealEvents",
        action: "searchEvents",
        metadata: { count: data.data?.length, totalCount: data.totalCount }
      })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load events"
      setError(errorMessage)
      setEvents([])
      setTotalCount(0)
      setHasMore(false)
      
      logger.error("Error searching events", {
        component: "useRealEvents",
        action: "searchEvents",
        error: errorMessage
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadFeaturedEvents = useCallback(async (location = "United States", limit = 20) => {
    try {
      setIsFeaturedLoading(true)

      const response = await fetch(`/api/events/featured?location=${encodeURIComponent(location)}&limit=${limit}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch featured events: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch featured events")
      }

      setFeaturedEvents(data.data || [])

      logger.info(`Successfully loaded ${data.data?.length || 0} featured events`, {
        component: "useRealEvents",
        action: "loadFeaturedEvents",
        metadata: { count: data.data?.length, location }
      })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load featured events"
      logger.error("Error loading featured events", {
        component: "useRealEvents",
        action: "loadFeaturedEvents",
        error: errorMessage
      })
      setFeaturedEvents([])
    } finally {
      setIsFeaturedLoading(false)
    }
  }, [])

  const loadPartyEvents = useCallback(async (location = "United States", limit = 50) => {
    try {
      setIsPartyLoading(true)

      const response = await fetch(`/api/events/party?location=${encodeURIComponent(location)}&limit=${limit}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch party events: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch party events")
      }

      setPartyEvents(data.data || [])

      logger.info(`Successfully loaded ${data.data?.length || 0} party events`, {
        component: "useRealEvents",
        action: "loadPartyEvents", 
        metadata: { count: data.data?.length, location }
      })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load party events"
      logger.error("Error loading party events", {
        component: "useRealEvents",
        action: "loadPartyEvents",
        error: errorMessage
      })
      setPartyEvents([])
    } finally {
      setIsPartyLoading(false)
    }
  }, [])

  const refreshEvents = useCallback(async () => {
    if (initialParams) {
      await searchEvents(initialParams)
    }
    await loadFeaturedEvents()
    await loadPartyEvents()
  }, [initialParams, searchEvents, loadFeaturedEvents, loadPartyEvents])

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      const defaultParams: EventSearchParams = {
        location: "United States",
        limit: 20,
        sortBy: "date",
        ...initialParams
      }

      await Promise.all([
        searchEvents(defaultParams),
        loadFeaturedEvents(),
        loadPartyEvents()
      ])
    }

    loadInitialData()
  }, []) // Only run once on mount

  return {
    events,
    featuredEvents,
    partyEvents,
    isLoading,
    isFeaturedLoading,
    isPartyLoading,
    error,
    totalCount,
    hasMore,
    searchEvents,
    loadFeaturedEvents,
    loadPartyEvents,
    refreshEvents
  }
}