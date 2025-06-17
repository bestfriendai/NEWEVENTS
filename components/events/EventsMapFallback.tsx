"use client"

import { MapPin, Calendar, Clock, Tag } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ProcessedEvent {
  event_id: string
  name: string
  category: string
  venue: {
    name: string
    latitude: number
    longitude: number
    full_address?: string
  }
  start_time: string
}

interface EventsMapFallbackProps {
  events: ProcessedEvent[]
  selectedEvent: ProcessedEvent | null
  onEventSelect: (event: ProcessedEvent) => void
}

const CATEGORY_COLORS = {
  Concerts: "#8B5CF6",
  "General Events": "#06B6D4",
  "Day Parties": "#F59E0B",
  "Club Events": "#EF4444",
  Parties: "#10B981",
}

export function EventsMapFallback({ events, selectedEvent, onEventSelect }: EventsMapFallbackProps) {
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

  return (
    <div className="h-full bg-gray-900 text-white p-6 overflow-y-auto">
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">Events in Your Area</h3>
        <p className="text-gray-400">Map view unavailable - showing list view</p>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <h4 className="text-lg font-semibold mb-2">No Events Found</h4>
          <p className="text-gray-400">Try searching in a different location or adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const isSelected = selectedEvent?.event_id === event.event_id
            const categoryColor = CATEGORY_COLORS[event.category as keyof typeof CATEGORY_COLORS] || "#6B7280"

            return (
              <Card
                key={event.event_id}
                className={`cursor-pointer transition-all duration-200 ${
                  isSelected ? "bg-purple-600/20 border-purple-500" : "bg-white/10 border-white/20 hover:bg-white/15"
                }`}
                onClick={() => onEventSelect(event)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-white line-clamp-2 flex-1 mr-3">{event.name}</h4>
                    <Badge
                      className="text-xs shrink-0"
                      style={{
                        backgroundColor: `${categoryColor}20`,
                        color: categoryColor,
                        borderColor: categoryColor,
                      }}
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {event.category}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-purple-400" />
                      <span>{formatDate(event.start_time)}</span>
                    </div>

                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-purple-400" />
                      <span className="line-clamp-1">
                        {event.venue.name}
                        {event.venue.full_address && ` - ${event.venue.full_address}`}
                      </span>
                    </div>

                    {event.venue.latitude && event.venue.longitude && (
                      <div className="flex items-center text-xs text-gray-400">
                        <Clock className="w-3 h-3 mr-2" />
                        <span>
                          Coordinates: {event.venue.latitude.toFixed(4)}, {event.venue.longitude.toFixed(4)}
                        </span>
                      </div>
                    )}
                  </div>

                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-purple-500/30">
                      <p className="text-xs text-purple-300">✓ Selected - View details in the sidebar</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default EventsMapFallback
