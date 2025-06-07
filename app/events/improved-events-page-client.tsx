"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
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
} from "lucide-react"
import { ImprovedEventsMap } from "../../components/events/ImprovedEventsMap"
import { EnhancedEventCard } from "../../components/events/EnhancedEventCard"
import { EventsPageSkeleton } from "../../components/events/EventsPageSkeleton"
import { FeaturedEventsCarousel } from "../../components/events/FeaturedEventsCarousel"
import { EventFiltersPanel } from "../../components/events/EventFiltersPanel"
import { useDebounce } from "../../hooks/use-debounce"
import { useEnhancedEvents } from "../../hooks/use-enhanced-events"

interface Event {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  latitude: number
  longitude: number
  category: string
  price: number
  image: string
  attendees: number
  rating: number
  isFeatured: boolean
  tags: string[]
  organizer: string
}

const categories = [
  { id: "all", label: "All Events", icon: Grid3X3 },
  { id: "music", label: "Music", icon: Music },
  { id: "art", label: "Art & Culture", icon: Palette },
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
  { value: "rating", label: "Rating" },
]

export function ImprovedEventsPageClient() {
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [priceRange, setPriceRange] = useState([0, 500])
  const [dateRange, setDateRange] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [favoriteEvents, setFavoriteEvents] = useState<Set<string>>(new Set())

  const debouncedSearch = useDebounce(searchQuery, 300)
  const { events, loading, error, refetch } = useEnhancedEvents({
    search: debouncedSearch,
    category: selectedCategory,
    sortBy,
    priceRange,
    dateRange,
    featuredOnly: showFeaturedOnly,
  })

  const filteredEvents = useMemo(() => {
    if (!events) return []

    return events.filter((event) => {
      const matchesSearch =
        !debouncedSearch ||
        event.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        event.description.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        event.location.toLowerCase().includes(debouncedSearch.toLowerCase())

      const matchesCategory = selectedCategory === "all" || event.category === selectedCategory
      const matchesPrice = event.price >= priceRange[0] && event.price <= priceRange[1]
      const matchesFeatured = !showFeaturedOnly || event.isFeatured

      return matchesSearch && matchesCategory && matchesPrice && matchesFeatured
    })
  }, [events, debouncedSearch, selectedCategory, priceRange, showFeaturedOnly])

  const featuredEvents = useMemo(() => {
    return events?.filter((event) => event.isFeatured).slice(0, 5) || []
  }, [events])

  const toggleFavorite = (eventId: string) => {
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

  const shareEvent = (event: Event) => {
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

  if (loading) return <EventsPageSkeleton />
  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Events</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={refetch}>Try Again</Button>
        </Card>
      </div>
    )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Discover Events</h1>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {filteredEvents.length} events
              </Badge>
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
            </div>
          </div>
        </div>
      </div>

      {/* Featured Events Carousel */}
      {featuredEvents.length > 0 && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-gray-900">Featured Events</h2>
            </div>
            <FeaturedEventsCarousel
              events={featuredEvents}
              onEventSelect={setSelectedEvent}
              onToggleFavorite={toggleFavorite}
              favoriteEvents={favoriteEvents}
            />
          </div>
        </div>
      )}

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
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex items-center space-x-2 overflow-x-auto">
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

            {/* Content */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <EnhancedEventCard
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
              <div className="h-[600px] rounded-lg overflow-hidden">
                <ImprovedEventsMap
                  events={filteredEvents}
                  selectedEvent={selectedEvent}
                  onEventSelect={setSelectedEvent}
                  onToggleFavorite={toggleFavorite}
                  favoriteEvents={favoriteEvents}
                />
              </div>
            )}

            {/* Empty State */}
            {filteredEvents.length === 0 && (
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
