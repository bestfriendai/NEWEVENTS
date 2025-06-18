"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { logger } from "@/lib/utils/logger"

interface SearchOptions {
  debounceMs?: number
  minLength?: number
  maxResults?: number
}

interface SearchState<T> {
  query: string
  results: T[]
  isLoading: boolean
  error: string | null
  hasSearched: boolean
}

export function useOptimizedSearch<T>(searchFn: (query: string) => Promise<T[]>, options: SearchOptions = {}) {
  const { debounceMs = 300, minLength = 2, maxResults = 50 } = options

  const [state, setState] = useState<SearchState<T>>({
    query: "",
    results: [],
    isLoading: false,
    error: null,
    hasSearched: false,
  })

  const debouncedQuery = useDebounce(state.query, debounceMs)
  const abortControllerRef = useRef<AbortController | null>(null)
  const cacheRef = useRef<Map<string, T[]>>(new Map())

  const search = useCallback(
    async (query: string) => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Check cache first
      const cached = cacheRef.current.get(query)
      if (cached) {
        setState((prev) => ({
          ...prev,
          results: cached.slice(0, maxResults),
          isLoading: false,
          error: null,
          hasSearched: true,
        }))
        return
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        abortControllerRef.current = new AbortController()

        const startTime = Date.now()
        const results = await searchFn(query)
        const endTime = Date.now()

        // Cache results
        cacheRef.current.set(query, results)

        // Limit cache size
        if (cacheRef.current.size > 100) {
          const firstKey = cacheRef.current.keys().next().value
          cacheRef.current.delete(firstKey)
        }

        setState((prev) => ({
          ...prev,
          results: results.slice(0, maxResults),
          isLoading: false,
          hasSearched: true,
        }))

        logger.info("Search completed", {
          component: "useOptimizedSearch",
          query,
          resultCount: results.length,
          duration: endTime - startTime,
        })
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return // Request was cancelled
        }

        const errorMessage = error instanceof Error ? error.message : "Search failed"
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
          hasSearched: true,
        }))

        logger.error("Search failed", {
          component: "useOptimizedSearch",
          query,
          error: errorMessage,
        })
      }
    },
    [searchFn, maxResults],
  )

  // Trigger search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length >= minLength) {
      search(debouncedQuery)
    } else if (debouncedQuery.length === 0) {
      setState((prev) => ({
        ...prev,
        results: [],
        hasSearched: false,
        error: null,
      }))
    }
  }, [debouncedQuery, minLength, search])

  const setQuery = useCallback((query: string) => {
    setState((prev) => ({ ...prev, query }))
  }, [])

  const clearResults = useCallback(() => {
    setState((prev) => ({
      ...prev,
      results: [],
      hasSearched: false,
      error: null,
    }))
  }, [])

  const clearCache = useCallback(() => {
    cacheRef.current.clear()
  }, [])

  return {
    ...state,
    setQuery,
    clearResults,
    clearCache,
    debouncedQuery,
  }
}
