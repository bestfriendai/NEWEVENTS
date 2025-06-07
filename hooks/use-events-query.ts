"use client"

/**
 * Enhanced Events Query Hook using TanStack Query
 * Provides optimized data fetching, caching, and infinite scroll
 */

import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect, useCallback } from "react"
import { logger } from "@/lib/utils/logger"
import type { EventDetailProps } from "@/components/event-detail-modal"
import { fetchEvents } from "@/app/actions/event-actions"

interface EventsQueryParams {
  lat?: number
  lng?: number
  radius?: number
  category?: string
  query?: string
  startDate?: string
  endDate?: string
}

interface EventsResponse {
  events: EventDetailProps[]
  totalCount: number
  hasMore: boolean
  nextCursor?: string
  sources?: {
    rapidapi: number
    ticketmaster: number
    cached: number
  }
}

interface UseEventsQueryOptions {
  enabled?: boolean
  staleTime?: number
  cacheTime?: number
  refetchOnWindowFocus?: boolean
}

// Query keys factory for better cache management
export const eventsQueryKeys = {
  all: ["events"] as const,
  lists: () => [...eventsQueryKeys.all, "list"] as const,
  list: (params: EventsQueryParams) => [...eventsQueryKeys.lists(), params] as const,
  infinite: (params: EventsQueryParams) => [...eventsQueryKeys.all, "infinite", params] as const,
  detail: (id: number) => [...eventsQueryKeys.all, "detail", id] as const,
  popular: () => [...eventsQueryKeys.all, "popular"] as const,
  trending: () => [...eventsQueryKeys.all, "trending"] as const,
  analytics: (eventId: number) => [...eventsQueryKeys.all, "analytics", eventId] as const,
}

// Fetch events function
async function fetchEventsOld(params: EventsQueryParams & { pageParam?: number }): Promise<EventsResponse> {
  const { pageParam = 0, ...searchParams } = params

  const queryParams = new URLSearchParams({
    limit: "24",
    offset: (pageParam * 24).toString(),
    ...Object.fromEntries(Object.entries(searchParams).filter(([_, value]) => value !== undefined && value !== null)),
  })

  logger.info("Fetching events with params:", { params: searchParams, page: pageParam })

  // Try Supabase Edge Function first for better performance
  try {
    const edgeResponse = await fetch(`/api/supabase/functions/events-search?${queryParams}`)
    if (edgeResponse.ok) {
      const data = await edgeResponse.json()
      if (data.success) {
        return {
          events: data.data.events,
          totalCount: data.data.totalCount,
          hasMore: data.data.hasMore,
          nextCursor: data.data.hasMore ? (pageParam + 1).toString() : undefined,
          sources: data.data.sources,
        }
      }
    }
  } catch (error) {
    logger.warn("Edge function failed, falling back to API route:", error)
  }

  // Fallback to regular API route
  const response = await fetch(`/api/events/enhanced?${queryParams}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.status}`)
  }

  const data = await response.json()
  if (!data.success) {
    throw new Error(data.error || "Failed to fetch events")
  }

  return {
    events: data.data.events,
    totalCount: data.data.totalCount,
    hasMore: data.data.hasMore,
    nextCursor: data.data.hasMore ? (pageParam + 1).toString() : undefined,
    sources: data.data.sources,
  }
}

// Main hook for paginated events
export function useEventsQuery(params: EventsQueryParams, options: UseEventsQueryOptions = {}) {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus = false,
  } = options

  return useQuery({
    queryKey: eventsQueryKeys.list(params),
    queryFn: () => fetchEventsOld(params),
    enabled,
    staleTime,
    cacheTime,
    refetchOnWindowFocus,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

// Hook for infinite scroll events
export function useInfiniteEventsQuery(params: EventsQueryParams, options: UseEventsQueryOptions = {}) {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000,
    cacheTime = 10 * 60 * 1000,
    refetchOnWindowFocus = false,
  } = options

  return useInfiniteQuery({
    queryKey: eventsQueryKeys.infinite(params),
    queryFn: ({ pageParam = 0 }) => fetchEventsOld({ ...params, pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length : undefined
    },
    enabled,
    staleTime,
    cacheTime,
    refetchOnWindowFocus,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

// Hook for popular events
export function usePopularEventsQuery(options: UseEventsQueryOptions = {}) {
  const {
    enabled = true,
    staleTime = 10 * 60 * 1000, // 10 minutes for popular events
    cacheTime = 30 * 60 * 1000, // 30 minutes cache
  } = options

  return useQuery({
    queryKey: eventsQueryKeys.popular(),
    queryFn: async () => {
      const response = await fetch("/api/supabase/functions/event-analytics?type=popular")
      if (!response.ok) {
        throw new Error("Failed to fetch popular events")
      }
      const data = await response.json()
      return data.data
    },
    enabled,
    staleTime,
    cacheTime,
    retry: 2,
  })
}

// Hook for trending events
export function useTrendingEventsQuery(options: UseEventsQueryOptions = {}) {
  const {
    enabled = true,
    staleTime = 2 * 60 * 1000, // 2 minutes for trending
    cacheTime = 5 * 60 * 1000, // 5 minutes cache
  } = options

  return useQuery({
    queryKey: eventsQueryKeys.trending(),
    queryFn: async () => {
      const response = await fetch("/api/supabase/functions/event-analytics?type=trending")
      if (!response.ok) {
        throw new Error("Failed to fetch trending events")
      }
      const data = await response.json()
      return data.data
    },
    enabled,
    staleTime,
    cacheTime,
    retry: 2,
  })
}

// Hook for event analytics tracking
export function useEventAnalytics() {
  const queryClient = useQueryClient()

  const trackEvent = useMutation({
    mutationFn: async ({
      type,
      eventId,
      userId,
      metadata,
    }: {
      type: "view" | "click" | "favorite" | "unfavorite"
      eventId: number
      userId?: string
      metadata?: Record<string, any>
    }) => {
      const response = await fetch("/api/supabase/functions/event-analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, eventId, userId, metadata }),
      })

      if (!response.ok) {
        throw new Error("Failed to track event")
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: eventsQueryKeys.analytics(variables.eventId) })

      if (variables.type === "favorite" || variables.type === "unfavorite") {
        queryClient.invalidateQueries({ queryKey: eventsQueryKeys.popular() })
      }

      if (variables.type === "view" || variables.type === "click") {
        queryClient.invalidateQueries({ queryKey: eventsQueryKeys.trending() })
      }
    },
  })

  return {
    trackEvent: trackEvent.mutate,
    trackEventAsync: trackEvent.mutateAsync,
    isTracking: trackEvent.isPending,
    trackingError: trackEvent.error,
  }
}

interface UseEventsQueryParams {
  lat?: number
  lng?: number
  radius?: number
  category?: string
  query?: string
  startDate?: string
  endDate?: string
  sort?: string
  page?: number
  pageSize?: number
}

interface UseEventsQueryResult {
  events: EventDetailProps[]
  isLoading: boolean
  error: string | null
  totalCount: number
  totalPages: number
  page: number
  setPage: (page: number) => void
  refetch: () => Promise<void>
}

// Optimized hook that combines multiple data sources
export function useOptimizedEventsPage(params: UseEventsQueryParams): UseEventsQueryResult {
  const [events, setEvents] = useState<EventDetailProps[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(params.page || 0)

  const fetchData = useCallback(async () => {
    if (!params.lat || !params.lng) {
      setError("Location is required")
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await fetchEvents({
        coordinates: {
          lat: params.lat,
          lng: params.lng,
          name: "Current Location",
        },
        radius: params.radius || 25,
        categories: params.category ? [params.category] : undefined,
        keyword: params.query,
        page,
        size: params.pageSize || 12,
        sort: params.sort || "date",
      })

      if (result.error) {
        setError(result.error.message)
      } else {
        // Add coordinates to events for map display
        const eventsWithCoords = result.events.map((event) => ({
          ...event,
          coordinates: event.coordinates || {
            lat: params.lat! + (Math.random() - 0.5) * 0.1,
            lng: params.lng! + (Math.random() - 0.5) * 0.1,
          },
        }))

        setEvents(eventsWithCoords)
        setTotalCount(result.totalCount)
        setTotalPages(result.totalPages)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events")
    } finally {
      setIsLoading(false)
    }
  }, [params, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    events,
    isLoading,
    error,
    totalCount,
    totalPages,
    page,
    setPage,
    refetch: fetchData,
  }
}
