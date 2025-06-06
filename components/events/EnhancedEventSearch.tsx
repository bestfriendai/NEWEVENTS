"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Tag, 
  SlidersHorizontal,
  X,
  ChevronDown,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { DateRangePicker } from "@/components/date-range-picker"
import { useDebounce } from "@/hooks/use-debounce"
import { useEnhancedEvents } from "@/hooks/use-enhanced-events"
import type { EventSearchParams } from "@/types"
import { logger } from "@/lib/utils/logger"

interface EnhancedEventSearchProps {
  onResults?: (events: any[]) => void
  onLoading?: (loading: boolean) => void
  onError?: (error: string | null) => void
  initialParams?: EventSearchParams
  className?: string
}

const CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'Concerts', label: 'Concerts' },
  { id: 'Club Events', label: 'Club Events' },
  { id: 'Day Parties', label: 'Day Parties' },
  { id: 'Festivals', label: 'Festivals' },
  { id: 'Sports', label: 'Sports' },
  { id: 'Arts', label: 'Arts & Culture' },
  { id: 'Food', label: 'Food & Drink' },
  { id: 'Business', label: 'Business' },
  { id: 'Comedy', label: 'Comedy' },
  { id: 'Theater', label: 'Theater' }
]

const SORT_OPTIONS = [
  { value: 'date', label: 'Date' },
  { value: 'distance', label: 'Distance' },
  { value: 'popularity', label: 'Popularity' },
  { value: 'price', label: 'Price' },
  { value: 'relevance', label: 'Relevance' }
]

export function EnhancedEventSearch({
  onResults,
  onLoading,
  onError,
  initialParams = {},
  className = ""
}: EnhancedEventSearchProps) {
  // Search state
  const [searchQuery, setSearchQuery] = useState(initialParams.query || initialParams.keyword || "")
  const [location, setLocation] = useState(initialParams.location || "")
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialParams.categories || (initialParams.category ? [initialParams.category] : [])
  )
  const [priceRange, setPriceRange] = useState([
    initialParams.priceRange?.min || initialParams.priceMin || 0,
    initialParams.priceRange?.max || initialParams.priceMax || 500
  ])
  const [radius, setRadius] = useState(initialParams.radius || 25)
  const [sortBy, setSortBy] = useState(initialParams.sortBy || 'date')
  const [sortOrder, setSortOrder] = useState(initialParams.sortOrder || 'asc')
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null)
  const [hasImages, setHasImages] = useState(initialParams.hasImages || false)
  const [hasDescription, setHasDescription] = useState(initialParams.hasDescription || false)
  
  // UI state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  // Debounced search query
  const debouncedQuery = useDebounce(searchQuery, 300)
  const debouncedLocation = useDebounce(location, 300)

  // Enhanced events hook
  const { events, isLoading, error, searchEvents, clearEvents } = useEnhancedEvents({
    autoFetch: false
  })

  // Build search parameters
  const buildSearchParams = useCallback((): EventSearchParams => {
    const params: EventSearchParams = {
      query: debouncedQuery || undefined,
      location: debouncedLocation || undefined,
      categories: selectedCategories.length > 0 && !selectedCategories.includes('all') 
        ? selectedCategories 
        : undefined,
      priceRange: priceRange[0] > 0 || priceRange[1] < 500 
        ? { min: priceRange[0], max: priceRange[1] } 
        : undefined,
      radius: radius !== 25 ? radius : undefined,
      sortBy,
      sortOrder,
      dateRange: dateRange 
        ? { 
            start: dateRange.start.toISOString(), 
            end: dateRange.end.toISOString() 
          } 
        : undefined,
      hasImages: hasImages || undefined,
      hasDescription: hasDescription || undefined,
      limit: 50
    }

    // Remove undefined values
    return Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined)
    ) as EventSearchParams
  }, [
    debouncedQuery,
    debouncedLocation,
    selectedCategories,
    priceRange,
    radius,
    sortBy,
    sortOrder,
    dateRange,
    hasImages,
    hasDescription
  ])

  // Perform search
  const handleSearch = useCallback(async () => {
    const searchParams = buildSearchParams()
    
    // Don't search if no meaningful parameters
    if (!searchParams.query && !searchParams.location && !searchParams.categories?.length) {
      clearEvents()
      return
    }

    setIsSearching(true)
    
    try {
      await searchEvents(searchParams)
      
      logger.info("Enhanced event search completed", {
        component: "EnhancedEventSearch",
        action: "search",
        metadata: { searchParams, resultCount: events.length }
      })
    } catch (error) {
      logger.error("Enhanced event search failed", {
        component: "EnhancedEventSearch",
        action: "search_error",
        error: error instanceof Error ? error.message : String(error)
      })
    } finally {
      setIsSearching(false)
    }
  }, [buildSearchParams, searchEvents, clearEvents, events.length])

  // Handle category toggle
  const handleCategoryToggle = useCallback((categoryId: string) => {
    setSelectedCategories(prev => {
      if (categoryId === 'all') {
        return []
      }
      
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId)
      } else {
        return [...prev.filter(id => id !== 'all'), categoryId]
      }
    })
  }, [])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery("")
    setLocation("")
    setSelectedCategories([])
    setPriceRange([0, 500])
    setRadius(25)
    setSortBy('date')
    setSortOrder('asc')
    setDateRange(null)
    setHasImages(false)
    setHasDescription(false)
    clearEvents()
  }, [clearEvents])

  // Auto-search when parameters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [handleSearch])

  // Notify parent components
  useEffect(() => {
    onResults?.(events)
  }, [events, onResults])

  useEffect(() => {
    onLoading?.(isLoading || isSearching)
  }, [isLoading, isSearching, onLoading])

  useEffect(() => {
    onError?.(error)
  }, [error, onError])

  const activeFilterCount = [
    searchQuery,
    location,
    selectedCategories.length > 0 && !selectedCategories.includes('all'),
    priceRange[0] > 0 || priceRange[1] < 500,
    radius !== 25,
    dateRange,
    hasImages,
    hasDescription
  ].filter(Boolean).length

  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="p-6">
        {/* Main Search Bar */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search events, venues, or activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10"
            />
          </div>

          <Button
            variant="outline"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="relative"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <Badge className="ml-2 bg-blue-600 text-white text-xs px-1.5 py-0.5 min-w-[1.25rem] h-5">
                {activeFilterCount}
              </Badge>
            )}
            <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <Separator className="mb-4" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Categories */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Categories</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {CATEGORIES.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={category.id}
                          checked={
                            category.id === 'all' 
                              ? selectedCategories.length === 0 
                              : selectedCategories.includes(category.id)
                          }
                          onCheckedChange={() => handleCategoryToggle(category.id)}
                        />
                        <Label htmlFor={category.id} className="text-sm">
                          {category.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    Price Range: ${priceRange[0]} - ${priceRange[1]}
                  </Label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={500}
                    step={10}
                    className="w-full"
                  />
                </div>

                {/* Distance */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    Distance: {radius} miles
                  </Label>
                  <Slider
                    value={[radius]}
                    onValueChange={(value) => setRadius(value[0])}
                    min={5}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>

                {/* Date Range */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Date Range</Label>
                  <DateRangePicker
                    value={dateRange}
                    onChange={setDateRange}
                    placeholder="Select date range"
                  />
                </div>

                {/* Sorting */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Sort By</Label>
                  <div className="flex gap-2">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SORT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select value={sortOrder} onValueChange={setSortOrder}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Asc</SelectItem>
                        <SelectItem value="desc">Desc</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Quality Filters */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Quality Filters</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hasImages"
                        checked={hasImages}
                        onCheckedChange={setHasImages}
                      />
                      <Label htmlFor="hasImages" className="text-sm">
                        Has Images
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hasDescription"
                        checked={hasDescription}
                        onCheckedChange={setHasDescription}
                      />
                      <Label htmlFor="hasDescription" className="text-sm">
                        Has Description
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t">
                <Button variant="ghost" onClick={clearFilters}>
                  Clear All Filters
                </Button>
                
                <div className="flex items-center gap-2">
                  {(isLoading || isSearching) && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  <span className="text-sm text-gray-500">
                    {events.length} events found
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
