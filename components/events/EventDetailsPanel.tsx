"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { X, Calendar, Clock, MapPin, Users, Heart, ExternalLink, Share2, Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useFavoriteToggle } from "@/contexts/FavoritesContext"
import { useAnalytics } from "@/hooks/use-analytics"
import { cn } from "@/lib/utils"
import type { EventDetail } from "@/types/event.types"

interface EventDetailsPanelProps {
  event: EventDetail
  onClose: () => void
}

export function EventDetailsPanel({ event, onClose }: EventDetailsPanelProps) {
  const { isFavorite, toggleFavorite, isLoading: favoriteLoading } = useFavoriteToggle(event.id)
  const { trackEvent } = useAnalytics()

  const handleToggleFavorite = async () => {
    await toggleFavorite()
    trackEvent("favorite_toggle", "event_panel", {
      eventId: event.id,
      newState: !isFavorite,
    })
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `Check out this event: ${event.title}`,
          url: window.location.href,
        })
        trackEvent("event_share", "native_share", { eventId: event.id })
      } catch (error) {
        // Fallback to clipboard
        handleCopyLink()
      }
    } else {
      handleCopyLink()
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      trackEvent("event_share", "copy_link", { eventId: event.id })
      // You could show a toast notification here
    } catch (error) {
      console.error("Failed to copy link:", error)
    }
  }

  const handleTicketClick = (link: string) => {
    trackEvent("ticket_click", "event_panel", {
      eventId: event.id,
      ticketSource: link,
    })
    window.open(link, "_blank", "noopener,noreferrer")
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-[#1A1D25] border-l border-gray-800 z-50 overflow-y-auto"
      >
        {/* Header Image */}
        <div className="relative h-64 overflow-hidden">
          <Image
            src={event.image || "/placeholder.svg?height=256&width=400&text=" + encodeURIComponent(event.title)}
            alt={event.title}
            fill
            style={{ objectFit: "cover" }}
            className="transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Header Controls */}
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="h-10 w-10 p-0 bg-black/50 hover:bg-black/70 backdrop-blur-sm"
            >
              <Share2 className="h-4 w-4 text-white" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleFavorite}
              disabled={favoriteLoading}
              className="h-10 w-10 p-0 bg-black/50 hover:bg-black/70 backdrop-blur-sm"
            >
              <Heart
                className={cn(
                  "h-4 w-4 transition-all duration-200",
                  isFavorite ? "fill-red-500 text-red-500" : "text-white",
                )}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-10 w-10 p-0 bg-black/50 hover:bg-black/70 backdrop-blur-sm"
            >
              <X className="h-4 w-4 text-white" />
            </Button>
          </div>

          {/* Category Badge */}
          <div className="absolute top-4 left-4">
            <Badge className="bg-purple-600/90 text-white backdrop-blur-sm">{event.category}</Badge>
          </div>

          {/* Price */}
          <div className="absolute bottom-4 right-4">
            <div className="bg-black/70 rounded-full px-4 py-2 backdrop-blur-sm">
              <span className="text-white font-bold">{event.price}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-2">{event.title}</h1>

          {/* Organizer */}
          <div className="flex items-center mb-4">
            <Avatar className="h-8 w-8 mr-3">
              <AvatarImage src={event.organizer.avatar || "/placeholder.svg"} />
              <AvatarFallback className="text-sm">{event.organizer.name[0]}</AvatarFallback>
            </Avatar>
            <span className="text-gray-300">by {event.organizer.name}</span>
          </div>

          {/* Event Details */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center text-gray-300">
              <Calendar className="h-5 w-5 mr-3 text-purple-400 flex-shrink-0" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center text-gray-300">
              <Clock className="h-5 w-5 mr-3 text-purple-400 flex-shrink-0" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center text-gray-300">
              <MapPin className="h-5 w-5 mr-3 text-purple-400 flex-shrink-0" />
              <div>
                <div>{event.location}</div>
                {event.address && <div className="text-sm text-gray-400">{event.address}</div>}
              </div>
            </div>
            <div className="flex items-center text-gray-300">
              <Users className="h-5 w-5 mr-3 text-purple-400 flex-shrink-0" />
              <span>
                {typeof event.attendees === "number"
                  ? `${event.attendees.toLocaleString()} attending`
                  : event.attendees}
              </span>
            </div>
          </div>

          <Separator className="my-6 bg-gray-800" />

          {/* Description */}
          {event.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">About This Event</h3>
              <p className="text-gray-300 leading-relaxed">{event.description}</p>
            </div>
          )}

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="border-gray-700 text-gray-300">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Venue Info */}
          {event.venue && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Venue</h3>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="font-medium text-white">{event.venue.name}</div>
                {event.venue.capacity && (
                  <div className="text-sm text-gray-400">Capacity: {event.venue.capacity.toLocaleString()}</div>
                )}
                {event.venue.type && <div className="text-sm text-gray-400">Type: {event.venue.type}</div>}
              </div>
            </div>
          )}

          {/* Ticket Links */}
          {event.ticketLinks && event.ticketLinks.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Get Tickets</h3>
              <div className="space-y-2">
                {event.ticketLinks.map((ticket, index) => (
                  <Button
                    key={index}
                    onClick={() => handleTicketClick(ticket.link)}
                    className="w-full bg-purple-600 hover:bg-purple-700 justify-between"
                  >
                    <div className="flex items-center">
                      <Ticket className="h-4 w-4 mr-2" />
                      Buy on {ticket.source}
                    </div>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleToggleFavorite}
              disabled={favoriteLoading}
              variant={isFavorite ? "default" : "outline"}
              className={cn(
                "flex-1",
                isFavorite ? "bg-red-600 hover:bg-red-700" : "border-gray-700 text-gray-300 hover:text-white",
              )}
            >
              <Heart className={cn("h-4 w-4 mr-2", isFavorite && "fill-current")} />
              {isFavorite ? "Saved" : "Save Event"}
            </Button>
            <Button onClick={handleShare} variant="outline" className="border-gray-700 text-gray-300 hover:text-white">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  )
}
