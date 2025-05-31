"use client"

/**
 * Smart Search Hook with AI-like Features
 * Provides intelligent search with autocomplete, suggestions, and learning
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useDebounce } from '@/hooks/use-debounce'
import { advancedCache, cacheKeys, cacheTags } from '@/lib/cache/advanced-cache'
import { logger } from '@/lib/utils/logger'
import type { EventDetailProps } from '@/components/event-detail-modal'

interface SearchSuggestion {
  id: string
  text: string
  type: 'category' | 'location' | 'keyword' | 'recent' | 'popular'
  score: number
  metadata?: Record<string, any>
}

interface SearchHistory {
  query: string
  timestamp: number
  results: number
  clicked: boolean
}

interface SearchAnalytics {
  totalSearches: number
  popularQueries: Array<{ query: string; count: number }>
  averageResultsPerSearch: number
  clickThroughRate: number
}

interface UseSmartSearchOptions {
  minQueryLength?: number
  maxSuggestions?: number
  enableHistory?: boolean
  enableAnalytics?: boolean
  debounceMs?: number
}

export function useSmartSearch(options: UseSmartSearchOptions = {}) {
  const {
    minQueryLength = 2,
    maxSuggestions = 10,
    enableHistory = true,
    enableAnalytics = true,
    debounceMs = 300
  } = options

  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([])
  const [analytics, setAnalytics] = useState<SearchAnalytics>({
    totalSearches: 0,
    popularQueries: [],
    averageResultsPerSearch: 0,
    clickThroughRate: 0
  })

  const debouncedQuery = useDebounce(query, debounceMs)
  const searchSessionRef = useRef<string>('')
  const lastSearchRef = useRef<{ query: string; timestamp: number; results: number }>()

  // Predefined categories and keywords for suggestions
  const categories = useMemo(() => [
    'music', 'concerts', 'festivals', 'comedy', 'theater', 'sports',
    'food', 'art', 'business', 'conference', 'workshop', 'nightlife',
    'family', 'outdoor', 'fitness', 'education', 'technology', 'networking'
  ], [])

  const popularKeywords = useMemo(() => [
    'live music', 'food festival', 'comedy show', 'art exhibition',
    'business networking', 'outdoor concert', 'family fun', 'dance party',
    'wine tasting', 'tech meetup', 'fitness class', 'cooking class'
  ], [])

  // Load search history and analytics from cache
  useEffect(() => {
    if (enableHistory) {
      const cachedHistory = advancedCache.get<SearchHistory[]>(cacheKeys.user.preferences('search-history'))
      if (cachedHistory) {
        setSearchHistory(cachedHistory)
      }
    }

    if (enableAnalytics) {
      const cachedAnalytics = advancedCache.get<SearchAnalytics>(cacheKeys.user.preferences('search-analytics'))
      if (cachedAnalytics) {
        setAnalytics(cachedAnalytics)
      }
    }
  }, [enableHistory, enableAnalytics])

  // Generate suggestions based on query
  const generateSuggestions = useCallback(async (searchQuery: string): Promise<SearchSuggestion[]> => {
    if (searchQuery.length < minQueryLength) {
      return []
    }

    const suggestions: SearchSuggestion[] = []
    const queryLower = searchQuery.toLowerCase()

    // Category suggestions
    categories.forEach(category => {
      if (category.includes(queryLower)) {
        suggestions.push({
          id: `category-${category}`,
          text: category,
          type: 'category',
          score: category.startsWith(queryLower) ? 10 : 5
        })
      }
    })

    // Keyword suggestions
    popularKeywords.forEach(keyword => {
      if (keyword.includes(queryLower)) {
        suggestions.push({
          id: `keyword-${keyword}`,
          text: keyword,
          type: 'keyword',
          score: keyword.startsWith(queryLower) ? 8 : 4
        })
      }
    })

    // Recent search suggestions
    if (enableHistory) {
      const recentSearches = searchHistory
        .filter(h => h.query.toLowerCase().includes(queryLower))
        .slice(0, 3)
        .map(h => ({
          id: `recent-${h.query}`,
          text: h.query,
          type: 'recent' as const,
          score: h.clicked ? 7 : 3,
          metadata: { timestamp: h.timestamp, results: h.results }
        }))
      
      suggestions.push(...recentSearches)
    }

    // Popular queries from analytics
    if (enableAnalytics) {
      const popularSuggestions = analytics.popularQueries
        .filter(pq => pq.query.toLowerCase().includes(queryLower))
        .slice(0, 2)
        .map(pq => ({
          id: `popular-${pq.query}`,
          text: pq.query,
          type: 'popular' as const,
          score: 6,
          metadata: { count: pq.count }
        }))
      
      suggestions.push(...popularSuggestions)
    }

    // Try to get location-based suggestions from cache
    try {
      const locationSuggestions = await generateLocationSuggestions(queryLower)
      suggestions.push(...locationSuggestions)
    } catch (error) {
      logger.warn('Failed to generate location suggestions', { error })
    }

    // Sort by score and limit results
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSuggestions)
  }, [categories, popularKeywords, searchHistory, analytics, enableHistory, enableAnalytics, minQueryLength, maxSuggestions])

  // Generate location-based suggestions
  const generateLocationSuggestions = useCallback(async (queryLower: string): Promise<SearchSuggestion[]> => {
    const suggestions: SearchSuggestion[] = []

    // Common location patterns
    const locationPatterns = [
      'near me', 'downtown', 'city center', 'park', 'beach', 'mall',
      'university', 'stadium', 'theater district', 'arts district'
    ]

    locationPatterns.forEach(pattern => {
      if (pattern.includes(queryLower) || queryLower.includes(pattern)) {
        suggestions.push({
          id: `location-${pattern}`,
          text: `events ${pattern}`,
          type: 'location',
          score: 6
        })
      }
    })

    return suggestions
  }, [])

  // Update suggestions when query changes
  useEffect(() => {
    if (debouncedQuery.length >= minQueryLength) {
      setIsLoading(true)
      
      generateSuggestions(debouncedQuery)
        .then(newSuggestions => {
          setSuggestions(newSuggestions)
          setIsLoading(false)
        })
        .catch(error => {
          logger.error('Failed to generate suggestions', { error })
          setSuggestions([])
          setIsLoading(false)
        })
    } else {
      setSuggestions([])
      setIsLoading(false)
    }
  }, [debouncedQuery, generateSuggestions, minQueryLength])

  // Track search execution
  const executeSearch = useCallback((searchQuery: string, resultCount = 0) => {
    searchSessionRef.current = `${Date.now()}-${Math.random()}`
    lastSearchRef.current = {
      query: searchQuery,
      timestamp: Date.now(),
      results: resultCount
    }

    if (enableHistory) {
      const newHistoryItem: SearchHistory = {
        query: searchQuery,
        timestamp: Date.now(),
        results: resultCount,
        clicked: false
      }

      setSearchHistory(prev => {
        const updated = [newHistoryItem, ...prev.slice(0, 49)] // Keep last 50
        advancedCache.set(
          cacheKeys.user.preferences('search-history'),
          updated,
          24 * 60 * 60 * 1000, // 24 hours
          [cacheTags.USER_DATA]
        )
        return updated
      })
    }

    if (enableAnalytics) {
      setAnalytics(prev => {
        const updated = {
          ...prev,
          totalSearches: prev.totalSearches + 1,
          averageResultsPerSearch: (prev.averageResultsPerSearch * prev.totalSearches + resultCount) / (prev.totalSearches + 1)
        }

        // Update popular queries
        const existingQuery = updated.popularQueries.find(pq => pq.query === searchQuery)
        if (existingQuery) {
          existingQuery.count++
        } else {
          updated.popularQueries.push({ query: searchQuery, count: 1 })
        }

        // Sort and limit popular queries
        updated.popularQueries = updated.popularQueries
          .sort((a, b) => b.count - a.count)
          .slice(0, 20)

        advancedCache.set(
          cacheKeys.user.preferences('search-analytics'),
          updated,
          7 * 24 * 60 * 60 * 1000, // 7 days
          [cacheTags.USER_DATA, cacheTags.ANALYTICS]
        )

        return updated
      })
    }

    logger.info('Search executed', { query: searchQuery, resultCount, session: searchSessionRef.current })
  }, [enableHistory, enableAnalytics])

  // Track search result click
  const trackSearchClick = useCallback((eventId: number, position: number) => {
    if (lastSearchRef.current && enableHistory) {
      // Update search history to mark as clicked
      setSearchHistory(prev => {
        const updated = prev.map(h => 
          h.query === lastSearchRef.current?.query && 
          Math.abs(h.timestamp - lastSearchRef.current.timestamp) < 1000
            ? { ...h, clicked: true }
            : h
        )
        
        advancedCache.set(
          cacheKeys.user.preferences('search-history'),
          updated,
          24 * 60 * 60 * 1000,
          [cacheTags.USER_DATA]
        )
        
        return updated
      })
    }

    if (enableAnalytics) {
      setAnalytics(prev => {
        const clickedSearches = searchHistory.filter(h => h.clicked).length
        const updated = {
          ...prev,
          clickThroughRate: prev.totalSearches > 0 ? (clickedSearches + 1) / prev.totalSearches : 1
        }

        advancedCache.set(
          cacheKeys.user.preferences('search-analytics'),
          updated,
          7 * 24 * 60 * 60 * 1000,
          [cacheTags.USER_DATA, cacheTags.ANALYTICS]
        )

        return updated
      })
    }

    logger.info('Search result clicked', { 
      eventId, 
      position, 
      query: lastSearchRef.current?.query,
      session: searchSessionRef.current 
    })
  }, [searchHistory, enableHistory, enableAnalytics])

  // Clear search history
  const clearHistory = useCallback(() => {
    setSearchHistory([])
    advancedCache.delete(cacheKeys.user.preferences('search-history'))
    logger.info('Search history cleared')
  }, [])

  // Get search insights
  const getSearchInsights = useCallback(() => {
    const recentSearches = searchHistory.slice(0, 5)
    const topCategories = categories.filter(cat => 
      searchHistory.some(h => h.query.toLowerCase().includes(cat))
    ).slice(0, 3)

    return {
      recentSearches: recentSearches.map(h => h.query),
      topCategories,
      searchFrequency: analytics.totalSearches,
      averageResults: Math.round(analytics.averageResultsPerSearch),
      clickThroughRate: Math.round(analytics.clickThroughRate * 100)
    }
  }, [searchHistory, categories, analytics])

  // Smart query enhancement
  const enhanceQuery = useCallback((originalQuery: string): string => {
    let enhanced = originalQuery.trim()

    // Add location context if not present
    if (!enhanced.includes('near') && !enhanced.includes('in ') && !enhanced.includes('at ')) {
      enhanced += ' near me'
    }

    // Expand abbreviations
    const abbreviations: Record<string, string> = {
      'biz': 'business',
      'tech': 'technology',
      'edu': 'education',
      'fit': 'fitness',
      'art': 'arts'
    }

    Object.entries(abbreviations).forEach(([abbr, full]) => {
      const regex = new RegExp(`\\b${abbr}\\b`, 'gi')
      enhanced = enhanced.replace(regex, full)
    })

    return enhanced
  }, [])

  return {
    // State
    query,
    suggestions,
    isLoading,
    searchHistory,
    analytics,

    // Actions
    setQuery,
    executeSearch,
    trackSearchClick,
    clearHistory,

    // Utilities
    getSearchInsights,
    enhanceQuery,
    
    // Computed
    hasHistory: searchHistory.length > 0,
    hasSuggestions: suggestions.length > 0,
    isSearching: isLoading || (debouncedQuery.length >= minQueryLength && suggestions.length === 0)
  }
}
