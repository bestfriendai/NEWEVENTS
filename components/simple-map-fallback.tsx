"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, MapPin, Calendar, Users, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { EventDetailProps } from "@/components/event-detail-modal"

interface SimpleMapFallbackProps {
  events: EventDetailProps[]
  onViewDetails: (event: EventDetailProps) => void
  onToggleFavorite: (eventId: number) => void
}

export function SimpleMapFallback({ events, onViewDetails, onToggleFavorite }: SimpleMapFallbackProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Filter events by category
  const filteredEvents = selectedCategory
    ? events.filter((event) => event.category.toLowerCase() === selectedCategory.toLowerCase())
    : events

  const categories = Array.from(new Set(events.map((event) => event.category)))

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-800 bg-[#1A1D25]/80">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Events List</h2>
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-yellow-400 mr-2" />
            <span className="text-sm text-gray-300">Map view unavailable</span>
          </div>
        </div>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            className={cn(
              "rounded-full px-4 py-2 text-sm whitespace-nowrap",
              selectedCategory === null
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : "border-gray-700 text-gray-300 hover:text-white hover:border-gray-600",
            )}
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category.toLowerCase() ? "default" : "outline"}
              className={cn(
                "rounded-full px-4 py-2 text-sm whitespace-nowrap",
                selectedCategory === category.toLowerCase()
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "border-gray-700 text-gray-300 hover:text-white hover:border-gray-600",
              )}
              onClick={() => setSelectedCategory(category.toLowerCase())}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredEvents.length > 0 ? (
          <>
            {filteredEvents.map((event) => (
              <EventListItem
                key={event.id}
                event={event}
                onViewDetails={() => onViewDetails(event)}
                onToggleFavorite={() => onToggleFavorite(event.id)}
              />
            ))}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-8">
            <div className="text-gray-400 mb-4 text-center">
              <div className="mb-2">
                <Search size={40} className="mx-auto text-gray-600" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">No events found</h3>
              <p>Try adjusting your filters to find events.</p>
            </div>
            <Button
              variant="outline"
              className="border-gray-700 text-gray-300 hover:text-white"
              onClick={() => setSelectedCategory(null)}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// Event list item component
interface EventListItemProps {
  event: EventDetailProps
  onViewDetails: () => void
  onToggleFavorite: () => void
}

function EventListItem({ event, onViewDetails, onToggleFavorite }: EventListItemProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="cursor-pointer rounded-xl overflow-hidden border border-gray-800 bg-[#22252F]/50 hover:border-gray-700"
      onClick={onViewDetails}
    >
      <div className="p-3">
        <div className="flex gap-3">
          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
            <img src={event.image || "/community-event.png"} alt={event.title} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <Badge
                className={cn(
                  "text-xs font-medium border-0 px-2 py-0.5",
                  event.category === "Music"
                    ? "bg-purple-500/20 text-purple-300"
                    : event.category === "Arts"
                      ? "bg-blue-500/20 text-blue-300"
                      : event.category === "Sports"
                        ? "bg-green-500/20 text-green-300"
                        : event.category === "Food"
                          ? "bg-pink-500/20 text-pink-300"
                          : "bg-yellow-500/20 text-yellow-300",
                )}
              >
                {event.category}
              </Badge>
              <motion.button
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleFavorite()
                }}
                className="text-gray-400 hover:text-purple-400 transition-colors duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill={event.isFavorite ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={event.isFavorite ? "text-purple-500" : "text-gray-400"}
                >
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
              </motion.button>
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
              onViewDetails()
            }}
          >
            Details
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
