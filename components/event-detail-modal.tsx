"use client"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Heart, ExternalLink } from "lucide-react"
import { EventMap } from "@/components/event-map"

// EventDetailProps interface definition
export interface EventDetailProps {
  id: number
  title: string
  description: string
  date: string
  time: string
  location: string
  address: string
  category: string
  price: string
  image?: string
  attendees?: number
  organizer: {
    name: string
    description?: string
    website?: string
    logo?: string
  }
  ticketLinks?: Array<{
    source: string
    link: string
    price?: string
  }>
  isFavorite?: boolean
  coordinates?: {
    lat: number
    lng: number
  }
}

interface EventDetailModalProps {
  event: EventDetailProps | null
  isOpen: boolean
  onClose: () => void
  onFavorite: (id: number) => void
}

export function EventDetailModal({ event, isOpen, onClose, onFavorite }: EventDetailModalProps) {
  const [showFullDescription, setShowFullDescription] = useState(false)

  const toggleDescription = () => {
    setShowFullDescription(!showFullDescription)
  }

  // If no event is provided, don't render the content
  if (!event) {
    return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] p-6 bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle>Event details</DialogTitle>
          <DialogDescription>Loading event information...</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] p-0 overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        {/* Hero Image Section */}
        <div className="relative h-56 overflow-hidden">
          <Image
            src={event.image || "/community-event.png"}
            alt={event.title}
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 700px) 100vw, 700px"
            className="transition-transform duration-300 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

          {/* Favorite Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20 backdrop-blur-sm border border-white/20"
            onClick={() => onFavorite(event.id)}
          >
            <Heart className={`h-5 w-5 ${event.isFavorite ? "fill-red-500 text-red-500" : ""}`} />
          </Button>

          {/* Event Title Overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <h1 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">{event.title}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                {event.category}
              </Badge>
              <span className="text-white/90 text-sm">{event.organizer.name}</span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="overflow-y-auto max-h-[calc(90vh-14rem)]">
          <div className="p-6 space-y-6">

            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{event.date}</div>
                  <div className="text-xs text-gray-500">Date</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{event.time}</div>
                  <div className="text-xs text-gray-500">Time</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <MapPin className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{event.location}</div>
                  <div className="text-xs text-gray-500">Venue</div>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-300">{event.address}</div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">About this event</h3>
              <div className={`text-gray-600 dark:text-gray-300 leading-relaxed ${showFullDescription ? "" : "line-clamp-4"}`}>
                {event.description}
              </div>
              {event.description && event.description.length > 200 && (
                <Button
                  variant="link"
                  className="p-0 h-auto text-purple-600 hover:text-purple-700"
                  onClick={toggleDescription}
                >
                  {showFullDescription ? "Show less" : "Read more"}
                </Button>
              )}
            </div>

            {/* Ticket Links */}
            {event.ticketLinks && event.ticketLinks.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Get Tickets</h3>
                <div className="grid gap-2">
                  {event.ticketLinks.slice(0, 3).map((link, i) => (
                    <a
                      key={i}
                      href={link.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-purple-600" />
                        <span className="font-medium text-gray-900 dark:text-white">{link.source}</span>
                      </div>
                      {link.price && (
                        <span className="text-sm text-gray-600 dark:text-gray-300">{link.price}</span>
                      )}
                    </a>
                  ))}
                  {event.ticketLinks.length > 3 && (
                    <div className="text-sm text-gray-500 text-center py-2">
                      +{event.ticketLinks.length - 3} more ticket options
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Location Map */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Location</h3>
              <div className="h-[250px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <EventMap event={event} />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex-1">
                <div className="text-2xl font-bold text-purple-600">{event.price}</div>
                <div className="text-sm text-gray-500">Price</div>
              </div>

              <div className="flex gap-2">
                {event.ticketLinks && event.ticketLinks.length > 0 ? (
                  <a
                    href={event.ticketLinks[0]?.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-lg bg-purple-600 hover:bg-purple-700 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Get Tickets
                  </a>
                ) : (
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3">
                    RSVP
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="px-6 py-3 border-gray-300 dark:border-gray-600"
                  onClick={() => onFavorite(event.id)}
                >
                  <Heart className={`h-4 w-4 mr-2 ${event.isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                  {event.isFavorite ? "Saved" : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
