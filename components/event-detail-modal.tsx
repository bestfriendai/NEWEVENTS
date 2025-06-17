"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Clock, MapPin, Users, Heart, Share2, ExternalLink, X } from "lucide-react"

export interface EventDetailProps {
  id: number
  title: string
  description: string
  date: string
  time?: string
  location: string
  address?: string
  coordinates?: { lat: number; lng: number }
  price: string
  category: string
  image?: string
  attendees?: number
  organizer?: { name: string; logo?: string }
  isFeatured?: boolean
  isFavorite?: boolean
  ticketLinks?: Array<{ link: string; source: string }>
}

interface EventDetailModalProps {
  event: EventDetailProps
  isOpen: boolean
  onClose: () => void
  onFavorite: (id: number) => void
}

export function EventDetailModal({ event, isOpen, onClose, onFavorite }: EventDetailModalProps) {
  const [isFavorite, setIsFavorite] = useState(false)

  // Initialize isFavorite from event prop
  useEffect(() => {
    setIsFavorite(event?.isFavorite || false)
  }, [event?.isFavorite])

  // Early return if no event is provided
  if (!event) {
    return null
  }

  const handleFavoriteToggle = () => {
    setIsFavorite(!isFavorite)
    onFavorite(event.id)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-[#1A1D25] border-gray-800 text-white p-0 max-h-[90vh] overflow-hidden">
        {/* Header Image */}
        <div className="relative h-64 w-full">
          <img
            src={event.image || "/placeholder.svg?height=256&width=600&text=Event"}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full"
          >
            <X className="h-4 w-4 text-white" />
          </Button>

          {/* Category badge */}
          <div className="absolute top-4 left-4">
            <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">{event.category}</Badge>
          </div>

          {/* Title */}
          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="text-2xl font-bold text-white">{event.title}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-16rem)]">
          {/* Description */}
          <p className="text-gray-300 mb-6">{event.description}</p>

          {/* Details */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-3 text-purple-400" />
              <div>
                <div className="font-medium text-white">{event.date}</div>
                {event.time && <div className="text-sm text-gray-400">{event.time}</div>}
              </div>
            </div>

            <div className="flex items-center">
              <MapPin className="h-5 w-5 mr-3 text-purple-400" />
              <div>
                <div className="font-medium text-white">{event.location}</div>
                {event.address && <div className="text-sm text-gray-400">{event.address}</div>}
              </div>
            </div>

            {event.attendees && (
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-3 text-purple-400" />
                <div className="font-medium text-white">{event.attendees.toLocaleString()} attending</div>
              </div>
            )}

            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-3 text-purple-400" />
              <div className="font-medium text-white">{event.price}</div>
            </div>
          </div>

          {/* Organizer */}
          {event.organizer && (
            <div className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg mb-6">
              <Avatar className="h-10 w-10">
                <AvatarImage src={event.organizer.logo || "/placeholder.svg"} />
                <AvatarFallback className="bg-purple-600 text-white">{event.organizer.name?.[0] || "?"}</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-medium text-white">Organized by</div>
                <div className="text-sm text-gray-400">{event.organizer.name}</div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleFavoriteToggle}
              variant="outline"
              className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <Heart className={`h-4 w-4 mr-2 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
              {isFavorite ? "Saved to Favorites" : "Add to Favorites"}
            </Button>

            <Button variant="outline" className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>

          {/* Ticket Links */}
          {event.ticketLinks && event.ticketLinks.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-white mb-3">Get Tickets</h3>
              <div className="space-y-2">
                {event.ticketLinks.map((link, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    asChild
                    className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
                  >
                    <a href={link.link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {link.source}
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
