"use client"

import { useState, useEffect, useCallback } from "react"

interface SearchSuggestion {
  text: string
  type: "history" | "popular" | "trending" | "ai"
}

interface UseSmartSearchParams {
  initialQuery?: string
  debounceMs?: number
  maxSuggestions?: number
  enableHistory?: boolean
  enableAI?: boolean
}

interface UseSmartSearchResult {
  query: string
  setQuery: (query: string) => void
  suggestions: SearchSuggestion[]
  isLoading: boolean
  error: string | null
  search: (query?: string) => void
  clearHistory: () => void
}

export function useSmartSearch({
  initialQuery = "",
  debounceMs = 300,
  maxSuggestions = 5,
  enableHistory = true,
  enableAI = true,
}: UseSmartSearchParams = {}): UseSmartSearchResult {
  const [query, setQuery] = useState(initialQuery)
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchHistory, setSearchHistory] = useState<string[]>([])

  // Debounce query changes
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query)
    }, debounceMs)

    return () => {
      clearTimeout(handler)
    }
  }, [query, debounceMs])

  // Load search history from localStorage
  useEffect(() => {
    if (enableHistory) {
      try {
        const storedHistory = localStorage.getItem("searchHistory")
        if (storedHistory) {
          setSearchHistory(JSON.parse(storedHistory))
        }
      } catch (err) {
        console.error("Failed to load search history:", err)
      }
    }
  }, [enableHistory])

  // Generate suggestions based on query
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setSuggestions([])
      return
    }

    const generateSuggestions = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Start with history matches
        let newSuggestions: SearchSuggestion[] = []

        if (enableHistory) {
          const historyMatches = searchHistory
            .filter((item) => item.toLowerCase().includes(debouncedQuery.toLowerCase()))
            .slice(0, 2)
            .map((text) => ({ text, type: "history" as const }))

          newSuggestions = [...newSuggestions, ...historyMatches]
        }

        // Add popular/trending suggestions
        // This would normally be an API call, but we'll simulate it
        const popularSuggestions = [
          `${debouncedQuery} events`,
          `${debouncedQuery} near me`,
          `best ${debouncedQuery}`,
        ].map((text) => ({ text, type: "popular" as const }))

        newSuggestions = [...newSuggestions, ...popularSuggestions]

        // Add AI-generated suggestions if enabled
        if (enableAI) {
          // This would normally be an API call to an AI service
          // For now, we'll just simulate it
          const aiSuggestions = [`${debouncedQuery} this weekend`, `${debouncedQuery} for families`].map((text) => ({
            text,
            type: "ai" as const,
          }))

          newSuggestions = [...newSuggestions, ...aiSuggestions]
        }

        setSuggestions(newSuggestions.slice(0, maxSuggestions))
      } catch (err) {
        setError("Failed to generate suggestions")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    generateSuggestions()
  }, [debouncedQuery, enableHistory, enableAI, maxSuggestions, searchHistory])

  // Perform search and update history
  const search = useCallback(
    (searchQuery?: string) => {
      const finalQuery = searchQuery || query

      if (!finalQuery) return

      // Update search history
      if (enableHistory) {
        const newHistory = [finalQuery, ...searchHistory.filter((item) => item !== finalQuery)].slice(0, 10) // Keep only the 10 most recent

        setSearchHistory(newHistory)

        try {
          localStorage.setItem("searchHistory", JSON.stringify(newHistory))
        } catch (err) {
          console.error("Failed to save search history:", err)
        }
      }

      // Here you would typically trigger the actual search
      // For now, we'll just log it
      console.log("Searching for:", finalQuery)
    },
    [query, searchHistory, enableHistory],
  )

  // Clear search history
  const clearHistory = useCallback(() => {
    setSearchHistory([])
    try {
      localStorage.removeItem("searchHistory")
    } catch (err) {
      console.error("Failed to clear search history:", err)
    }
  }, [])

  return {
    query,
    setQuery,
    suggestions,
    isLoading,
    error,
    search,
    clearHistory,
  }
}
