"use client"

import { useState } from "react"
import { MapPin, Navigation, ZoomIn, ZoomOut, Layers, Maximize2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { EventDetailProps } from "@/components/event-detail-modal"

interface EventsMapProps {
  events: EventDetailProps[]
  userLocation: { lat: number; lng: number; name: string } | null
  selectedEvent?: EventDetailProps | null
  onEventSelect?: (event: EventDetailProps) => void
  onError?: (error: string) => void
  className?: string
}

export default function EventsMap({
  events,
  userLocation,
  selectedEvent,
  onEventSelect,
  onError,
  className,
}: EventsMapProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Deduplicate events by ID to prevent duplicate key errors
  const deduplicatedEvents = events.reduce<EventDetailProps[]>((acc, event) => {
    if (!acc.some((e) => e.id === event.id)) {
      acc.push(event)
    }
    return acc
  }, [])

  // Convert EventDetailProps to the format expected by EventsMapFallback
  const fallbackEvents = deduplicatedEvents.map((event) => ({
    event_id: event.id.toString(),
    name: event.title,
    category: event.category || "General Events",
    venue: {
      name: event.location || "Unknown location",
      latitude: event.coordinates?.lat || 0,
      longitude: event.coordinates?.lng || 0,
      full_address: event.location,
    },
    start_time: event.date || new Date().toISOString(),
  }))

  // Simple grid-based visualization
  const renderSimpleMap = () => {
    return (
      <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-4 overflow-auto">
          {deduplicatedEvents.map((event) => (
            <div
              key={event.id}
              className={cn(
                "relative bg-gray-800/50 rounded-md p-3 flex flex-col justify-between cursor-pointer hover:bg-gray-700/50 transition-colors",
                selectedEvent?.id === event.id && "ring-2 ring-purple-500 bg-gray-700/70",
              )}
              onClick={() => onEventSelect?.(event)}
            >
              {event.image && (
                <div className="w-full h-24 mb-2 overflow-hidden rounded-md">
                  <img
                    src={event.image || "/placeholder.svg"}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="text-sm text-white font-medium truncate">{event.title}</div>
              <div className="flex items-center mt-1">
                <MapPin className="h-3 w-3 text-purple-400 mr-1 flex-shrink-0" />
                <span className="text-xs text-gray-300 truncate">{event.location}</span>
              </div>
              <div className="flex items-center mt-1">
                <span className="text-xs text-purple-400">{event.price || "Free"}</span>
                <span className="text-xs text-gray-400 ml-auto">{event.attendees || 0} attending</span>
              </div>
              {event.isFeatured && (
                <div className="absolute top-1 right-1">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full block"></span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* User location indicator */}
        {userLocation && (
          <div className="absolute bottom-4 left-4 bg-blue-500/20 backdrop-blur-sm p-2 rounded-md">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-xs text-white">{userLocation.name}</span>
            </div>
          </div>
        )}

        {/* Map controls */}
        <div className="absolute top-4 left-4 flex flex-col space-y-2">
          <Button
            variant="secondary"
            size="sm"
            className="bg-black/70 hover:bg-black/80 backdrop-blur-sm border-0 text-white"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="bg-black/70 hover:bg-black/80 backdrop-blur-sm border-0 text-white"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="bg-black/70 hover:bg-black/80 backdrop-blur-sm border-0 text-white"
          >
            <Navigation className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="bg-black/70 hover:bg-black/80 backdrop-blur-sm border-0 text-white"
          >
            <Layers className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="bg-black/70 hover:bg-black/80 backdrop-blur-sm border-0 text-white"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Map Legend */}
        <div className="absolute bottom-4 right-4">
          <Card className="bg-black/70 backdrop-blur-sm border-gray-700">
            <CardContent className="p-3">
              <div className="space-y-2 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-white">Your Location</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"></div>
                  <span className="text-white">Events</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <span className="text-white">Featured</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Events Counter */}
        <div className="absolute top-4 right-4">
          <Badge className="bg-black/70 backdrop-blur-sm text-white border-gray-700">
            <MapPin className="h-3 w-3 mr-1" />
            {deduplicatedEvents.length} events
          </Badge>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative w-full h-full", className, isFullscreen && "fixed inset-0 z-50 bg-black")}>
      {renderSimpleMap()}

      {/* Fullscreen Exit Button */}
      {isFullscreen && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsFullscreen(false)}
          className="absolute top-4 right-16 bg-black/70 hover:bg-black/80 backdrop-blur-sm border-0 text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
