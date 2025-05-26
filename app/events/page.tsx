"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Filter, MapPin, Calendar, Star, Grid, Map, List, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { EnhancedMapExplorer } from "@/components/enhanced-map-explorer"
import { EnhancedEventCard } from "@/components/enhanced-event-card"
import { EventDetailModal, type EventDetailProps } from "@/components/event-detail-modal"
import { SimpleMapFallback } from "@/components/simple-map-fallback"
import { useLocation } from "@/contexts/LocationContext"
import { useFavorites } from "@/contexts/FavoritesContext"
import { useEnhancedEvents } from "@/hooks/use-enhanced-events"
import { useDebounce } from "@/hooks/use-debounce"
import type { EventSearchParams } from "@/types"

const CATEGORIES = [
  "All",
  "Music",
  "Sports",
  "Arts & Theatre",
  "Comedy",
  "Food & Drink",
  "Business",
  "Health",
  "Technology",
  "Family",
  "Education",
  "Community"
]

const SORT_OPTIONS = [
  { value: "date", label: "Date" },
  { value: "popularity", label: "Popularity" },
  { value: "distance", label: "Distance" },
  { value: "price", label: "Price" }
]

interface EventsPageState {
  searchQuery: string
  selectedCategory: string
  sortBy: string
  viewMode: "grid" | "list" | "map"
  showFilters: boolean
  selectedEvent: EventDetailProps | null
  showEventModal: boolean
  priceRange: [number, number]
  dateRange: { start: string; end: string } | null
  radius: number
  showOnlyFavorites: boolean
}

export default function EventsPage() {
  // State management
  const [state, setState] = useState<EventsPageState>({
    searchQuery: "",
    selectedCategory: "All",
    sortBy: "date",
    viewMode: "grid",
    showFilters: false,
    selectedEvent: null,
    showEventModal: false,
    priceRange: [0, 500],
    dateRange: null,
    radius: 25,
    showOnlyFavorites: false
  })

  // Hooks
  const { location, userLocation, getCurrentLocation, searchLocation, isLoading: locationLoading } = useLocation()
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites()
  const debouncedSearchQuery = useDebounce(state.searchQuery, 300)

  // Build search params for API
  const searchParams = useMemo<EventSearchParams>(() => ({
    location: userLocation ? `${userLocation.lat},${userLocation.lng}` : "New York, NY",
    category: state.selectedCategory !== "All" ? state.selectedCategory : undefined,
    startDate: state.dateRange?.start,
    endDate: state.dateRange?.end,
    minPrice: state.priceRange[0],
    maxPrice: state.priceRange[1],
    radius: state.radius,
    limit: 50
  }), [userLocation, state.selectedCategory, state.dateRange, state.priceRange, state.radius])

  // Fetch events with enhanced hook
  const {
    events,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh
  } = useEnhancedEvents({
    initialParams: searchParams,
    autoFetch: true
  })

  // Filter and sort events
  const processedEvents = useMemo(() => {
    let filtered = events

    // Filter by search query
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase()
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query)
      )
    }

    // Filter by favorites if enabled
    if (state.showOnlyFavorites) {
      filtered = filtered.filter(event => isFavorite(event.id.toString()))
    }

    // Sort events
    filtered.sort((a, b) => {
      switch (state.sortBy) {
        case "date":
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        case "popularity":
          return (b.attendees || 0) - (a.attendees || 0)
        case "price":
          // Extract numeric value from price string
          const aPrice = parseFloat(a.price.replace(/[^0-9.]/g, '')) || 0
          const bPrice = parseFloat(b.price.replace(/[^0-9.]/g, '')) || 0
          return aPrice - bPrice
        default:
          return 0
      }
    })

    return filtered
  }, [events, debouncedSearchQuery, state.showOnlyFavorites, state.sortBy, isFavorite])

  // Event handlers
  const handleSearchChange = useCallback((value: string) => {
    setState(prev => ({ ...prev, searchQuery: value }))
  }, [])

  const handleCategoryChange = useCallback((category: string) => {
    setState(prev => ({ ...prev, selectedCategory: category }))
  }, [])

  const handleViewModeChange = useCallback((mode: "grid" | "list" | "map") => {
    setState(prev => ({ ...prev, viewMode: mode }))
  }, [])

  const handleEventSelect = useCallback((event: EventDetailProps) => {
    setState(prev => ({ ...prev, selectedEvent: event, showEventModal: true }))
  }, [])

  const handleEventClose = useCallback(() => {
    setState(prev => ({ ...prev, selectedEvent: null, showEventModal: false }))
  }, [])

  const handleFavoriteToggle = useCallback((eventId: number) => {
    const eventIdStr = eventId.toString()
    if (isFavorite(eventIdStr)) {
      removeFavorite(eventIdStr)
    } else {
      addFavorite(eventIdStr)
    }
  }, [isFavorite, addFavorite, removeFavorite])

  const handleLocationSearch = useCallback(async (query: string) => {
    if (query.trim()) {
      await searchLocation(query)
    }
  }, [searchLocation])

  // Initialize location on mount
  useEffect(() => {
    if (!userLocation) {
      getCurrentLocation()
    }
  }, [userLocation, getCurrentLocation])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0B10] to-[#12141D] text-gray-200">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0A0B10]/80 backdrop-blur-sm border-b border-gray-800/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Search */}
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search events, venues, or locations..."
                  value={state.searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 bg-[#1A1D25] border-gray-700 focus:border-purple-500"
                />
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={state.viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => handleViewModeChange("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={state.viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => handleViewModeChange("list")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={state.viewMode === "map" ? "default" : "outline"}
                size="sm"
                onClick={() => handleViewModeChange("map")}
              >
                <Map className="h-4 w-4" />
              </Button>
            </div>

            {/* Filters */}
            <Sheet open={state.showFilters} onOpenChange={(open) => setState(prev => ({ ...prev, showFilters: open }))}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-[#1A1D25] border-gray-800">
                <SheetHeader>
                  <SheetTitle className="text-white">Filter Events</SheetTitle>
                  <SheetDescription>
                    Customize your event discovery experience
                  </SheetDescription>
                </SheetHeader>
                
                <div className="space-y-6 mt-6">
                  {/* Location */}
                  <div>
                    <Label className="text-sm font-medium text-gray-300">Location</Label>
                    <div className="mt-2 space-y-2">
                      <Input
                        placeholder="Search location..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleLocationSearch(e.currentTarget.value)
                          }
                        }}
                        className="bg-[#22252F] border-gray-700"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={getCurrentLocation}
                        disabled={locationLoading}
                        className="w-full"
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Use Current Location
                      </Button>
                    </div>
                  </div>

                  <Separator className="bg-gray-700" />

                  {/* Price Range */}
                  <div>
                    <Label className="text-sm font-medium text-gray-300">
                      Price Range: ${state.priceRange[0]} - ${state.priceRange[1]}
                    </Label>
                    <Slider
                      value={state.priceRange}
                      onValueChange={(value) => setState(prev => ({ ...prev, priceRange: value as [number, number] }))}
                      max={500}
                      step={10}
                      className="mt-2"
                    />
                  </div>

                  <Separator className="bg-gray-700" />

                  {/* Radius */}
                  <div>
                    <Label className="text-sm font-medium text-gray-300">
                      Search Radius: {state.radius} miles
                    </Label>
                    <Slider
                      value={[state.radius]}
                      onValueChange={(value) => setState(prev => ({ ...prev, radius: value[0] }))}
                      max={100}
                      min={5}
                      step={5}
                      className="mt-2"
                    />
                  </div>

                  <Separator className="bg-gray-700" />

                  {/* Show Only Favorites */}
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-300">Show Only Favorites</Label>
                    <Switch
                      checked={state.showOnlyFavorites}
                      onCheckedChange={(checked) => setState(prev => ({ ...prev, showOnlyFavorites: checked }))}
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Categories & Sort */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2 overflow-x-auto">
              {CATEGORIES.map((category) => (
                <Button
                  key={category}
                  variant={state.selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCategoryChange(category)}
                  className="whitespace-nowrap"
                >
                  {category}
                </Button>
              ))}
            </div>

            <Select value={state.sortBy} onValueChange={(value) => setState(prev => ({ ...prev, sortBy: value }))}>
              <SelectTrigger className="w-40 bg-[#1A1D25] border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1D25] border-gray-700">
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Discover Events
                {userLocation && (
                  <span className="text-gray-400 text-lg ml-2">
                    near {userLocation.name || "your location"}
                  </span>
                )}
              </h1>
              <p className="text-gray-400 mt-1">
                {processedEvents.length} events found
                {state.showOnlyFavorites && " in your favorites"}
              </p>
            </div>
            
            {favorites.length > 0 && (
              <Badge variant="secondary" className="bg-purple-600/20 text-purple-300">
                <Star className="h-3 w-3 mr-1" />
                {favorites.length} favorites
              </Badge>
            )}
          </div>
        </div>

        {/* Content based on view mode */}
        <AnimatePresence mode="wait">
          {state.viewMode === "map" ? (
            <motion.div
              key="map"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-[calc(100vh-300px)] rounded-xl overflow-hidden border border-gray-800"
            >
              <EnhancedMapExplorer
                events={processedEvents}
                initialLocation={userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : undefined}
                initialLocationName={userLocation?.name}
              />
            </motion.div>
          ) : (
            <motion.div
              key={state.viewMode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="bg-[#1A1D25] border-gray-800 animate-pulse">
                      <div className="h-48 bg-gray-700 rounded-t-lg" />
                      <CardContent className="p-4 space-y-3">
                        <div className="h-4 bg-gray-700 rounded" />
                        <div className="h-3 bg-gray-700 rounded w-2/3" />
                        <div className="h-3 bg-gray-700 rounded w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : error ? (
                <Card className="bg-red-900/20 border-red-800 text-center p-8">
                  <CardContent>
                    <p className="text-red-300 mb-4">Failed to load events</p>
                    <Button onClick={refresh} variant="outline">
                      Try Again
                    </Button>
                  </CardContent>
                </Card>
              ) : processedEvents.length === 0 ? (
                <Card className="bg-[#1A1D25] border-gray-800 text-center p-8">
                  <CardContent>
                    <p className="text-gray-400 mb-4">No events found matching your criteria</p>
                    <Button
                      onClick={() => setState(prev => ({ 
                        ...prev, 
                        searchQuery: "", 
                        selectedCategory: "All", 
                        showOnlyFavorites: false 
                      }))}
                      variant="outline"
                    >
                      Clear Filters
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className={
                  state.viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "space-y-4"
                }>
                  {processedEvents.map((event) => (
                    <EnhancedEventCard
                      key={event.id}
                      event={event}
                      onEventClick={() => handleEventSelect(event)}
                      showFavoriteButton
                      showShareButton
                    />
                  ))}
                </div>
              )}

              {/* Load More */}
              {hasMore && !isLoading && (
                <div className="text-center mt-8">
                  <Button onClick={loadMore} variant="outline">
                    Load More Events
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Event Detail Modal */}
      {state.selectedEvent && (
        <EventDetailModal
          event={state.selectedEvent}
          isOpen={state.showEventModal}
          onClose={handleEventClose}
          onFavorite={() => handleFavoriteToggle(state.selectedEvent!.id)}
        />
      )}
    </div>
  )
}
