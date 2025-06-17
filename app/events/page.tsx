"use client"

import { useState, useEffect, useCallback } from "react"
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
import { EventDetailModal } from "@/components/event-detail-modal"
import { fetchEvents, getFeaturedEvents } from "@/app/actions/event-actions"
import type { EventDetailProps } from "@/components/event-detail-modal"

// Categories for filtering
const CATEGORIES = [
  { id: "all", label: "All Events", icon: Grid3X3, color: "from-purple-500 to-pink-500" },
  { id: "music", label: "Music", icon: Grid3X3, color: "from-purple-600 to-blue-600" },
  { id: "arts", label: "Arts & Culture", icon: Grid3X3, color: "from-pink-600 to-rose-600" },
  { id: "sports", label: "Sports", icon: Grid3X3, color: "from-green-600 to-emerald-600" },
  { id: "food", label: "Food & Drink", icon: Grid3X3, color: "from-orange-600 to-red-600" },
  { id: "business", label: "Business", icon: Grid3X3, color: "from-gray-600 to-slate-600" },
  { id: "comedy", label: "Comedy", icon: Grid3X3, color: "from-yellow-600 to-orange-600" },
]

// Sort options
const SORT_OPTIONS = [
  { value: "date", label: "Date" },
  { value: "popularity", label: "Popularity" },
  { value: "price", label: "Price" },
  { value: "distance", label: "Distance" },
]

export default function EventsPage() {
  // State
  const [events, setEvents] = useState<EventDetailProps[]>([])
  const [featuredEvents, setFeaturedEvents] = useState<EventDetailProps[]>([])
  const [filteredEvents, setFilteredEvents] = useState<EventDetailProps[]>([])
  const [selectedEvent, setSelectedEvent] = useState<EventDetailProps | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [viewMode, setViewMode] = useState("grid")
  const [isLoading, setIsLoading] = useState(true)
  const [isFeaturedLoading, setIsFeaturedLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; name: string } | null>(null)
  const [favoriteEvents, setFavoriteEvents] = useState(new Set<number>())
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  // Get user location
  const getUserLocation = useCallback(async () => {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              name: "Current Location",
            })
          },
          (error) => {
            console.warn("Geolocation error:", error)
            // Default to New York if geolocation fails
            setUserLocation({
              lat: 40.7128,
              lng: -74.006,
              name: "New York, NY",
            })
          },
        )
      } else {
        // Default location if geolocation not supported
        setUserLocation({
          lat: 40.7128,
          lng: -74.006,
          name: "New York, NY",
        })
      }
    } catch (error) {
      console.error("Error getting location:", error)
      setUserLocation({
        lat: 40.7128,
        lng: -74.006,
        name: "New York, NY",
      })
    }
  }, [])

  // Load events from API
  const loadEvents = useCallback(async () => {
    if (!userLocation) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await fetchEvents({
        coordinates: userLocation,
        radius: 25,
        categories: selectedCategory !== "all" ? [selectedCategory] : undefined,
        keyword: searchQuery || undefined,
        page,
        size: 24,
        sort: sortBy,
      })

      if (result.error) {
        setError(result.error.message)
        setEvents([])
      } else {
        // Add coordinates to events for potential future use
        const eventsWithCoords = result.events.map((event) => ({
          ...event,
          coordinates: event.coordinates || {
            lat: userLocation.lat + (Math.random() - 0.5) * 0.1,
            lng: userLocation.lng + (Math.random() - 0.5) * 0.1,
          },
        }))

        setEvents(eventsWithCoords)
        setTotalCount(result.totalCount)
        setTotalPages(result.totalPages)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load events"
      setError(errorMessage)
      setEvents([])
    } finally {
      setIsLoading(false)
    }
  }, [userLocation, selectedCategory, searchQuery, page, sortBy])

  // Load featured events
  const loadFeaturedEvents = useCallback(async () => {
    setIsFeaturedLoading(true)
    try {
      const featured = await getFeaturedEvents(6)
      setFeaturedEvents(featured.map((event) => ({ ...event, isFeatured: true })))
    } catch (err) {
      console.error("Failed to load featured events:", err)
      setFeaturedEvents([])
    } finally {
      setIsFeaturedLoading(false)
    }
  }, [])

  // Initialize location and load data
  useEffect(() => {
    getUserLocation()
  }, [getUserLocation])

  // Load events when location or filters change
  useEffect(() => {
    if (userLocation) {
      loadEvents()
    }
  }, [loadEvents])

  // Load featured events
  useEffect(() => {
    loadFeaturedEvents()
  }, [loadFeaturedEvents])

  // Filter events based on search and category
  useEffect(() => {
    let filtered = [...events]

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          event.location.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query) ||
          event.category.toLowerCase().includes(query),
      )
    }

    setFilteredEvents(filtered)
  }, [events, searchQuery])

  // Toggle favorite status
  const handleToggleFavorite = useCallback((eventId: number) => {
    setFavoriteEvents((prev) => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(eventId)) {
        newFavorites.delete(eventId)
      } else {
        newFavorites.add(eventId)
      }
      return newFavorites
    })
  }, [])

  // View event details
  const handleViewDetails = useCallback((event: EventDetailProps) => {
    setSelectedEvent(event)
    setShowDetailModal(true)
  }, [])

  // Retry loading events
  const handleRetry = useCallback(() => {
    setError(null)
    loadEvents()
  }, [loadEvents])

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#0F1116]">
        {/* Page Header */}
        <div className="bg-[#12141D]/80 backdrop-blur-md border-b border-gray-800/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Discover Events
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Find amazing experiences near {userLocation?.name || "your location"}
              </p>
              {!isLoading && !error && (
                <Badge className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-purple-400 border border-purple-500/30 mt-2">
                  {totalCount} events found
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {/* Search Input */}
              <div className="w-80">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-800/50 border-gray-700 text-white"
                  />
                </div>
              </div>

              {/* View Toggle */}
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value)}>
                <TabsList className="bg-gray-800/50 border border-gray-700">
                  <TabsTrigger value="grid" className="data-[state=active]:bg-purple-600">
                    <Grid3X3 className="h-4 w-4 mr-2" />
                    Grid
                  </TabsTrigger>
                  <TabsTrigger value="list" className="data-[state=active]:bg-purple-600">
                    <List className="h-4 w-4 mr-2" />
                    List
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Refresh Button */}
              <Button
                variant="outline"
                onClick={handleRetry}
                disabled={isLoading}
                className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center space-x-4 overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex items-center space-x-3">
              {CATEGORIES.map((category) => {
                const Icon = category.icon
                const isSelected = selectedCategory === category.id
                return (
                  <Button
                    key={category.id}
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`whitespace-nowrap transition-all duration-300 ${
                      isSelected
                        ? `bg-gradient-to-r ${category.color} text-white border-0 shadow-lg`
                        : "border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {category.label}
                  </Button>
                )
              })}
            </div>

            <div className="flex items-center space-x-3 ml-auto">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 bg-gray-800/50 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Error State */}
          {error && (
            <Alert className="bg-red-900/20 border-red-800/50 text-red-200 mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2">
                {error}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRetry}
                  className="ml-4 text-red-200 hover:text-red-100"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Featured Events Section */}
          {!isLoading && !error && featuredEvents.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Featured Events</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredEvents.slice(0, 3).map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="cursor-pointer group"
                    onClick={() => handleViewDetails(event)}
                  >
                    <Card className="bg-[#1A1D25]/80 backdrop-blur-md border border-gray-800/50 hover:border-purple-500/50 transition-all duration-300 overflow-hidden group-hover:shadow-2xl group-hover:shadow-purple-500/20">
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={event.image || "/placeholder.svg?height=200&width=300&text=Event"}
                          alt={event.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <Badge className="absolute top-3 left-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg">
                          Featured
                        </Badge>
                        <div className="absolute bottom-3 left-3">
                          <div className="bg-black/70 rounded-full px-3 py-1 backdrop-blur-sm">
                            <span className="text-white font-bold text-sm">{event.price}</span>
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-bold text-white text-lg line-clamp-2 group-hover:text-purple-400 transition-colors duration-300">
                          {event.title}
                        </h3>
                        <div className="flex items-center text-gray-300 mt-2">
                          <Calendar className="h-4 w-4 mr-2 text-purple-400" />
                          <span>{event.date}</span>
                        </div>
                        <div className="flex items-center text-gray-300 mt-1">
                          <MapPin className="h-4 w-4 mr-2 text-purple-400" />
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 text-purple-400 mx-auto mb-3 animate-spin" />
                <p className="text-gray-300">Loading events...</p>
              </div>
            </div>
          )}

          {/* Events Grid/List */}
          {!isLoading && !error && (
            <>
              {/* Grid View */}
              {viewMode === "grid" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      whileHover={{ y: -8, scale: 1.02 }}
                      className="cursor-pointer group"
                      onClick={() => handleViewDetails(event)}
                    >
                      <Card className="bg-[#1A1D25]/80 backdrop-blur-md border border-gray-800/50 hover:border-purple-500/50 transition-all duration-300 overflow-hidden group-hover:shadow-2xl group-hover:shadow-purple-500/20">
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={event.image || "/placeholder.svg?height=200&width=300&text=Event"}
                            alt={event.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                          {/* Category Badge */}
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 shadow-lg">
                              {event.category}
                            </Badge>
                          </div>

                          {/* Action Buttons */}
                          <div className="absolute bottom-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 backdrop-blur-sm border-0 rounded-full"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToggleFavorite(event.id)
                              }}
                            >
                              <Heart
                                className={`h-4 w-4 ${
                                  favoriteEvents.has(event.id) ? "fill-red-500 text-red-500" : "text-white"
                                }`}
                              />
                            </Button>
                          </div>

                          {/* Price */}
                          <div className="absolute bottom-3 left-3">
                            <div className="bg-black/70 rounded-full px-3 py-1 backdrop-blur-sm">
                              <span className="text-white font-bold text-sm">{event.price}</span>
                            </div>
                          </div>
                        </div>

                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-bold text-white text-lg line-clamp-2 group-hover:text-purple-400 transition-colors duration-300">
                              {event.title}
                            </h3>
                          </div>

                          <p className="text-gray-400 text-sm mb-4 line-clamp-2">{event.description}</p>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center text-gray-300">
                              <Calendar className="h-4 w-4 mr-2 text-purple-400" />
                              <span>{event.date}</span>
                            </div>

                            <div className="flex items-center text-gray-300">
                              <MapPin className="h-4 w-4 mr-2 text-purple-400" />
                              <span className="line-clamp-1">{event.location}</span>
                            </div>

                            {event.attendees && (
                              <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center">
                                  <Users className="h-4 w-4 mr-1 text-purple-400" />
                                  <span className="text-gray-400">{event.attendees.toLocaleString()} attending</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* List View */}
              {viewMode === "list" && (
                <div className="space-y-4">
                  {filteredEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={{ x: 4 }}
                      className="cursor-pointer"
                      onClick={() => handleViewDetails(event)}
                    >
                      <Card className="bg-[#1A1D25]/60 backdrop-blur-sm border border-gray-800/30 hover:border-purple-500/50 transition-all duration-300">
                        <CardContent className="p-4">
                          <div className="flex space-x-4">
                            <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                              <img
                                src={event.image || "/placeholder.svg?height=96&width=96&text=Event"}
                                alt={event.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                              <Badge className="absolute bottom-1 left-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs px-1.5 py-0.5 border-0">
                                {event.category}
                              </Badge>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-1">
                                <h3 className="font-semibold text-white text-lg line-clamp-1">{event.title}</h3>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleToggleFavorite(event.id)
                                  }}
                                >
                                  <Heart
                                    className={`h-4 w-4 ${
                                      favoriteEvents.has(event.id) ? "fill-red-500 text-red-500" : "text-gray-400"
                                    }`}
                                  />
                                </Button>
                              </div>

                              <p className="text-gray-400 text-sm mb-2 line-clamp-1">{event.description}</p>

                              <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
                                <div className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1 text-purple-400" />
                                  <span className="truncate">{event.date}</span>
                                </div>
                                <div className="flex items-center">
                                  <MapPin className="h-3 w-3 mr-1 text-purple-400" />
                                  <span className="truncate">{event.location}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between mt-2">
                                <span className="text-purple-400 font-semibold">{event.price}</span>
                                {event.attendees && (
                                  <div className="flex items-center text-gray-500">
                                    <Users className="h-3 w-3 mr-1" />
                                    <span>{event.attendees.toLocaleString()}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {filteredEvents.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-full flex items-center justify-center">
                    <Calendar className="h-12 w-12 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">No events found</h3>
                  <p className="text-gray-400 mb-6 max-w-md mx-auto">
                    We couldn't find any events matching your criteria. Try adjusting your search or filters.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Button
                      onClick={() => {
                        setSearchQuery("")
                        setSelectedCategory("all")
                      }}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      Clear Filters
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleRetry}
                      className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
                    >
                      Refresh Events
                    </Button>
                  </div>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-4 mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
                  >
                    Previous
                  </Button>

                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">
                      Page {page + 1} of {totalPages}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                    className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Event Detail Modal */}
      {showDetailModal && selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          onFavorite={handleToggleFavorite}
        />
      )}
    </AppLayout>
  )
}
