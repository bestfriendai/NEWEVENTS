"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Heart, Star, Calendar, Users, ZoomIn, ZoomOut, Locate } from "lucide-react"

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
}

interface ImprovedEventsMapProps {
  events: Event[]
  selectedEvent: Event | null
  onEventSelect: (event: Event) => void
  onToggleFavorite: (eventId: string) => void
  favoriteEvents: Set<string>
}

export function ImprovedEventsMap({
  events,
  selectedEvent,
  onEventSelect,
  onToggleFavorite,
  favoriteEvents,
}: ImprovedEventsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [mapStyle, setMapStyle] = useState("streets-v11")

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          // Location access denied - silently handle
        },
      )
    }
  }, [])

  // Simulate map loading
  useEffect(() => {
    const timer = setTimeout(() => setMapLoaded(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  const mapStyles = [
    { id: "streets-v11", name: "Streets" },
    { id: "satellite-v9", name: "Satellite" },
    { id: "outdoors-v11", name: "Outdoors" },
    { id: "dark-v10", name: "Dark" },
  ]

  if (!mapLoaded) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden">
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-10 space-y-2">
        {/* Map Style Selector */}
        <Card className="p-2">
          <div className="flex space-x-1">
            {mapStyles.map((style) => (
              <Button
                key={style.id}
                variant={mapStyle === style.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setMapStyle(style.id)}
                className="text-xs"
              >
                {style.name}
              </Button>
            ))}
          </div>
        </Card>

        {/* Zoom Controls */}
        <div className="flex flex-col space-y-1">
          <Button variant="outline" size="sm">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Locate className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Map Legend */}
      <Card className="absolute top-4 left-4 z-10 p-3">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-xs">Regular Events</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-xs">Featured Events</span>
          </div>
          {userLocation && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs">Your Location</span>
            </div>
          )}
        </div>
      </Card>

      {/* Simulated Map */}
      <div className="w-full h-full bg-gradient-to-br from-blue-50 to-green-50 relative">
        {/* Grid pattern to simulate map */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#000" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Event Markers */}
        {events.map((event, index) => {
          const x = 20 + (index % 8) * 12 + Math.random() * 5
          const y = 20 + Math.floor(index / 8) * 15 + Math.random() * 5

          return (
            <div
              key={event.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 hover:scale-110 ${
                selectedEvent?.id === event.id ? "scale-125 z-20" : "z-10"
              }`}
              style={{ left: `${x}%`, top: `${y}%` }}
              onClick={() => onEventSelect(event)}
            >
              <div
                className={`w-6 h-6 rounded-full border-2 border-white shadow-lg ${
                  event.isFeatured ? "bg-orange-500" : "bg-blue-500"
                }`}
              >
                <MapPin className="w-4 h-4 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>

              {/* Event count for clustered markers */}
              {index % 5 === 0 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {Math.floor(Math.random() * 5) + 2}
                </div>
              )}
            </div>
          )
        })}

        {/* User Location Marker */}
        {userLocation && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-15"
            style={{ left: "50%", top: "50%" }}
          >
            <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
            <div className="absolute inset-0 w-8 h-8 bg-green-500 rounded-full opacity-20 animate-ping"></div>
          </div>
        )}
      </div>

      {/* Selected Event Popup */}
      {selectedEvent && (
        <Card className="absolute bottom-4 left-4 right-4 z-20 max-w-md mx-auto">
          <CardContent className="p-4">
            <div className="flex space-x-4">
              <img
                src={
                  selectedEvent.image ||
                  `/placeholder.svg?height=80&width=80&query=${encodeURIComponent(selectedEvent.title)}`
                }
                alt={selectedEvent.title}
                className="w-20 h-20 object-cover rounded-lg"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg line-clamp-1">{selectedEvent.title}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleFavorite(selectedEvent.id)
                    }}
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        favoriteEvents.has(selectedEvent.id) ? "fill-red-500 text-red-500" : "text-gray-600"
                      }`}
                    />
                  </Button>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(selectedEvent.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{selectedEvent.rating}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-lg">
                    {selectedEvent.price === 0 ? "Free" : `$${selectedEvent.price}`}
                  </span>
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>{selectedEvent.attendees}</span>
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
