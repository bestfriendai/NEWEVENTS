"use client"

import type React from "react"

import { useState } from "react"
import { Search, MapPin, Calendar, Users, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { EventDetailModal } from "@/components/event-detail-modal"
import type { EventDetailProps } from "@/components/event-detail-modal"

interface SimpleMapFallbackProps {
  events: EventDetailProps[]
  onViewDetails: (event: EventDetailProps) => void
  onToggleFavorite: (eventId: number) => void
}

export function SimpleMapFallback({ events, onViewDetails, onToggleFavorite }: SimpleMapFallbackProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredEvents, setFilteredEvents] = useState(events)
  const [selectedEvent, setSelectedEvent] = useState<EventDetailProps | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim() === "") {
      setFilteredEvents(events)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = events.filter(
      (event) =>
        event.title.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.category.toLowerCase().includes(query),
    )
    setFilteredEvents(filtered)
  }

  // View event details
  const handleViewDetails = (event: EventDetailProps) => {
    setSelectedEvent(event)
    setShowDetailModal(true)
  }

  return (
    <div className="bg-[#1A1D25] rounded-xl border border-gray-800 p-4 h-full flex flex-col">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Events List</h2>
          <Badge variant="outline" className="bg-yellow-600/20 text-yellow-300 border-yellow-800">
            Map Unavailable
          </Badge>
        </div>
        <p className="text-gray-400 text-sm mb-4">
          The interactive map is currently unavailable. Please use the list view to explore events.
        </p>
        <form onSubmit={handleSearch} className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#22252F] border-gray-800 rounded-lg text-white"
          />
          <Button
            type="submit"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-purple-600 hover:bg-purple-700 text-white h-7 px-3"
          >
            Search
          </Button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        {filteredEvents.length > 0 ? (
          <div className="space-y-3">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="bg-[#22252F] rounded-lg p-3 border border-gray-800 hover:border-gray-700 cursor-pointer transition-colors"
                onClick={() => handleViewDetails(event)}
              >
                <div className="flex gap-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={event.image || "/community-event.png"}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <Badge
                        className={`text-xs font-medium border-0 px-2 py-0.5 ${
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
                      </Badge>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleFavorite(event.id)
                        }}
                        className="text-gray-400 hover:text-purple-400 transition-colors duration-200"
                      >
                        <Star
                          size={14}
                          fill={event.isFavorite ? "currentColor" : "none"}
                          className={event.isFavorite ? "text-purple-500" : "text-gray-400"}
                        />
                      </button>
                    </div>
                    <h3 className="font-medium text-gray-200 text-sm truncate">{event.title}</h3>
                    <div className="flex items-center text-xs text-gray-400 mt-1">
                      <Calendar size={10} className="mr-1 text-purple-400 flex-shrink-0" />
                      <span className="truncate">{event.date}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-400 mt-1">
                      <MapPin size={10} className="mr-1 text-purple-400 flex-shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-800/50">
                  <div className="flex items-center text-xs text-gray-400">
                    <Users size={10} className="mr-1" />
                    <span className="text-purple-400 font-medium">{event.attendees}</span> attending
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-900/20"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleViewDetails(event)
                    }}
                  >
                    Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-8">
            <div className="text-gray-400 mb-4 text-center">
              <div className="mb-2">
                <Search size={40} className="mx-auto text-gray-600" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">No events found</h3>
              <p>Try adjusting your search to find events.</p>
            </div>
            <Button
              variant="outline"
              className="border-gray-700 text-gray-300 hover:text-white"
              onClick={() => {
                setSearchQuery("")
                setFilteredEvents(events)
              }}
            >
              Clear Search
            </Button>
          </div>
        )}
      </div>

      {/* Event detail modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          onToggleFavorite={() => onToggleFavorite(selectedEvent.id)}
        />
      )}
    </div>
  )
}
