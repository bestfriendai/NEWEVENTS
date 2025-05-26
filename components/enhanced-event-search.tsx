/**
 * Enhanced Event Search Component
 * Provides advanced search functionality with real-time results and caching
 */

"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { Search, MapPin, Calendar, Filter, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Slider } from "@/components/ui/slider"
import { useEnhancedEvents } from "@/hooks/use-enhanced-events"
import { useAnalytics } from "@/hooks/use-analytics"
import { logger } from "@/lib/utils/logger"
import type { EventSearchParams } from "@/types"

export interface EnhancedEventSearchProps {
  onResults?: (events: any[], totalCount: number) => void
  onLoading?: (isLoading: boolean) => void
  onError?: (error: string | null) => void
  initialParams?: EventSearchParams
  showAdvancedFilters?: boolean
  placeholder?: string
  className?: string
}

const CATEGORIES = [
  "Music",
  "Arts",
  "Sports",
  "Food",
  "Business",
  "Technology",
  "Health",
  "Education",
  "Entertainment",
  "Community",
]

const RADIUS_OPTIONS = [
  { value: 5, label: "5 km" },
  { value: 10, label: "10 km" },
  { value: 25, label: "25 km" },
  { value: 50, label: "50 km" },
  { value: 100, label: "100 km" },
]

export function EnhancedEventSearch({
  onResults,
  onLoading,
  onError,
  initialParams = {},
  showAdvancedFilters = true,
  placeholder = "Search for events...",
  className = "",
}: EnhancedEventSearchProps) {
  // Search state
  const [keyword, setKeyword] = useState(initialParams.keyword || "")
  const [location, setLocation] = useState(initialParams.location || "")
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialParams.categories || [])
  const [radius, setRadius] = useState(initialParams.radius || 25)
  const [startDate, setStartDate] = useState<Date | undefined>(
    initialParams.startDate ? new Date(initialParams.startDate) : undefined,
  )
  const [endDate, setEndDate] = useState<Date | undefined>(
    initialParams.endDate ? new Date(initialParams.endDate) : undefined,
  )
  const [showFilters, setShowFilters] = useState(false)

  // Hooks
  const { trackSearch } = useAnalytics()
  const { events, totalCount, isLoading, isError, error, searchEvents, clearEvents } = useEnhancedEvents({
    initialParams,
    autoFetch: false, // We'll control fetching manually
  })

  /**
   * Build search parameters
   */
  const buildSearchParams = useCallback((): EventSearchParams => {
    const params: EventSearchParams = {}

    if (keyword.trim()) {
      params.keyword = keyword.trim()
    }

    if (location.trim()) {
      params.location = location.trim()
      params.radius = radius
    }

    if (selectedCategories.length > 0) {
      params.categories = selectedCategories
    }

    if (startDate) {
      params.startDate = startDate.toISOString()
    }

    if (endDate) {
      params.endDate = endDate.toISOString()
    }

    params.page = 0
    params.size = 20

    return params
  }, [keyword, location, selectedCategories, radius, startDate, endDate])

  /**
   * Perform search
   */
  const handleSearch = useCallback(async () => {
    const searchParams = buildSearchParams()

    // Don't search if no meaningful parameters
    if (!searchParams.keyword && !searchParams.location && !searchParams.categories?.length) {
      clearEvents()
      return
    }

    logger.info("Performing enhanced event search", {
      component: "EnhancedEventSearch",
      action: "search",
      metadata: { searchParams },
    })

    try {
      await searchEvents(searchParams)
      await trackSearch(searchParams)
    } catch (error) {
      logger.error(
        "Search failed",
        {
          component: "EnhancedEventSearch",
          action: "search_error",
        },
        error instanceof Error ? error : new Error(String(error)),
      )
    }
  }, [buildSearchParams, searchEvents, clearEvents, trackSearch])

  /**
   * Handle category toggle
   */
  const toggleCategory = useCallback((category: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category)
      } else {
        return [...prev, category]
      }
    })
  }, [])

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setKeyword("")
    setLocation("")
    setSelectedCategories([])
    setRadius(25)
    setStartDate(undefined)
    setEndDate(undefined)
    clearEvents()
  }, [clearEvents])

  /**
   * Handle enter key press
   */
  const handleKeyPress = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter") {
        handleSearch()
      }
    },
    [handleSearch],
  )

  // Effect to notify parent components
  useEffect(() => {
    onResults?.(events, totalCount)
  }, [events, totalCount, onResults])

  useEffect(() => {
    onLoading?.(isLoading)
  }, [isLoading, onLoading])

  useEffect(() => {
    onError?.(error)
  }, [error, onError])

  // Auto-search when filters change (debounced via the hook)
  useEffect(() => {
    const searchParams = buildSearchParams()
    if (searchParams.keyword || searchParams.location || searchParams.categories?.length) {
      const timeoutId = setTimeout(() => {
        handleSearch()
      }, 500) // 500ms debounce

      return () => clearTimeout(timeoutId)
    }
  }, [buildSearchParams, handleSearch])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10"
          />
        </div>

        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10"
          />
        </div>

        <Button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>

        {showAdvancedFilters && (
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="relative">
            <Filter className="h-4 w-4" />
            {(selectedCategories.length > 0 || startDate || endDate) && (
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary" />
            )}
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && showFilters && (
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Categories */}
            <div>
              <label className="text-sm font-medium mb-2 block">Categories</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((category) => (
                  <Badge
                    key={category}
                    variant={selectedCategories.includes(category) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="mr-2 h-4 w-4" />
                      {startDate ? startDate.toLocaleDateString() : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="mr-2 h-4 w-4" />
                      {endDate ? endDate.toLocaleDateString() : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => date < (startDate || new Date())}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Radius */}
            {location && (
              <div>
                <label className="text-sm font-medium mb-2 block">Search Radius: {radius} km</label>
                <Slider
                  value={[radius]}
                  onValueChange={(value) => setRadius(value[0])}
                  max={100}
                  min={5}
                  step={5}
                  className="w-full"
                />
              </div>
            )}

            {/* Filter Actions */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
              <Button onClick={handleSearch} disabled={isLoading}>
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Filters Display */}
      {(selectedCategories.length > 0 || startDate || endDate) && (
        <div className="flex flex-wrap gap-2">
          {selectedCategories.map((category) => (
            <Badge key={category} variant="secondary" className="cursor-pointer">
              {category}
              <X className="ml-1 h-3 w-3" onClick={() => toggleCategory(category)} />
            </Badge>
          ))}
          {startDate && (
            <Badge variant="secondary" className="cursor-pointer">
              From: {startDate.toLocaleDateString()}
              <X className="ml-1 h-3 w-3" onClick={() => setStartDate(undefined)} />
            </Badge>
          )}
          {endDate && (
            <Badge variant="secondary" className="cursor-pointer">
              To: {endDate.toLocaleDateString()}
              <X className="ml-1 h-3 w-3" onClick={() => setEndDate(undefined)} />
            </Badge>
          )}
        </div>
      )}

      {/* Error Display */}
      {isError && error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  )
}
