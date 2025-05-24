"use client"

import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Search, MapPin, Heart, Calendar, Clock } from "lucide-react"
import type { EventDetail } from "@/types/event.types"

interface MapSidebarProps {
  events: EventDetail[]
  selectedEvent: EventDetail | null
  handleEventSelect: (event: EventDetail) => void
  handleViewDetails: (event: EventDetail) => void
  handleToggleFavorite: (id: number) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  locationName: string
  isLoadingEvents: boolean
  locationError: string | null
}

export function MapSidebar({
  events,
  selectedEvent,
  handleEventSelect,
  handleViewDetails,
  handleToggleFavorite,
  searchQuery,
  setSearchQuery,
  locationName,
  isLoadingEvents,
  locationError,
}: MapSidebarProps) {
  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <motion.div
      initial={{ x: -350 }}
      animate={{ x: 0 }}
      exit={{ x: -350 }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="absolute top-0 left-0 bottom-0 w-full md:w-[350px] bg-[#1A1D25]/95 backdrop-blur-md border-r border-gray-800 z-20 overflow-hidden flex flex-col"
    >
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white mb-4">Explore Events</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#22252F] border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
        </div>
      </div>

      {/* Location display */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center">
          <MapPin className="h-4 w-4 text-purple-400 mr-2" />
          <span className="text-gray-300 text-sm">
            {locationError ? "Location unavailable" : locationName || "Loading location..."}
          </span>
        </div>
      </div>

      {/* Events list */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingEvents ? (
          <div className="p-4">
            <div className="text-center text-gray-400">Loading events...</div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-4">
            <div className="text-center text-gray-400">
              {searchQuery ? "No events match your search" : "No events found in this area"}
            </div>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {filteredEvents.map((event) => (
              <motion.div
                key={event.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleEventSelect(event)}
                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedEvent?.id === event.id
                    ? "bg-purple-600/20 border border-purple-500/50"
                    : "bg-[#22252F] hover:bg-[#2A2D37] border border-gray-800"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-white font-medium text-sm line-clamp-2">
                    {event.title}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleFavorite(event.id)
                    }}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Heart className="h-4 w-4" />
                  </button>
                </div>
                
                {event.location && (
                  <div className="flex items-center text-gray-400 text-xs mb-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                )}
                
                {event.date && (
                  <div className="flex items-center text-gray-400 text-xs mb-1">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                  </div>
                )}
                
                {event.time && (
                  <div className="flex items-center text-gray-400 text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{event.time}</span>
                  </div>
                )}
                
                <div className="mt-2 flex justify-between items-center">
                  {event.price && (
                    <span className="text-purple-400 text-sm font-medium">
                      {event.price}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleViewDetails(event)
                    }}
                    className="text-purple-400 hover:text-purple-300 text-xs transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
