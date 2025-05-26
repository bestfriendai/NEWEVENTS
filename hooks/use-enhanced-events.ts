"use client"

/**
 * Enhanced Events Hook
 * Provides optimized event fetching with caching and state management
 */

import { useState, useEffect, useCallback, useRef } from "react"
import { useDebounce } from "./use-debounce"
import { logger } from "@/lib/utils/logger"
import type { EventDetailProps } from "@/components/event-detail-modal"
import type { EventSearchParams } from "@/types"

export interface UseEnhancedEventsOptions {
  initialParams?: EventSearchParams
  autoFetch?: boolean
  cacheTime?: number
  staleTime?: number
  refetchOnWindowFocus?: boolean
}

export interface UseEnhancedEventsResult {
  events: EventDetailProps[]
  totalCount: number
  isLoading: boolean
  isError: boolean
  error: string | null
  hasMore: boolean
  page: number
  source: string | null
  performance: {
    totalTime: number
    apiCalls: number
    cacheHits: number
  } | null

  // Actions
  searchEvents: (params: EventSearchParams) => Promise<void>
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  clearEvents: () => void

  // State setters
  setSearchParams: (params: EventSearchParams) => void
}

export function useEnhancedEvents(options: UseEnhancedEventsOptions = {}): UseEnhancedEventsResult {
  const {
    initialParams = {},
    autoFetch = true,
    cacheTime = 300000, // 5 minutes
    staleTime = 60000, // 1 minute
    refetchOnWindowFocus = false,
  } = options

  // State
  const [events, setEvents] = useState<EventDetailProps[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(0)
  const [source, setSource] = useState<string | null>(null)
  const [performance, setPerformance] = useState<{
    totalTime: number
    apiCalls: number
    cacheHits: number
  } | null>(null)
  const [searchParams, setSearchParams] = useState<EventSearchParams>(initialParams)

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null)
  const cacheRef = useRef<Map<string, { data: any; timestamp: number }>>(new Map())
  const lastFetchRef = useRef<number>(0)

  // Debounced search params
  const debouncedSearchParams = useDebounce(searchParams, 300)

  /**
   * Create cache key for search parameters
   */
  const createCacheKey = useCallback((params: EventSearchParams): string => {
    return JSON.stringify({
      ...params,
      page: params.page || 0,
    })
  }, [])

  /**
   * Get cached data if available and not stale
   */
  const getCachedData = useCallback(
    (key: string) => {
      const cached = cacheRef.current.get(key)
      if (!cached) return null

      const isStale = Date.now() - cached.timestamp > staleTime
      const isExpired = Date.now() - cached.timestamp > cacheTime

      if (isExpired) {
        cacheRef.current.delete(key)
        return null
      }

      return { data: cached.data, isStale }
    },
    [cacheTime, staleTime],
  )

  /**
   * Set cached data
   */
  const setCachedData = useCallback((key: string, data: any) => {
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now(),
    })

    // Clean up old cache entries
    if (cacheRef.current.size > 50) {
      const entries = Array.from(cacheRef.current.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)

      // Remove oldest 10 entries
      for (let i = 0; i < 10; i++) {
        cacheRef.current.delete(entries[i][0])
      }
    }
  }, [])

  /**
   * Fetch events from API
   */
  const fetchEvents = useCallback(
    async (params: EventSearchParams, isLoadMore = false): Promise<void> => {
      try {
        // Cancel previous request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }

        // Create new abort controller
        abortControllerRef.current = new AbortController()

        const fetchParams = {
          ...params,
          page: isLoadMore ? (params.page || 0) + 1 : params.page || 0,
        }

        const cacheKey = createCacheKey(fetchParams)

        // Check cache first
        const cached = getCachedData(cacheKey)
        if (cached && !cached.isStale) {
          logger.debug("Using cached events data", {
            component: "useEnhancedEvents",
            action: "cache_hit",
            metadata: { cacheKey },
          })

          const cachedResult = cached.data

          if (isLoadMore) {
            setEvents((prev) => [...prev, ...cachedResult.events])
          } else {
            setEvents(cachedResult.events)
          }

          setTotalCount(cachedResult.totalCount)
          setHasMore(cachedResult.hasMore || false)
          setPage(cachedResult.page || 0)
          setSource(cachedResult.source || null)
          setPerformance(cachedResult.performance || null)
          setIsError(false)
          setError(null)

          return
        }

        setIsLoading(true)
        setIsError(false)
        setError(null)

        logger.info("Fetching events", {
          component: "useEnhancedEvents",
          action: "fetch_start",
          metadata: { params: fetchParams, isLoadMore },
        })

        const startTime = performance.now()
        lastFetchRef.current = startTime

        // Make API request
        const response = await fetch("/api/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(fetchParams),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`)
        }

        const result = await response.json()

        // Check if this is still the latest request
        if (startTime !== lastFetchRef.current) {
          logger.debug("Ignoring stale request", {
            component: "useEnhancedEvents",
            action: "stale_request",
          })
          return
        }

        // Cache the result
        setCachedData(cacheKey, result)

        // Update state
        if (isLoadMore) {
          setEvents((prev) => [...prev, ...result.events])
        } else {
          setEvents(result.events)
        }

        setTotalCount(result.totalCount)
        setHasMore(result.hasMore || false)
        setPage(result.page || 0)
        setSource(result.source || null)
        setPerformance(result.performance || null)

        logger.info("Events fetched successfully", {
          component: "useEnhancedEvents",
          action: "fetch_success",
          metadata: {
            eventCount: result.events.length,
            totalCount: result.totalCount,
            source: result.source,
            isLoadMore,
          },
        })
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          logger.debug("Request aborted", {
            component: "useEnhancedEvents",
            action: "request_aborted",
          })
          return
        }

        logger.error(
          "Error fetching events",
          {
            component: "useEnhancedEvents",
            action: "fetch_error",
            metadata: { params, isLoadMore },
          },
          error instanceof Error ? error : new Error(String(error)),
        )

        setIsError(true)
        setError(error instanceof Error ? error.message : "Failed to fetch events")
      } finally {
        setIsLoading(false)
      }
    },
    [createCacheKey, getCachedData, setCachedData],
  )

  /**
   * Search events with new parameters
   */
  const searchEvents = useCallback(
    async (params: EventSearchParams): Promise<void> => {
      setSearchParams(params)
      setPage(0)
      await fetchEvents(params, false)
    },
    [fetchEvents],
  )

  /**
   * Load more events (pagination)
   */
  const loadMore = useCallback(async (): Promise<void> => {
    if (!hasMore || isLoading) return

    await fetchEvents(searchParams, true)
  }, [fetchEvents, searchParams, hasMore, isLoading])

  /**
   * Refresh current search
   */
  const refresh = useCallback(async (): Promise<void> => {
    // Clear cache for current search
    const cacheKey = createCacheKey(searchParams)
    cacheRef.current.delete(cacheKey)

    await fetchEvents(searchParams, false)
  }, [fetchEvents, searchParams, createCacheKey])

  /**
   * Clear events and reset state
   */
  const clearEvents = useCallback((): void => {
    setEvents([])
    setTotalCount(0)
    setHasMore(false)
    setPage(0)
    setSource(null)
    setPerformance(null)
    setIsError(false)
    setError(null)
  }, [])

  // Auto-fetch on debounced search params change
  useEffect(() => {
    if (autoFetch && Object.keys(debouncedSearchParams).length > 0) {
      fetchEvents(debouncedSearchParams, false)
    }
  }, [debouncedSearchParams, autoFetch, fetchEvents])

  // Window focus refetch
  useEffect(() => {
    if (!refetchOnWindowFocus) return

    const handleFocus = () => {
      if (events.length > 0) {
        refresh()
      }
    }

    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [refetchOnWindowFocus, events.length, refresh])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    events,
    totalCount,
    isLoading,
    isError,
    error,
    hasMore,
    page,
    source,
    performance,
    searchEvents,
    loadMore,
    refresh,
    clearEvents,
    setSearchParams,
  }
}
