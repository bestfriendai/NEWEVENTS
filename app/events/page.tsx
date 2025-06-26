"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { Search, MapPin, Calendar, Users, Heart, Grid3X3, List, Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AppLayout } from "@/components/app-layout"
import { useRealEvents } from "@/hooks/use-real-events"
import { useFavoriteToggle } from "@/contexts/FavoritesContext"
import { LocationSelector } from "@/components/location-selector"
import { useLocation } from "@/hooks/use-location"
import type { Event, EventSearchParams } from "@/types/event.types"

// Categories for filtering
const CATEGORIES = [
  { id: "all", label: "All Events", icon: Grid3X3, color: "from-purple-500 to-pink-500" },
  { id: "Music", label: "Music", icon: Grid3X3, color: "from-purple-600 to-blue-600" },
  { id: "Arts & Culture", label: "Arts & Culture", icon: Grid3X3, color: "from-pink-600 to-rose-600" },
  { id: "Sports", label: "Sports", icon: Grid3X3, color: "from-green-600 to-emerald-600" },
  { id: "Food & Drink", label: "Food & Drink", icon: Grid3X3, color: "from-orange-600 to-red-600" },
  { id: "Business", label: "Business", icon: Grid3X3, color: "from-gray-600 to-slate-600" },
  { id: "Entertainment", label: "Entertainment", icon: Grid3X3, color: "from-yellow-600 to-orange-600" },
]

// Sort options
const SORT_OPTIONS = [
  { value: "date", label: "Date" },
  { value: "popularity", label: "Popularity" },
  { value: "price", label: "Price" },
  { value: "distance", label: "Distance" },
]

function EventCard({ event }: { event: Event }) {
  const { toggleFavorite, isFavorite } = useFavoriteToggle()
  const isFav = isFavorite(event.id.toString())

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const formatPrice = (event: Event) => {
    if (!event.price) return "Free"
    if (event.price.min === event.price.max) {
      return `${event.price.currency || 'USD'} ${event.price.min}`
    }
    return `${event.price.currency || 'USD'} ${event.price.min}${event.price.max ? ` - ${event.price.max}` : '+'}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="group"
    >
      <Card className="overflow-hidden bg-[#1A1D25]/60 border-gray-800/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
        <div className="relative">
          {event.image && (
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop&q=80`
              }}
            />
          )}
          <div className="absolute top-3 right-3">
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-full backdrop-blur-sm transition-colors ${
                isFav
                  ? "bg-red-500/80 text-white hover:bg-red-600"
                  : "bg-black/30 text-white hover:bg-black/50"
              }`}
              onClick={() => toggleFavorite(event.id.toString())}
            >
              <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
            </Button>
          </div>
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-purple-600/80 text-white">
              {event.source}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          <div className="space-y-2">
            <h3 className="font-semibold text-white text-lg line-clamp-2 group-hover:text-purple-400 transition-colors">
              {event.title}
            </h3>
            <p className="text-gray-400 text-sm line-clamp-2">
              {event.description || "No description available"}
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Calendar className="h-4 w-4 text-purple-400" />
            <span>{formatDate(event.date)}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-300">
            <MapPin className="h-4 w-4 text-purple-400" />
            <span className="line-clamp-1">
              {event.location.name || event.location.city || event.location.address || "Location TBD"}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-purple-400 border-purple-400/50">
                {event.category}
              </Badge>
              <span className="text-lg font-semibold text-green-400">
                {formatPrice(event)}
              </span>
            </div>
            {event.rating && (
              <div className="flex items-center gap-1 text-sm text-yellow-400">
                <span>★</span>
                <span>{event.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {event.url && (
            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              onClick={() => window.open(event.url, '_blank')}
            >
              Get Tickets
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function RealEventsPage() {
  // State
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [viewMode, setViewMode] = useState("grid")
  const { location } = useLocation()

  // Use real events hook
  const {
    events,
    featuredEvents,
    isLoading,
    isFeaturedLoading,
    error,
    totalCount,
    hasMore,
    searchEvents,
    refreshEvents
  } = useRealEvents()

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    let filtered = [...events]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.category.toLowerCase().includes(query) ||
        event.location.city?.toLowerCase().includes(query)
      )
    }

    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(event =>
        event.category.toLowerCase() === selectedCategory.toLowerCase()
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        case "popularity":
          return (b.rating || 0) - (a.rating || 0)
        case "price":
          const priceA = a.price?.min || 0
          const priceB = b.price?.min || 0
          return priceA - priceB
        default:
          return 0
      }
    })

    return filtered
  }, [events, searchQuery, selectedCategory, sortBy])

  // Handle search submission
  const handleSearch = async () => {
    const searchParams: EventSearchParams = {
      keyword: searchQuery,
      location: location.city && location.state ? `${location.city}, ${location.state}` : "United States",
      lat: location.lat,
      lng: location.lng,
      category: selectedCategory !== "all" ? selectedCategory : undefined,
      sortBy: sortBy as "date" | "popularity" | "price" | "distance",
      limit: 50
    }

    await searchEvents(searchParams)
  }

  // Handle filter changes
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      handleSearch()
    }, 500) // Debounce search

    return () => clearTimeout(delayedSearch)
  }, [searchQuery, selectedCategory, sortBy, location])

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-b from-[#0A0B10] via-[#0F1419] to-[#0A0B10] py-8">
        <div className="container mx-auto px-4 space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold text-white"
            >
              Real-Time Events
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-400 text-lg max-w-2xl mx-auto"
            >
              Discover live events from Ticketmaster, Eventbrite, and more sources
            </motion.p>
          </div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#1A1D25]/60 rounded-2xl border border-gray-800/50 p-6 space-y-6"
          >
            {/* Search Bar */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input
                  placeholder="Search events, artists, venues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#0F1116] border-gray-700 text-white"
                />
              </div>
              <Button 
                onClick={handleSearch}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                onClick={refreshEvents}
                className="border-gray-700"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <LocationSelector onLocationChange={() => handleSearch()} />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="bg-[#0F1116] border-gray-700 text-white">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1D25] border-gray-700">
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category.id} value={category.id} className="text-white">
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[150px]">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="bg-[#0F1116] border-gray-700 text-white">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1D25] border-gray-700">
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-white">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Tabs value={viewMode} onValueChange={setViewMode}>
                <TabsList className="bg-[#0F1116]">
                  <TabsTrigger value="grid" className="text-white">
                    <Grid3X3 className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="list" className="text-white">
                    <List className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </motion.div>

          {/* Error State */}
          {error && (
            <Alert className="bg-red-900/20 border-red-500/50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-400">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Featured Events */}
          {!isFeaturedLoading && featuredEvents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Users className="h-6 w-6 text-purple-400" />
                Featured Events
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredEvents.slice(0, 4).map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </motion.div>
          )}

          {/* Events Results */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                All Events ({totalCount.toLocaleString()})
              </h2>
              {hasMore && (
                <Button
                  variant="outline"
                  onClick={() => handleSearch()}
                  className="border-gray-700"
                >
                  Load More
                </Button>
              )}
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto" />
                  <p className="text-gray-400">Loading real events...</p>
                </div>
              </div>
            )}

            {/* Events Grid */}
            {!isLoading && filteredEvents.length > 0 && (
              <div className={`grid gap-6 ${
                viewMode === "grid" 
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "grid-cols-1"
              }`}>
                {filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredEvents.length === 0 && (
              <div className="text-center py-12 space-y-4">
                <AlertCircle className="h-12 w-12 text-gray-500 mx-auto" />
                <h3 className="text-xl font-semibold text-gray-400">No events found</h3>
                <p className="text-gray-500">
                  Try adjusting your search criteria or check back later for new events.
                </p>
                <Button
                  onClick={refreshEvents}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Events
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AppLayout>
  )
}