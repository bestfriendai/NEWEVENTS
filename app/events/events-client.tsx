"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, Calendar, Loader2, AlertCircle, RefreshCw, MapPin, Map } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { EventDetailModal } from "@/components/event-detail-modal"
import { EnhancedMapExplorer } from "@/components/enhanced-map-explorer"
import { fetchEvents } from "@/app/actions/event-actions"
import type { EventDetailProps } from "@/components/event-detail-modal"

function EventCard({ event, onViewDetails }: { event: EventDetailProps; onViewDetails: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-[#1A1D25] rounded-xl overflow-hidden border border-gray-800/50 hover:border-purple-500/50 transition-all duration-300"
    >
      <div className="aspect-video bg-gradient-to-br from-purple-900/20 to-indigo-900/20 flex items-center justify-center">
        <img
          src={event.image || "/placeholder.svg?height=200&width=300&text=" + encodeURIComponent(event.title)}
          alt={event.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = "/placeholder.svg?height=200&width=300&text=" + encodeURIComponent(event.title)
          }}
        />
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              event.category === "Music"
                ? "bg-purple-500/20 text-purple-300"
                : event.category === "Arts"
                  ? "bg-blue-500/20 text-blue-300"
                  : event.category === "Sports"
                    ? "bg-green-500/20 text-green-300"
                    : event.category === "Food"
                      ? "bg-pink-500/20 text-pink-300"
                      : "bg-yellow-500/20 text-yellow-300"
            }`}
          >
            {event.category}
          </span>
          <span className="text-purple-400 font-semibold">{event.price}</span>
        </div>

        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">{event.title}</h3>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{event.description}</p>

        <div className="space-y-2 text-sm text-gray-400">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-purple-400" />
            <span>
              {event.date} • {event.time}
            </span>
          </div>
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-purple-400" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-gray-500">{event.attendees} attending</span>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={onViewDetails}>
              View Details
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function EventsClient() {
  const [events, setEvents] = useState<EventDetailProps[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEvent, setSelectedEvent] = useState<EventDetailProps | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid")
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [location, setLocation] = useState("New York")

  const addDebugInfo = (info: string) => {
    setDebugInfo((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${info}`])
    console.log(info)
  }

  const loadEvents = async (searchLocation?: string, keyword?: string) => {
    try {
      setLoading(true)
      setError(null)
      addDebugInfo(`Starting to load events for location: ${searchLocation || location}`)

      const searchParams = {
        location: searchLocation || location,
        keyword: keyword || searchQuery || "events",
        size: 50,
      }

      addDebugInfo(`Calling fetchEvents with params: ${JSON.stringify(searchParams)}`)

      const result = await fetchEvents(searchParams)

      addDebugInfo(`API response received. Success: ${!result.error}`)

      if (result.error) {
        throw new Error(result.error)
      }

      if (result.events && result.events.length > 0) {
        addDebugInfo(`Successfully loaded ${result.events.length} events`)
        setEvents(result.events)
      } else {
        addDebugInfo("No events returned from API")
        setEvents([])
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      addDebugInfo(`Error loading events: ${errorMessage}`)
      setError(errorMessage)
      console.error("Error loading events:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    addDebugInfo("Component mounted, loading events...")
    loadEvents()
  }, [])

  const handleSearch = () => {
    addDebugInfo(`Searching for: "${searchQuery}" in location: "${location}"`)
    loadEvents(location, searchQuery)
  }

  const handleLocationChange = (newLocation: string) => {
    setLocation(newLocation)
    addDebugInfo(`Location changed to: ${newLocation}`)
    loadEvents(newLocation, searchQuery)
  }

  const handleEventClick = (event: EventDetailProps) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const filteredEvents = events.filter(
    (event) =>
      searchQuery === "" ||
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1116] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400 mb-4">Loading events from RapidAPI...</p>
          <div className="text-xs text-gray-600 max-w-md">
            {debugInfo.slice(-3).map((info, index) => (
              <div key={index}>{info}</div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0F1116] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Unable to Load Events</h2>
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => loadEvents()} className="bg-purple-600 hover:bg-purple-700 mb-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <details className="text-left">
            <summary className="text-sm text-gray-400 cursor-pointer">Debug Info</summary>
            <div className="text-xs text-gray-600 mt-2 space-y-1 max-h-32 overflow-y-auto">
              {debugInfo.map((info, index) => (
                <div key={index}>{info}</div>
              ))}
            </div>
          </details>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F1116]">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl font-bold text-white mb-4">Discover Events</h1>
            <p className="text-gray-400 text-lg mb-6">Find amazing events happening around you</p>

            {/* Search Controls */}
            <div className="space-y-4">
              {/* Location Input */}
              <div className="flex gap-4 max-w-2xl">
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="Enter location (e.g., New York, Los Angeles)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleLocationChange(location)}
                    className="pl-10 bg-[#1A1D25]/60 border-gray-700 text-white placeholder-gray-400"
                  />
                </div>
                <Button onClick={() => handleLocationChange(location)} className="bg-indigo-600 hover:bg-indigo-700">
                  Update Location
                </Button>
              </div>

              {/* Search Input */}
              <div className="flex gap-4 max-w-2xl">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10 bg-[#1A1D25]/60 border-gray-700 text-white placeholder-gray-400"
                  />
                </div>
                <Button onClick={handleSearch} className="bg-purple-600 hover:bg-purple-700">
                  Search
                </Button>
              </div>

              {/* View Mode Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid" ? "bg-purple-600 hover:bg-purple-700" : ""}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Grid View
                </Button>
                <Button
                  variant={viewMode === "map" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("map")}
                  className={viewMode === "map" ? "bg-purple-600 hover:bg-purple-700" : ""}
                >
                  <Map className="h-4 w-4 mr-2" />
                  Map View
                </Button>
              </div>
            </div>

            {/* Debug Info */}
            {process.env.NODE_ENV === "development" && (
              <details className="mt-4">
                <summary className="text-sm text-gray-400 cursor-pointer">
                  Debug Info ({debugInfo.length} entries)
                </summary>
                <div className="text-xs text-gray-600 mt-2 space-y-1 max-h-32 overflow-y-auto">
                  {debugInfo.map((info, index) => (
                    <div key={index}>{info}</div>
                  ))}
                </div>
              </details>
            )}
          </motion.div>
        </div>
      </div>

      {/* Content */}
      {viewMode === "map" ? (
        <div className="h-[calc(100vh-16rem)]">
          <EnhancedMapExplorer events={filteredEvents} />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                {searchQuery ? "No Events Found" : "No Events Available"}
              </h3>
              <p className="text-gray-500">
                {searchQuery
                  ? "Try adjusting your search criteria or location"
                  : "Try searching for events in a different location"}
              </p>
              <Button onClick={() => loadEvents()} className="mt-4 bg-purple-600 hover:bg-purple-700">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Events
              </Button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} onViewDetails={() => handleEventClick(event)} />
              ))}
            </motion.div>
          )}
        </div>
      )}

      {/* Footer Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="text-center text-sm text-gray-500">
          Showing {filteredEvents.length} of {events.length} events in {location}
          {searchQuery && ` for "${searchQuery}"`}
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedEvent(null)
          }}
        />
      )}
    </div>
  )
}
