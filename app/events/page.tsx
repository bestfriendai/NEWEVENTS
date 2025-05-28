"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchEvents, getFeaturedEvents } from "@/app/actions/event-actions"
import type { EventDetailProps } from "@/components/event-detail-modal"
import { LocationSetupScreen } from "@/components/events/LocationSetupScreen"
import {
  Search,
  Calendar,
  Grid3X3,
  Map,
  SlidersHorizontal,
  TrendingUp,
  Music,
  Palette,
  Gamepad2,
  Utensils,
  Briefcase,
  GraduationCap,
  Zap,
  X,
  MapPin,
  Clock,
  Users,
  Star,
  Heart,
  Share2,
  AlertCircle,
  RefreshCw,
} from "lucide-react"

const categories = [
  { id: "all", label: "All Events", icon: Grid3X3 },
  { id: "music", label: "Music", icon: Music },
  { id: "arts", label: "Arts & Culture", icon: Palette },
  { id: "sports", label: "Sports", icon: Gamepad2 },
  { id: "food", label: "Food & Drink", icon: Utensils },
  { id: "business", label: "Business", icon: Briefcase },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "nightlife", label: "Nightlife", icon: Zap },
]

const sortOptions = [
  { value: "date", label: "Date" },
  { value: "popularity", label: "Popularity" },
  { value: "price", label: "Price" },
  { value: "distance", label: "Distance" },
]

function EventCard({
  event,
  isFavorite,
  onToggleFavorite,
  onShare,
  onClick,
}: {
  event: EventDetailProps
  isFavorite: boolean
  onToggleFavorite: () => void
  onShare: () => void
  onClick: () => void
}) {
  return (
    <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative">
        <img
          src={event.image || "/placeholder.svg?height=200&width=300&text=Event"}
          alt={event.title}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        {event.isFeatured && (
          <Badge className="absolute top-2 left-2 bg-orange-500 hover:bg-orange-600">
            <TrendingUp className="h-3 w-3 mr-1" />
            Featured
          </Badge>
        )}
        <div className="absolute top-2 right-2 flex space-x-1">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
            onClick={(e) => {
              e.stopPropagation()
              onToggleFavorite()
            }}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
            onClick={(e) => {
              e.stopPropagation()
              onShare()
            }}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <CardContent className="p-4" onClick={onClick}>
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-blue-600 transition-colors">
            {event.title}
          </h3>
          {event.rating && (
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{event.rating}</span>
            </div>
          )}
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{event.description}</p>

        <div className="space-y-2 text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>{event.date}</span>
            {event.time && (
              <>
                <Clock className="h-4 w-4 ml-2" />
                <span>{event.time}</span>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{event.location}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>{event.attendees || 0} attending</span>
            </div>
            <div className="font-semibold text-lg">{event.price}</div>
          </div>
        </div>

        {event.category && (
          <div className="flex flex-wrap gap-1 mt-3">
            <Badge variant="secondary" className="text-xs">
              {event.category}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function EventCardSkeleton() {
  return (
    <Card>
      <Skeleton className="h-48 w-full rounded-t-lg" />
      <CardContent className="p-4">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-2/3 mb-3" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
        <div className="flex gap-1 mt-3">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </CardContent>
    </Card>
  )
}

function FeaturedEventsCarousel({
  events,
  isLoading,
  onEventSelect,
  onToggleFavorite,
  favoriteEvents,
}: {
  events: EventDetailProps[]
  isLoading: boolean
  onEventSelect: (event: EventDetailProps) => void
  onToggleFavorite: (eventId: number) => void
  favoriteEvents: Set<number>
}) {
  if (isLoading) {
    return (
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-80">
            <EventCardSkeleton />
          </div>
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
          <Calendar className="h-10 w-10 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No featured events available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex space-x-4 overflow-x-auto pb-4">
      {events.map((event) => (
        <div key={event.id} className="flex-shrink-0 w-80">
          <EventCard
            event={event}
            isFavorite={favoriteEvents.has(event.id)}
            onToggleFavorite={() => onToggleFavorite(event.id)}
            onShare={() => {}}
            onClick={() => onEventSelect(event)}
          />
        </div>
      ))}
    </div>
  )
}

function EventFiltersPanel({
  categories,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  sortOptions,
  priceRange,
  onPriceRangeChange,
  dateRange,
  onDateRangeChange,
  showFeaturedOnly,
  onShowFeaturedOnlyChange,
}: {
  categories: typeof categories
  selectedCategory: string
  onCategoryChange: (category: string) => void
  sortBy: string
  onSortChange: (sort: string) => void
  sortOptions: typeof sortOptions
  priceRange: number[]
  onPriceRangeChange: (range: number[]) => void
  dateRange: string
  onDateRangeChange: (range: string) => void
  showFeaturedOnly: boolean
  onShowFeaturedOnlyChange: (show: boolean) => void
}) {
  return (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Category</Label>
        <div className="space-y-2">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => onCategoryChange(category.id)}
              >
                <Icon className="h-4 w-4 mr-2" />
                {category.label}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Sort */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Sort By</Label>
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div>
        <Label className="text-sm font-medium mb-3 block">
          Price Range: ${priceRange[0]} - ${priceRange[1]}
        </Label>
        <Slider value={priceRange} onValueChange={onPriceRangeChange} max={500} step={10} className="w-full" />
      </div>

      {/* Date Range */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Date Range</Label>
        <Select value={dateRange} onValueChange={onDateRangeChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dates</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="tomorrow">Tomorrow</SelectItem>
            <SelectItem value="this-week">This Week</SelectItem>
            <SelectItem value="this-month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Featured Only */}
      <div className="flex items-center space-x-2">
        <Switch id="featured-only" checked={showFeaturedOnly} onCheckedChange={onShowFeaturedOnlyChange} />
        <Label htmlFor="featured-only" className="text-sm">
          Featured events only
        </Label>
      </div>
    </div>
  )
}

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default function EventsPage() {
  const [hasLocation, setHasLocation] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; name: string } | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [priceRange, setPriceRange] = useState([0, 500])
  const [dateRange, setDateRange] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EventDetailProps | null>(null)
  const [favoriteEvents, setFavoriteEvents] = useState<Set<number>>(new Set())

  // State for API data
  const [events, setEvents] = useState<EventDetailProps[]>([])
  const [featuredEvents, setFeaturedEvents] = useState<EventDetailProps[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFeaturedLoading, setIsFeaturedLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  const debouncedSearch = useDebounce(searchQuery, 300)

  // Check if user already has a location set (from localStorage or previous session)
  useEffect(() => {
    const savedLocation = localStorage.getItem("dateai-user-location")
    if (savedLocation) {
      try {
        const location = JSON.parse(savedLocation)
        setUserLocation(location)
        setHasLocation(true)
      } catch (e) {
        // Invalid saved location, ignore
      }
    }
  }, [])

  // Fetch events when search parameters change
  useEffect(() => {
    if (!hasLocation || !userLocation) return

    const loadEvents = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Convert category for API
        const apiCategory = selectedCategory !== "all" ? [selectedCategory] : undefined

        // Convert date range for API
        let startDate: string | undefined
        let endDate: string | undefined

        const now = new Date()
        if (dateRange === "today") {
          startDate = now.toISOString()
          const tomorrow = new Date(now)
          tomorrow.setDate(tomorrow.getDate() + 1)
          endDate = tomorrow.toISOString()
        } else if (dateRange === "tomorrow") {
          const tomorrow = new Date(now)
          tomorrow.setDate(tomorrow.getDate() + 1)
          startDate = tomorrow.toISOString()
          const dayAfter = new Date(tomorrow)
          dayAfter.setDate(dayAfter.getDate() + 1)
          endDate = dayAfter.toISOString()
        } else if (dateRange === "this-week") {
          startDate = now.toISOString()
          const nextWeek = new Date(now)
          nextWeek.setDate(nextWeek.getDate() + 7)
          endDate = nextWeek.toISOString()
        } else if (dateRange === "this-month") {
          startDate = now.toISOString()
          const nextMonth = new Date(now)
          nextMonth.setMonth(nextMonth.getMonth() + 1)
          endDate = nextMonth.toISOString()
        }

        const result = await fetchEvents({
          keyword: debouncedSearch || undefined,
          coordinates: userLocation,
          radius: 25, // Default radius in miles
          categories: apiCategory,
          page,
          size: 12,
          sort: sortBy,
        })

        if (result.error) {
          setError(result.error.message)
        } else {
          setEvents(result.events)
          setTotalCount(result.totalCount)
          setTotalPages(result.totalPages)

          // Mark featured events
          const enhancedEvents = result.events.map((event) => ({
            ...event,
            isFeatured: event.isFeatured || false,
          }))

          setEvents(enhancedEvents)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load events")
      } finally {
        setIsLoading(false)
      }
    }

    loadEvents()
  }, [hasLocation, userLocation, debouncedSearch, selectedCategory, sortBy, dateRange, page])

  // Fetch featured events separately
  useEffect(() => {
    if (!hasLocation || !userLocation) return

    const loadFeaturedEvents = async () => {
      setIsFeaturedLoading(true)
      try {
        const featured = await getFeaturedEvents(5)

        // Mark as featured
        const enhancedFeatured = featured.map((event) => ({
          ...event,
          isFeatured: true,
        }))

        setFeaturedEvents(enhancedFeatured)
      } catch (err) {
        console.error("Failed to load featured events:", err)
      } finally {
        setIsFeaturedLoading(false)
      }
    }

    loadFeaturedEvents()
  }, [hasLocation, userLocation])

  const handleLocationSet = (location: { lat: number; lng: number; name: string }) => {
    setUserLocation(location)
    setHasLocation(true)
    // Save location for future sessions
    localStorage.setItem("dateai-user-location", JSON.stringify(location))
  }

  const handleLocationChange = () => {
    setHasLocation(false)
    localStorage.removeItem("dateai-user-location")
  }

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

  const handleRetry = () => {
    setPage(0)
    setError(null)
    // The useEffect will trigger a new fetch
  }

  if (!hasLocation) {
    return <LocationSetupScreen onLocationSet={handleLocationSet} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Discover Events</h1>
              {!isLoading && !error && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {totalCount} events
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              {/* View Toggle */}
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "grid" | "map")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="grid" className="flex items-center space-x-2">
                    <Grid3X3 className="h-4 w-4" />
                    <span>Grid</span>
                  </TabsTrigger>
                  <TabsTrigger value="map" className="flex items-center space-x-2">
                    <Map className="h-4 w-4" />
                    <span>Map</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Filters Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>Filters</span>
              </Button>

              {/* Location Button */}
              <Button variant="outline" onClick={handleLocationChange} className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">{userLocation?.name || "Change Location"}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Events Carousel */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900">Featured Events</h2>
          </div>
          <FeaturedEventsCarousel
            events={featuredEvents}
            isLoading={isFeaturedLoading}
            onEventSelect={setSelectedEvent}
            onToggleFavorite={toggleFavorite}
            favoriteEvents={favoriteEvents}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-80 flex-shrink-0">
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Filters</h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <EventFiltersPanel
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    sortOptions={sortOptions}
                    priceRange={priceRange}
                    onPriceRangeChange={setPriceRange}
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    showFeaturedOnly={showFeaturedOnly}
                    onShowFeaturedOnlyChange={setShowFeaturedOnly}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1">
            {/* Quick Filters */}
            <div className="flex items-center space-x-4 mb-6 overflow-x-auto pb-2">
              <div className="flex items-center space-x-2">
                {categories.slice(0, 6).map((category) => {
                  const Icon = category.icon
                  return (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                      className="flex items-center space-x-2 whitespace-nowrap"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{category.label}</span>
                    </Button>
                  )
                })}
              </div>

              <Separator orientation="vertical" className="h-6" />

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-red-100 p-2 rounded-full">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-red-800">Error loading events</h3>
                    <p className="text-red-600 mt-1">{error}</p>
                  </div>
                </div>
                <Button onClick={handleRetry} className="mt-4" variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            )}

            {/* Content */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} />)
                  : events.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        isFavorite={favoriteEvents.has(event.id)}
                        onToggleFavorite={() => toggleFavorite(event.id)}
                        onShare={() => shareEvent(event)}
                        onClick={() => setSelectedEvent(event)}
                      />
                    ))}
              </div>
            ) : (
              <div className="h-[600px] rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <Map className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Map View</h3>
                  <p className="text-gray-500">Interactive map coming soon!</p>
                </div>
              </div>
            )}

            {/* Pagination */}
            {!isLoading && !error && events.length > 0 && (
              <div className="flex justify-center mt-8 space-x-2">
                <Button variant="outline" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                  Previous
                </Button>
                <div className="flex items-center px-4">
                  Page {page + 1} of {totalPages || 1}
                </div>
                <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1}>
                  Next
                </Button>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && events.length === 0 && (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No events found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your search criteria or filters to find more events.</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedCategory("all")
                    setShowFeaturedOnly(false)
                    setPriceRange([0, 500])
                    setDateRange("all")
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
