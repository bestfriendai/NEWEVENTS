"use client"

/**
 * Infinite Scroll Events Grid Component
 * Optimized for performance with virtual scrolling and intersection observer
 */

import { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import { fetchEvents } from "@/app/actions/event-actions"
import type { EventDetailProps } from "@/components/event-detail-modal"
import { EventCardSkeleton } from "@/components/ui/event-skeleton" // Fixed import path
import { cn } from "@/lib/utils"

interface InfiniteEventsGridProps {
  searchParams: {
    lat?: number
    lng?: number
    radius?: number
    category?: string
    query?: string
    startDate?: string
  }
  onEventSelect: (event: EventDetailProps) => void
  onToggleFavorite: (eventId: number) => void
  favoriteEvents: Set<number>
  className?: string
}

export function InfiniteEventsGrid({
  searchParams,
  onEventSelect,
  onToggleFavorite,
  favoriteEvents,
  className,
}: InfiniteEventsGridProps) {
  const [events, setEvents] = useState<EventDetailProps[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const loader = useRef<HTMLDivElement>(null)

  // Stable reference to search params to prevent infinite re-renders
  const searchParamsRef = useRef(searchParams)
  searchParamsRef.current = searchParams

  // Function to load events - completely stable reference
  const loadEvents = useCallback(async (pageToLoad: number, isNewSearch: boolean = false) => {
    const currentParams = searchParamsRef.current
    if (!currentParams.lat || !currentParams.lng) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await fetchEvents({
        coordinates: { lat: currentParams.lat, lng: currentParams.lng, name: "Current Location" },
        radius: currentParams.radius || 25,
        categories: currentParams.category ? [currentParams.category] : undefined,
        keyword: currentParams.query,
        page: pageToLoad,
        size: 12,
      })

      if (result.error) {
        setError(result.error.message)
      } else {
        // Add coordinates to events for map display and apply client-side content filtering
        const eventsWithCoords = result.events
          .filter((event) => {
            // Client-side content quality check as additional safety
            const hasValidImage = event.image &&
                                 event.image !== "/community-event.png" &&
                                 event.image !== "/placeholder.svg" &&
                                 !event.image.includes("placeholder") &&
                                 !event.image.includes("?height=") &&
                                 !event.image.includes("?text=") &&
                                 event.image.startsWith("http") &&
                                 event.image.length > 20

            const hasValidDescription = event.description &&
                                       event.description.length > 50 &&
                                       event.description !== "No description available" &&
                                       event.description !== "This is a sample event. Please try again later." &&
                                       !event.description.includes("TBA") &&
                                       !event.description.includes("To be announced")

            return hasValidImage && hasValidDescription
          })
          .map((event) => ({
            ...event,
            coordinates: event.coordinates || {
              lat: currentParams.lat! + (Math.random() - 0.5) * 0.1,
              lng: currentParams.lng! + (Math.random() - 0.5) * 0.1,
            },
          }))

        // For new searches, replace events; for pagination, append
        if (isNewSearch || pageToLoad === 0) {
          setEvents(eventsWithCoords)
        } else {
          setEvents((prev) => {
            const existingIds = new Set(prev.map((e) => e.id))
            const newUnique = eventsWithCoords.filter((e) => !existingIds.has(e.id))
            return [...prev, ...newUnique]
          })
        }

        setHasMore(pageToLoad < result.totalPages - 1)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events")
    } finally {
      setIsLoading(false)
    }
  }, []) // Empty dependency array - function is completely stable

  // Track search params changes to trigger reloads
  const prevSearchParamsRef = useRef<string>()

  // Initial load - only reset when search params actually change
  useEffect(() => {
    const currentParamsString = JSON.stringify({
      lat: searchParams.lat,
      lng: searchParams.lng,
      radius: searchParams.radius,
      category: searchParams.category,
      query: searchParams.query
    })

    // Only reload if params actually changed
    if (prevSearchParamsRef.current !== currentParamsString && searchParams.lat && searchParams.lng) {
      prevSearchParamsRef.current = currentParamsString
      setEvents([])
      setPage(0)
      setHasMore(true)
      // Load first page immediately
      loadEvents(0, true)
    }
  }, [searchParams.lat, searchParams.lng, searchParams.radius, searchParams.category, searchParams.query, loadEvents])

  // Intersection observer for infinite scroll
  useEffect(() => {
    const currentLoader = loader.current
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setPage((prevPage) => prevPage + 1)
        }
      },
      { threshold: 1.0 },
    )

    if (currentLoader) {
      observer.observe(currentLoader)
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader)
      }
    }
  }, [hasMore, isLoading])

  // Load events when page changes (for pagination only, not initial load)
  useEffect(() => {
    if (searchParams.lat && searchParams.lng && page > 0) {
      loadEvents(page, false)
    }
  }, [page, loadEvents])

  // Import the EventCard component from the events page
  const EventCard = ({ event, index }: { event: EventDetailProps; index: number }) => {
    const isFavorite = favoriteEvents.has(event.id)

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        whileHover={{ y: -8, scale: 1.02 }}
        className="cursor-pointer group"
        onClick={() => onEventSelect(event)}
      >
        <div className="bg-[#1A1D25]/80 backdrop-blur-md border border-gray-800/50 hover:border-purple-500/50 transition-all duration-300 overflow-hidden rounded-lg group-hover:shadow-2xl group-hover:shadow-purple-500/20">
          <div className="relative h-48 overflow-hidden">
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Category Badge */}
            <div className="absolute top-3 left-3">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs px-2 py-1 rounded-full shadow-lg">
                {event.category || "Event"}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="absolute bottom-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 backdrop-blur-sm border-0 rounded-full flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleFavorite(event.id)
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill={isFavorite ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={isFavorite ? "text-red-500" : "text-white"}
                >
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
              </button>
            </div>

            {/* Price */}
            <div className="absolute bottom-3 left-3">
              <div className="bg-black/70 rounded-full px-3 py-1 backdrop-blur-sm">
                <span className="text-white font-bold text-sm">{event.price || "Free"}</span>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-white text-lg line-clamp-2 group-hover:text-purple-400 transition-colors duration-300">
                {event.title}
              </h3>
            </div>

            <p className="text-gray-400 text-sm mb-4 line-clamp-2">{event.description}</p>

            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 text-purple-400"
                >
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" x2="16" y1="2" y2="6" />
                  <line x1="8" x2="8" y1="2" y2="6" />
                  <line x1="3" x2="21" y1="10" y2="10" />
                </svg>
                <span>{event.date}</span>
              </div>

              <div className="flex items-center text-gray-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 text-purple-400"
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="line-clamp-1">{event.location}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Grid of events */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {events.map((event, index) => (
          <EventCard key={event.id} event={event} index={index} />
        ))}

        {/* Loading skeletons */}
        {isLoading && Array.from({ length: 4 }).map((_, i) => <EventCardSkeleton key={`skeleton-${i}`} />)}
      </div>

      {/* Error message */}
      {error && (
        <div className="text-center my-8 p-4 bg-red-900/20 border border-red-800/50 rounded-lg">
          <p className="text-red-200">{error}</p>
          <button
            className="mt-2 px-4 py-2 bg-red-800/50 hover:bg-red-800/70 text-white rounded-md"
            onClick={() => {
              setPage(0)
              setEvents([])
              setHasMore(true)
              loadEvents(0, true)
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center my-8">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 text-purple-400 animate-spin" />
            <span className="text-gray-400">Loading more events...</span>
          </div>
        </div>
      )}

      {/* End of results message */}
      {!isLoading && !hasMore && events.length > 0 && (
        <div className="text-center my-8">
          <p className="text-gray-400">You've reached the end of the results</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && events.length === 0 && !error && (
        <div className="text-center my-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-900/20 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-purple-400"
            >
              <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No events found</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            We couldn't find any events matching your criteria. Try adjusting your filters or search terms.
          </p>
        </div>
      )}

      {/* Invisible loader element for intersection observer */}
      <div ref={loader} className="h-4" />
    </div>
  )
}
