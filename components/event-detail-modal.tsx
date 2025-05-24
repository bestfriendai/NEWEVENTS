"use client"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Users, Heart, ExternalLink } from "lucide-react"
import { EventMap } from "@/components/event-map"

import type { EventDetail } from "@/types/event.types";

interface EventDetailModalProps {
  event: EventDetail | null
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
      <DialogContent className="sm:max-w-[600px] p-6">
        <DialogHeader>
          <DialogTitle>Event details</DialogTitle>
          <DialogDescription>Loading event information...</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        <div className="relative h-48 overflow-hidden">
          <Image
            src={event.image || "/placeholder.svg"}
            alt={event.title}
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 600px) 100vw, 600px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 text-white hover:bg-white/20"
            onClick={() => onFavorite(event.id)}
          >
            <Heart className={`h-5 w-5 ${event.isFavorite ? "fill-red-500 text-red-500" : ""}`} />
          </Button>
        </div>

        <DialogHeader className="p-6 pb-2">
          <div className="flex justify-between items-start">
            <DialogTitle className="text-xl font-bold">{event.title}</DialogTitle>
            <Badge variant="outline" className="ml-2">
              {event.category}
            </Badge>
          </div>
          <DialogDescription className="text-sm text-gray-500">{event.organizer.name}</DialogDescription>
        </DialogHeader>

        <div className="p-6 pt-2 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-2 text-gray-500" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center text-sm">
              <Clock className="h-4 w-4 mr-2 text-gray-500" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center text-sm">
              <MapPin className="h-4 w-4 mr-2 text-gray-500" />
              <span>{event.location}</span>
            </div>
            <div className="text-sm pl-6">{event.address}</div>
            <div className="flex items-center text-sm">
              <Users className="h-4 w-4 mr-2 text-gray-500" />
              <span>{event.attendees} attending</span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">About this event</h3>
            <div className={`text-sm text-gray-600 ${showFullDescription ? "" : "line-clamp-3"}`}>
              {event.description}
            </div>
            {event.description && event.description.length > 150 && (
              <Button variant="link" className="p-0 h-auto text-sm" onClick={toggleDescription}>
                {showFullDescription ? "Show less" : "Read more"}
              </Button>
            )}
          </div>

          {event.ticketLinks && event.ticketLinks.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Tickets</h3>
              <div className="space-y-2">
                {event.ticketLinks.slice(0, 3).map((link, i) => (
                  <a
                    key={i}
                    href={link.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {link.source}
                  </a>
                ))}
                {event.ticketLinks.length > 3 && (
                  <div className="text-sm text-gray-500">+{event.ticketLinks.length - 3} more ticket options</div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Location</h3>
            <div className="h-[200px] rounded-md overflow-hidden">
              <EventMap event={event} />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <div>
              <div className="text-sm font-medium">{event.price}</div>
            </div>
            {event.ticketLinks && event.ticketLinks.length > 0 ? (
              <a
                href={event.ticketLinks[0]?.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              >
                Get Tickets
              </a>
            ) : (
              <Button>RSVP</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
