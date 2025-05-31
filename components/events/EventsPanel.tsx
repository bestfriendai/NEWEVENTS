"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, MapPin, Navigation, Filter, Calendar, X, Heart, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { EventCard } from "@/components/event-card"
import { EventFilters } from "@/components/events/EventFilters"
import type { EventDetailProps } from "@/components/event-detail-modal"
import type { EventFilters as EventFiltersType } from "@/components/events/EventFilters"
import Image from "next/image"
import { Badge } from "../ui/badge"

// Use EventDetailProps to match existing types
type EventDetail = EventDetailProps

interface EventsPanelProps {
  events: EventDetail[]
  isLoadingEvents: boolean
  isLoadingLocation: boolean
  selectedEvent: EventDetail | null
  onEventSelect: (event: EventDetail) => void
  onToggleFavorite: (eventId: number) => void
  onLocationSearch: (query: string) => void
  onUseCurrentLocation: () => void
  locationName: string
  apiError: string | null
  onClearSelectedEvent: () => void
}

export function EventsPanel({
  events,
  isLoadingEvents,
  isLoadingLocation,
  selectedEvent,
  onEventSelect,
  onToggleFavorite,
  onLocationSearch,
  onUseCurrentLocation,
  locationName,
  apiError,
  onClearSelectedEvent,
}: EventsPanelProps) {
  const [locationQuery, setLocationQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [activeFilters, setActiveFilters] = useState<EventFiltersType>({
    categories: [],
    dateRange: null,
    priceRange: { min: 0, max: 500 },
    distance: 50,
    searchQuery: "",
    sortBy: "date",
    sortOrder: "asc",
  })

  const handleSearch = () => {
    if (locationQuery.trim()) {
      onLocationSearch(locationQuery)
      setLocationQuery("") // Clear input after search
    }
  }

  const sortedEvents = [...events].sort((a, b) => {
    try {
      // Make sure date and time are valid before creating Date objects
      const dateA = new Date(`${a.date || new Date().toLocaleDateString()} ${a.time || "00:00"}`)
      const dateB = new Date(`${b.date || new Date().toLocaleDateString()} ${b.time || "00:00"}`)
      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0 // handle invalid dates
      return dateA.getTime() - dateB.getTime()
    } catch (e) {
      return 0 // Fallback for parsing errors
    }
  })

  const renderLocationSearch = () => (
    <div className="p-4 space-y-3">
      <h2 className="text-lg font-semibold text-white">Find Events</h2>
      <div className="flex gap-2">
        <Input
          placeholder="Enter city, zip, or address"
          value={locationQuery}
          onChange={(e) => setLocationQuery(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          className="bg-gray-800 border-gray-700 text-white"
        />
        <Button onClick={handleSearch} disabled={isLoadingLocation} className="bg-purple-600 hover:bg-purple-700">
          <Search className="h-4 w-4" />
        </Button>
      </div>
      <Button
        onClick={onUseCurrentLocation}
        variant="outline"
        className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
        disabled={isLoadingLocation}
      >
        <Navigation className="h-4 w-4 mr-2" />
        Use My Current Location
      </Button>
      {locationName && locationName !== "United States" && !selectedEvent && (
        <p className="text-sm text-center text-purple-400">Showing events for: {locationName}</p>
      )}
    </div>
  )

  const renderEventList = () => (
    <>
      <div className="p-4 border-b border-gray-700">
        {renderLocationSearch()}
        <div className="mt-3 flex justify-between items-center">
          <h3 className="text-md font-medium text-white">
            {isLoadingEvents ? "Loading events..." : `${sortedEvents.length} events found`}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="text-gray-400 hover:text-white"
          >
            <Filter className="h-4 w-4 mr-1" /> Filters
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {isLoadingEvents ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-gray-800 p-3 rounded-lg animate-pulse h-24"></div>
            ))
          ) : sortedEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="h-10 w-10 mx-auto mb-2" />
              <p>No events found for {locationName}.</p>
              <p>Try a different location or adjust filters.</p>
            </div>
          ) : (
            sortedEvents.map((event, index) => (
              <EventCard
                key={event.id || index}
                event={event}
                onViewDetails={() => onEventSelect(event)}
                onToggleFavorite={() => onToggleFavorite(event.id)}
                variant="compact"
              />
            ))
          )}
        </div>
      </ScrollArea>
    </>
  )

  const renderEventDetails = (event: EventDetail) => (
    <>
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Event Details</h2>
        <Button variant="ghost" size="icon" onClick={onClearSelectedEvent} className="text-gray-400 hover:text-white">
          <X className="h-5 w-5" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {event.image && (
            <div className="relative h-48 w-full rounded-lg overflow-hidden">
              <Image
                src={event.image || "/placeholder.svg"}
                alt={event.title}
                fill
                className="object-cover"
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg?height=200&width=400&text=Event+Image"
                }}
              />
            </div>
          )}
          <h3 className="text-xl font-bold text-white">{event.title}</h3>
          <Badge variant="outline" className="border-purple-500 text-purple-400">
            {event.category}
          </Badge>

          <div className="flex items-center text-sm text-gray-400">
            <Calendar className="h-4 w-4 mr-2 text-purple-400" /> {event.date}
          </div>
          <div className="flex items-center text-sm text-gray-400">
            <Clock className="h-4 w-4 mr-2 text-purple-400" /> {event.time}
          </div>
          <div className="flex items-center text-sm text-gray-400">
            <MapPin className="h-4 w-4 mr-2 text-purple-400" /> {event.location}
          </div>
          {event.address && <p className="text-sm text-gray-500 pl-6">{event.address}</p>}

          <p className="text-sm text-gray-300 leading-relaxed">{event.description}</p>

          <div className="flex items-center justify-between text-sm">
            <div className="text-lg font-semibold text-purple-400">{event.price}</div>
          </div>

          {event.ticketLinks && event.ticketLinks.length > 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="text-sm font-medium text-white">Tickets</h4>
              {event.ticketLinks.map((link, i) => (
                <Button key={i} variant="link" asChild className="p-0 h-auto text-purple-400 hover:text-purple-300">
                  <a href={link.link || "#"} target="_blank" rel="noopener noreferrer">
                    {link.source}
                  </a>
                </Button>
              ))}
            </div>
          )}

          <Button
            onClick={() => onToggleFavorite(event.id)}
            variant="outline"
            className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <Heart className={`h-4 w-4 mr-2 ${event.isFavorite ? "fill-red-500 text-red-500" : ""}`} />
            {event.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
          </Button>
        </div>
      </ScrollArea>
    </>
  )

  return (
    <motion.div
      className="w-full md:w-[400px] bg-[#12141D] border-l border-gray-700 flex flex-col h-full shadow-2xl"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {apiError && (
        <div className="p-4 bg-red-900/30 text-red-400 border-b border-red-700">
          <p>Error: {apiError}</p>
        </div>
      )}
      <AnimatePresence mode="wait">
        {selectedEvent ? (
          <motion.div
            key="details"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full"
          >
            {renderEventDetails(selectedEvent)}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full"
          >
            {renderEventList()}
          </motion.div>
        )}
      </AnimatePresence>

      {showFilters && (
        <div className="absolute inset-0 bg-gray-900/80 z-10 p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Filters</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <EventFilters
            filters={activeFilters}
            onFiltersChange={setActiveFilters}
            isOpen={true}
            onToggle={() => setShowFilters(false)}
          />
        </div>
      )}
    </motion.div>
  )
}
