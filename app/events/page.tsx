"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import dynamic from "next/dynamic"
import {
  Filter,
  Grid3X3,
  Map,
  Calendar,
  MapPin,
  Heart,
  Share2,
  Sparkles,
  TrendingUp,
  Clock,
  Navigation,
  SlidersHorizontal,
  X,
  Zap,
  Music,
  Palette,
  Gamepad2,
  Utensils,
  Briefcase,
  GraduationCap,
  AlertCircle,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  List,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AppLayout } from "@/components/app-layout"
import { fetchEvents, getFeaturedEvents } from "@/app/actions/event-actions"
import type { EventDetailProps } from "@/components/event-detail-modal"
import { EventDetailModal } from "@/components/event-detail-modal"
import { LocationSetupScreen } from "@/components/events/LocationSetupScreen"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"

// New advanced components
import { SmartSearchInput } from "@/components/search/SmartSearchInput"
import { InfiniteEventsGrid } from "@/components/events/InfiniteEventsGrid"

// Dynamic import for Mapbox component to avoid SSR issues
const EventsMap = dynamic(() => import("@/components/events/EventsMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-800/50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 text-purple-400 mx-auto mb-3 animate-spin" />
        <p className="text-gray-300">Loading map...</p>
      </div>
    </div>
  ),
})

const categories = [
  { id: "all", label: "All Events", icon: Grid3X3, color: "from-purple-500 to-pink-500" },
  { id: "music", label: "Music", icon: Music, color: "from-purple-600 to-blue-600" },
  { id: "arts", label: "Arts & Culture", icon: Palette, color: "from-pink-600 to-rose-600" },
  { id: "sports", label: "Sports", icon: Gamepad2, color: "from-green-600 to-emerald-600" },
  { id: "food", label: "Food & Drink", icon: Utensils, color: "from-orange-600 to-red-600" },
  { id: "business", label: "Business", icon: Briefcase, color: "from-gray-600 to-slate-600" },
  { id: "education", label: "Education", icon: GraduationCap, color: "from-blue-600 to-cyan-600" },
  { id: "nightlife", label: "Nightlife", icon: Zap, color: "from-yellow-600 to-orange-600" },
]

const sortOptions = [
  { value: "date", label: "Date" },
  { value: "popularity", label: "Popularity" },
  { value: "price", label: "Price" },
  { value: "distance", label: "Distance" },
  { value: "rating", label: "Rating" },
]

interface EventCardProps {
  event: EventDetailProps
  isFavorite: boolean
  onToggleFavorite: () => void
  onShare: () => void
  onClick: () => void
  index?: number
  variant?: "grid" | "list" | "compact"
}

function EventCard({
  event,
  isFavorite,
  onToggleFavorite,
  onShare,
  onClick,
  index = 0,
  variant = "grid",
}: EventCardProps) {
  const category = categories.find((cat) => cat.id === event.category?.toLowerCase()) || categories[0]

  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        whileHover={{ x: 4 }}
        className="cursor-pointer"
        onClick={onClick}
      >
        <Card className="bg-[#1A1D25]/60 backdrop-blur-sm border border-gray-800/30 hover:border-purple-500/50 transition-all duration-300">
          <CardContent className="p-3">
            <div className="flex space-x-3">
              <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                <img
                  src={event.image || "/placeholder.svg?height=64&width=64&text=Event"}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <Badge
                  className={`absolute bottom-0.5 left-0.5 bg-gradient-to-r ${category.color} text-white text-xs px-1 py-0.5`}
                >
                  <category.icon className="h-2 w-2" />
                </Badge>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-white text-sm line-clamp-1">{event.title}</h3>
                  <div className="flex items-center space-x-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleFavorite()
                      }}
                    >
                      <Heart
                        className={`h-3 w-3 ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-red-400"}`}
                      />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-gray-400 mb-1">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1 text-purple-400" />
                    <span className="truncate">{event.date}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1 text-purple-400" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-purple-400 font-semibold text-xs">{event.price}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="cursor-pointer group"
      onClick={onClick}
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
            <Badge className={`bg-gradient-to-r ${category.color} text-white border-0 shadow-lg`}>
              <category.icon className="h-3 w-3 mr-1" />
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
                onToggleFavorite()
              }}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : "text-white"}`} />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 backdrop-blur-sm border-0 rounded-full"
              onClick={(e) => {
                e.stopPropagation()
                onShare()
              }}
            >
              <Share2 className="h-4 w-4 text-white" />
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
              {event.time && (
                <>
                  <Clock className="h-4 w-4 ml-3 mr-1 text-purple-400" />
                  <span>{event.time}</span>
                </>
              )}
            </div>

            <div className="flex items-center text-gray-300">
              <MapPin className="h-4 w-4 mr-2 text-purple-400" />
              <span className="line-clamp-1">{event.location}</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-lg font-semibold text-purple-400">{event.price}</div>
              <div className="flex items-center">
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarImage src={event.organizer?.logo || "/placeholder.svg"} />
                  <AvatarFallback className="text-xs bg-purple-600">{event.organizer?.name?.[0] || "O"}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-gray-400 truncate max-w-20">{event.organizer?.name || "Organizer"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function EventCardSkeleton({ variant = "grid" }: { variant?: "grid" | "list" | "compact" }) {
  if (variant === "compact") {
    return (
      <Card className="bg-[#1A1D25]/60 backdrop-blur-sm border border-gray-800/30">
        <CardContent className="p-3">
          <div className="flex space-x-3">
            <Skeleton className="w-16 h-16 rounded-lg bg-gray-800" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-3/4 bg-gray-800" />
              <Skeleton className="h-3 w-1/2 bg-gray-800" />
              <Skeleton className="h-3 w-2/3 bg-gray-800" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-12 bg-gray-800" />
                <Skeleton className="h-3 w-8 bg-gray-800" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-[#1A1D25]/80 backdrop-blur-md border border-gray-800/50 overflow-hidden">
      <Skeleton className="h-48 w-full bg-gray-800" />
      <CardContent className="p-6">
        <Skeleton className="h-6 w-3/4 mb-2 bg-gray-800" />
        <Skeleton className="h-4 w-full mb-1 bg-gray-800" />
        <Skeleton className="h-4 w-2/3 mb-4 bg-gray-800" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/2 bg-gray-800" />
          <Skeleton className="h-4 w-3/4 bg-gray-800" />
          <div className="flex justify-between pt-2">
            <Skeleton className="h-4 w-1/3 bg-gray-800" />
            <Skeleton className="h-6 w-16 bg-gray-800" />
          </div>
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
  const [currentIndex, setCurrentIndex] = useState(0)
  const itemsPerView = 3

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + itemsPerView >= events.length ? 0 : prev + itemsPerView))
  }

  const prevSlide = () => {
    setCurrentIndex((prev) =>
      prev - itemsPerView < 0 ? Math.max(0, events.length - itemsPerView) : prev - itemsPerView,
    )
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-800/50">
        <div className="text-center">
          <Sparkles className="h-12 w-12 text-purple-400 mx-auto mb-3" />
          <p className="text-gray-300 text-lg font-medium">No featured events available</p>
          <p className="text-gray-500 text-sm">Check back soon for amazing events!</p>
        </div>
      </div>
    )
  }

  const visibleEvents = events.slice(currentIndex, currentIndex + itemsPerView)

  return (
    <div className="relative">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleEvents.map((event, index) => (
          <EventCard
            key={event.id}
            event={event}
            isFavorite={favoriteEvents.has(event.id)}
            onToggleFavorite={() => onToggleFavorite(event.id)}
            onShare={() => {}}
            onClick={() => onEventSelect(event)}
            index={index}
          />
        ))}
      </div>

      {events.length > itemsPerView && (
        <div className="flex justify-center mt-6 space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={prevSlide}
            disabled={currentIndex === 0}
            className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={nextSlide}
            disabled={currentIndex + itemsPerView >= events.length}
            className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

function AdvancedFiltersPanel({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
}: {
  isOpen: boolean
  onClose: () => void
  filters: any
  onFiltersChange: (filters: any) => void
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Filter Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-96 bg-[#12141D]/95 backdrop-blur-md border-l border-gray-800/50 z-50 overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <SlidersHorizontal className="h-6 w-6 text-purple-400 mr-3" />
                  <h2 className="text-xl font-bold text-white">Advanced Filters</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Categories */}
              <div className="mb-8">
                <Label className="text-white text-base font-semibold mb-4 block">Categories</Label>
                <div className="grid grid-cols-2 gap-3">
                  {categories.slice(1).map((category) => {
                    const Icon = category.icon
                    const isSelected = filters.categories?.includes(category.id)
                    return (
                      <Button
                        key={category.id}
                        variant={isSelected ? "default" : "outline"}
                        className={cn(
                          "justify-start h-auto p-3 border-gray-700",
                          isSelected
                            ? `bg-gradient-to-r ${category.color} text-white border-0`
                            : "text-gray-300 hover:text-white hover:bg-gray-800",
                        )}
                        onClick={() => {
                          const newCategories = isSelected
                            ? filters.categories?.filter((c: string) => c !== category.id) || []
                            : [...(filters.categories || []), category.id]
                          onFiltersChange({ ...filters, categories: newCategories })
                        }}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        <span className="text-sm">{category.label}</span>
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => onFiltersChange({})}
                  className="flex-1 border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
                >
                  Clear All
                </Button>
                <Button
                  onClick={onClose}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function EventsPageContent() {
  // Core state
  const [hasLocation, setHasLocation] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; name: string } | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "map" | "infinite">("infinite")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EventDetailProps | null>(null)
  const [favoriteEvents, setFavoriteEvents] = useState<Set<number>>(new Set())
  const [filters, setFilters] = useState({
    priceRange: [0, 500],
    distance: 25,
    dateRange: "all",
    timeOfDay: "all",
    eventType: "all",
  })
  const [mapError, setMapError] = useState<string | null>(null)

  // Legacy state for compatibility
  const [searchQuery, setSearchQuery] = useState("")
  const [events, setEvents] = useState<EventDetailProps[]>([])
  const [featuredEvents, setFeaturedEvents] = useState<EventDetailProps[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isFeaturedLoading, setIsFeaturedLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  const debouncedSearch = useDebounce(searchQuery, 300)

  // SIMPLIFIED: Create stable search parameters
  const searchParams = useMemo(() => {
    if (!userLocation) return {}

    return {
      lat: userLocation.lat,
      lng: userLocation.lng,
      radius: filters.distance,
      category: selectedCategory !== "all" ? selectedCategory : undefined,
      query: debouncedSearch || undefined,
    }
  }, [userLocation, filters.distance, selectedCategory, debouncedSearch])

  // Check if user already has a location set - ONLY RUN ONCE
  useEffect(() => {
    const savedLocation = localStorage.getItem("dateai-user-location")
    if (savedLocation) {
      try {
        const location = JSON.parse(savedLocation)
        setUserLocation(location)
        setHasLocation(true)
      } catch (e) {
        console.error("Invalid saved location:", e)
      }
    }
  }, []) // Empty dependency array - only run once

  // PROGRESSIVE: Load events function with date-based prioritization
  const loadEvents = useCallback(async () => {
    if (!userLocation) return

    setIsLoading(true)
    setError(null)

    try {
      // First, load events for the next week (priority)
      const now = new Date()
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      const weekResult = await fetchEvents({
        keyword: debouncedSearch || undefined,
        coordinates: userLocation,
        radius: filters.distance || 25,
        categories: selectedCategory !== "all" ? [selectedCategory] : undefined,
        page: 0, // Always start from first page for week events
        size: 12, // Smaller initial load
        sort: sortBy,
        startDate: now.toISOString(),
        endDate: nextWeek.toISOString(),
      })

      if (weekResult.error) {
        setError(weekResult.error.message)
        setEvents([])
        return
      }

      // Show week events immediately
      const weekEventsWithCoords = weekResult.events.map((event) => ({
        ...event,
        coordinates: event.coordinates || {
          lat: userLocation.lat + (Math.random() - 0.5) * 0.1,
          lng: userLocation.lng + (Math.random() - 0.5) * 0.1,
        },
      }))

      setEvents(weekEventsWithCoords)
      setTotalCount(weekResult.totalCount)
      setTotalPages(weekResult.totalPages)
      setIsLoading(false) // Show initial results

      // Then load additional events for the next month (background)
      setTimeout(async () => {
        try {
          setIsLoadingMore(true)
          const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

          const monthResult = await fetchEvents({
            keyword: debouncedSearch || undefined,
            coordinates: userLocation,
            radius: filters.distance || 25,
            categories: selectedCategory !== "all" ? [selectedCategory] : undefined,
            page,
            size: 24,
            sort: sortBy,
            startDate: nextWeek.toISOString(), // Start after the week we already loaded
            endDate: nextMonth.toISOString(),
          })

          if (!monthResult.error && monthResult.events.length > 0) {
            const monthEventsWithCoords = monthResult.events.map((event) => ({
              ...event,
              coordinates: event.coordinates || {
                lat: userLocation.lat + (Math.random() - 0.5) * 0.1,
                lng: userLocation.lng + (Math.random() - 0.5) * 0.1,
              },
            }))

            // Merge with existing events, avoiding duplicates
            setEvents(prev => {
              const existingIds = new Set(prev.map(e => e.id))
              const newEvents = monthEventsWithCoords.filter(e => !existingIds.has(e.id))
              return [...prev, ...newEvents]
            })
            setTotalCount(prev => prev + monthResult.totalCount)
          }
        } catch (err) {
          console.warn("Failed to load additional events:", err)
        } finally {
          setIsLoadingMore(false)
        }
      }, 500) // Small delay to show initial results first

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events")
      setEvents([])
      setIsLoading(false)
    }
  }, [userLocation, debouncedSearch, filters.distance, selectedCategory, page, sortBy])

  // SIMPLIFIED: Load featured events
  const loadFeaturedEvents = useCallback(async () => {
    if (!userLocation) return

    setIsFeaturedLoading(true)
    try {
      const featured = await getFeaturedEvents(6)
      const featuredWithCoords = featured.map((event) => ({
        ...event,
        isFeatured: true,
        coordinates: event.coordinates || {
          lat: userLocation.lat + (Math.random() - 0.5) * 0.1,
          lng: userLocation.lng + (Math.random() - 0.5) * 0.1,
        },
      }))
      setFeaturedEvents(featuredWithCoords)
    } catch (err) {
      console.error("Failed to load featured events:", err)
      setFeaturedEvents([])
    } finally {
      setIsFeaturedLoading(false)
    }
  }, [userLocation])

  // OPTIMIZED: Only load events when essential dependencies change
  useEffect(() => {
    if (userLocation) {
      loadEvents()
    }
  }, [loadEvents]) // loadEvents already has the right dependencies

  // OPTIMIZED: Only load featured events when location changes
  useEffect(() => {
    if (userLocation) {
      loadFeaturedEvents()
    }
  }, [loadFeaturedEvents]) // loadFeaturedEvents already has the right dependencies

  const handleLocationSet = useCallback((location: { lat: number; lng: number; name: string }) => {
    setUserLocation(location)
    setHasLocation(true)
    localStorage.setItem("dateai-user-location", JSON.stringify(location))
  }, [])

  const handleLocationChange = useCallback(() => {
    setHasLocation(false)
    setUserLocation(null)
    localStorage.removeItem("dateai-user-location")
  }, [])

  const toggleFavorite = useCallback((eventId: number) => {
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

  const shareEvent = useCallback((event: EventDetailProps) => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: window.location.href + `?event=${event.id}`,
      })
    } else {
      navigator.clipboard.writeText(window.location.href + `?event=${event.id}`)
    }
  }, [])

  // SIMPLIFIED: Filter events based on current filters
  const filteredEvents = useMemo(() => {
    let filtered = events

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (event) =>
          event.title?.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.location?.toLowerCase().includes(query) ||
          event.category?.toLowerCase().includes(query),
      )
    }

    return filtered
  }, [events, searchQuery])

  const handleMapError = useCallback((error: string) => {
    setMapError(error)
  }, [])

  const handleEventSelect = useCallback((event: EventDetailProps) => {
    setSelectedEvent(event)
  }, [])

  if (!hasLocation) {
    return <LocationSetupScreen onLocationSet={handleLocationSet} />
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Page Header */}
      <div className="flex-shrink-0 bg-[#12141D]/80 backdrop-blur-md border-b border-gray-800/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Discover Events
              </h1>
              <p className="text-gray-400 text-sm mt-1">Find amazing experiences near {userLocation?.name}</p>
            </div>
            {!isLoading && !error && (
              <Badge className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-purple-400 border border-purple-500/30">
                <Sparkles className="h-3 w-3 mr-1" />
                {totalCount} events found{isLoadingMore && " (loading more...)"}
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Smart Search */}
            <div className="w-80">
              <SmartSearchInput
                onSearch={(query) => setSearchQuery(query)}
                placeholder="Search events, venues, artists..."
                className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20"
                showInsights={true}
                autoFocus={false}
              />
            </div>

            {/* View Toggle */}
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "grid" | "map" | "infinite")}>
              <TabsList className="bg-gray-800/50 border border-gray-700">
                <TabsTrigger value="grid" className="data-[state=active]:bg-purple-600">
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Grid
                </TabsTrigger>
                <TabsTrigger value="infinite" className="data-[state=active]:bg-purple-600">
                  <List className="h-4 w-4 mr-2" />
                  Infinite
                </TabsTrigger>
                <TabsTrigger value="map" className="data-[state=active]:bg-purple-600">
                  <Map className="h-4 w-4 mr-2" />
                  Map
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Advanced Filters */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(true)}
              className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>

            {/* Location Button */}
            <Button
              variant="outline"
              onClick={handleLocationChange}
              className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <Navigation className="h-4 w-4 mr-2" />
              {userLocation?.name}
            </Button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-4 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex items-center space-x-3">
            {categories.map((category) => {
              const Icon = category.icon
              const isSelected = selectedCategory === category.id
              return (
                <Button
                  key={category.id}
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    "whitespace-nowrap transition-all duration-300",
                    isSelected
                      ? `bg-gradient-to-r ${category.color} text-white border-0 shadow-lg`
                      : "border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800",
                  )}
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
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === "infinite" ? (
          <div className="h-full overflow-y-auto">
            <div className="p-6">
              <InfiniteEventsGrid
                searchParams={searchParams}
                onEventSelect={handleEventSelect}
                onToggleFavorite={toggleFavorite}
                favoriteEvents={favoriteEvents}
                className="w-full"
              />
            </div>
          </div>
        ) : viewMode === "grid" ? (
          <div className="h-full overflow-y-auto">
            <div className="p-6">
              {/* Featured Events Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Featured Events</h2>
                      <p className="text-gray-400 text-sm">Hand-picked experiences you'll love</p>
                    </div>
                  </div>
                </div>

                <FeaturedEventsCarousel
                  events={featuredEvents}
                  isLoading={isFeaturedLoading}
                  onEventSelect={handleEventSelect}
                  onToggleFavorite={toggleFavorite}
                  favoriteEvents={favoriteEvents}
                />
              </div>

              {/* Events Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => <EventCardSkeleton key={i} />)
                  : filteredEvents.map((event, index) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        isFavorite={favoriteEvents.has(event.id)}
                        onToggleFavorite={() => toggleFavorite(event.id)}
                        onShare={() => shareEvent(event)}
                        onClick={() => handleEventSelect(event)}
                        index={index}
                      />
                    ))}
              </div>

              {/* Loading More Indicator */}
              {isLoadingMore && (
                <div className="flex justify-center items-center py-8">
                  <div className="flex items-center space-x-3 text-purple-400">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Loading more events...</span>
                  </div>
                </div>
              )}

              {/* Pagination Controls */}
              {!isLoading && !error && totalPages > 1 && (
                <div className="flex justify-center items-center space-x-4 mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
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
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !error && filteredEvents.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-full flex items-center justify-center">
                    <Calendar className="h-12 w-12 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">No events found</h3>
                  <p className="text-gray-400 mb-6 max-w-md mx-auto">
                    We couldn't find any events matching your criteria. Try adjusting your filters or search terms.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Button
                      onClick={() => {
                        setSearchQuery("")
                        setSelectedCategory("all")
                      }}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      Clear All Filters
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleLocationChange}
                      className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
                    >
                      Change Location
                    </Button>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <Alert className="bg-red-900/20 border-red-800/50 text-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="ml-2">
                    {error}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setError(null)
                        loadEvents()
                      }}
                      className="ml-4 text-red-200 hover:text-red-100"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        ) : (
          /* Map View */
          <div className="h-full flex">
            {/* Events List Sidebar */}
            <div className="w-96 flex-shrink-0 border-r border-gray-800/50 bg-[#1A1D25]/60 backdrop-blur-sm">
              <div className="p-4 border-b border-gray-800/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Events List</h3>
                  <Badge className="bg-purple-600/20 text-purple-400 border border-purple-500/30">
                    {filteredEvents.length} events
                  </Badge>
                </div>
              </div>
              <div className="h-full overflow-y-auto p-4 space-y-3">
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} variant="compact" />)
                  : filteredEvents.map((event, index) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        isFavorite={favoriteEvents.has(event.id)}
                        onToggleFavorite={() => toggleFavorite(event.id)}
                        onShare={() => shareEvent(event)}
                        onClick={() => handleEventSelect(event)}
                        index={index}
                        variant="compact"
                      />
                    ))}
              </div>
            </div>

            {/* Map */}
            <div className="flex-1">
              {mapError ? (
                <div className="h-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 flex items-center justify-center">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Map Error</h3>
                    <p className="text-gray-400 mb-4">{mapError}</p>
                    <Button
                      onClick={() => setMapError(null)}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                </div>
              ) : (
                <EventsMap
                  events={filteredEvents}
                  userLocation={userLocation}
                  selectedEvent={selectedEvent}
                  onEventSelect={handleEventSelect}
                  onError={handleMapError}
                  className="h-full"
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Advanced Filters Panel */}
      <AdvancedFiltersPanel
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Event Detail Modal */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onFavorite={(id) => toggleFavorite(id)}
      />
    </div>
  )
}

export default function EventsPage() {
  return (
    <AppLayout>
      <EventsPageContent />
    </AppLayout>
  )
}
