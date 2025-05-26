"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Calendar, DollarSign, ExternalLink, Search, Map, List } from "lucide-react"
import type { Event, EventFilters } from "@/types/event.types"
import { unifiedEventsApi } from "@/lib/api/unified-events-api"
import { useDebounce } from "@/hooks/use-debounce"
import { logger } from "@/lib/utils/logger"

interface UnifiedEventsExplorerProps {
  initialLocation?: string
  showMap?: boolean
}

export default function UnifiedEventsExplorer({
  initialLocation = "San Francisco",
  showMap = false,
}: UnifiedEventsExplorerProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"list" | "map">("list")
  const [filters, setFilters] = useState<EventFilters>({
    location: initialLocation,
    category: undefined,
    dateRange: {
      start: new Date().toISOString(),
      end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  })

  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  const categories = [
    "all",
    "music",
    "sports",
    "arts",
    "theater",
    "comedy",
    "family",
    "festivals",
    "food",
    "business",
    "technology",
  ]

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await unifiedEventsApi.fetchEvents(filters)

      if (response.success) {
        setEvents(response.data)
        if (response.errors && response.errors.length > 0) {
          logger.warn("Some event sources failed:", response.errors)
        }
      } else {
        setError(response.error || "Failed to fetch events")
        setEvents([])
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
      setError(errorMessage)
      setEvents([])
      logger.error("Error fetching events:", err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        !debouncedSearchQuery ||
        event.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        event.location.city.toLowerCase().includes(debouncedSearchQuery.toLowerCase())

      const matchesCategory =
        selectedCategory === "all" || event.category.toLowerCase() === selectedCategory.toLowerCase()

      return matchesSearch && matchesCategory
    })
  }, [events, debouncedSearchQuery, selectedCategory])

  const handleLocationChange = useCallback((newLocation: string) => {
    setFilters((prev) => ({ ...prev, location: newLocation }))
  }, [])

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category)
    setFilters((prev) => ({
      ...prev,
      category: category === "all" ? undefined : category,
    }))
  }, [])

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "Date TBD"
    }
  }

  const formatPrice = (price: Event["price"]) => {
    if (!price) return "Free"
    if (price.min === price.max) return `${price.currency}${price.min}`
    return `${price.currency}${price.min} - ${price.currency}${price.max}`
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" onClick={fetchEvents} className="ml-4">
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Discover Events</h1>
        <p className="text-muted-foreground text-lg">Find amazing events happening around you</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search events, venues, or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
              <List className="h-4 w-4 mr-2" />
              List
            </Button>
            {showMap && (
              <Button variant={viewMode === "map" ? "default" : "outline"} size="sm" onClick={() => setViewMode("map")}>
                <Map className="h-4 w-4 mr-2" />
                Map
              </Button>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className="cursor-pointer capitalize"
              onClick={() => handleCategoryChange(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-48 w-full mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Events Grid */}
      {!loading && filteredEvents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video relative">
                <img
                  src={event.image || `/placeholder.svg?height=200&width=300&query=${encodeURIComponent(event.title)}`}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <Badge className="absolute top-2 right-2 capitalize">{event.category}</Badge>
              </div>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">{event.title}</h3>

                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(event.date)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-1">{event.location.name || event.location.city}</span>
                  </div>

                  {event.price && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span>{formatPrice(event.price)}</span>
                    </div>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{event.description}</p>

                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {event.source}
                  </Badge>

                  {event.url && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={event.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        View Details
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && filteredEvents.length === 0 && events.length > 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">No events found</h3>
          <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery("")
              setSelectedCategory("all")
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* No Events at All */}
      {!loading && events.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">No events available</h3>
          <p className="text-muted-foreground mb-4">
            We couldn't find any events for your location. Try a different city or check back later.
          </p>
          <Button onClick={fetchEvents}>Refresh</Button>
        </div>
      )}
    </div>
  )
}
