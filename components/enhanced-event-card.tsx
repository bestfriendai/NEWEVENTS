/**
 * Enhanced Event Card Component
 * Displays event information with favorite functionality and analytics tracking
 */

"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Heart, MapPin, Calendar, Clock, Users, ExternalLink, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUserFavorites } from "@/hooks/use-user-favorites"
import { useAnalytics } from "@/hooks/use-analytics"
import { logger } from "@/lib/utils/logger"
import type { EventDetailProps } from "@/components/event-detail-modal"

export interface EnhancedEventCardProps {
  event: EventDetailProps
  onEventClick?: (event: EventDetailProps) => void
  showFavoriteButton?: boolean
  showShareButton?: boolean
  className?: string
}

export function EnhancedEventCard({
  event,
  onEventClick,
  showFavoriteButton = true,
  showShareButton = true,
  className = "",
}: EnhancedEventCardProps) {
  const [isImageLoading, setIsImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  // Hooks
  const { toggleFavorite, isFavorite } = useUserFavorites()
  const { trackEvent } = useAnalytics()

  const eventId = Number(event.id)
  const isEventFavorited = isFavorite(eventId)

  /**
   * Handle favorite toggle
   */
  const handleFavoriteToggle = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()

      logger.debug("Toggling favorite from event card", {
        component: "EnhancedEventCard",
        action: "toggle_favorite",
        metadata: { eventId },
      })

      const success = await toggleFavorite(eventId, event)

      if (success) {
        await trackEvent(eventId, "favorite", {
          action: isEventFavorited ? "remove" : "add",
          source: "event_card",
        })
      }
    },
    [eventId, event, toggleFavorite, trackEvent, isEventFavorited],
  )

  /**
   * Handle share
   */
  const handleShare = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()

      try {
        if (navigator.share) {
          await navigator.share({
            title: event.title,
            text: event.description,
            url: window.location.href,
          })
        } else {
          // Fallback to clipboard
          await navigator.clipboard.writeText(window.location.href)
          // You could show a toast notification here
        }

        await trackEvent(eventId, "share", {
          method: navigator.share ? "native" : "clipboard",
          source: "event_card",
        })

        logger.debug("Event shared", {
          component: "EnhancedEventCard",
          action: "share",
          metadata: { eventId },
        })
      } catch (error) {
        logger.warn("Share failed", {
          component: "EnhancedEventCard",
          action: "share_error",
          metadata: { eventId },
        })
      }
    },
    [event, eventId, trackEvent],
  )

  /**
   * Handle card click
   */
  const handleCardClick = useCallback(async () => {
    await trackEvent(eventId, "view", {
      source: "event_card",
    })

    onEventClick?.(event)
  }, [event, eventId, onEventClick, trackEvent])

  /**
   * Handle ticket link click
   */
  const handleTicketClick = useCallback(
    async (e: React.MouseEvent, ticketUrl: string) => {
      e.stopPropagation()

      await trackEvent(eventId, "click_ticket", {
        ticketUrl,
        source: "event_card",
      })

      window.open(ticketUrl, "_blank", "noopener,noreferrer")
    },
    [eventId, trackEvent],
  )

  /**
   * Handle image load
   */
  const handleImageLoad = useCallback(() => {
    setIsImageLoading(false)
  }, [])

  /**
   * Handle image error
   */
  const handleImageError = useCallback(() => {
    setIsImageLoading(false)
    setImageError(true)
  }, [])

  return (
    <Card
      className={`group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${className}`}
      onClick={handleCardClick}
    >
      <CardContent className="p-0">
        {/* Event Image */}
        <div className="relative aspect-video overflow-hidden rounded-t-lg">
          {!imageError ? (
            <img
              src={event.image || "/placeholder.svg"}
              alt={event.title}
              className={`h-full w-full object-cover transition-opacity duration-200 ${
                isImageLoading ? "opacity-0" : "opacity-100"
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <Calendar className="h-12 w-12 text-muted-foreground" />
            </div>
          )}

          {/* Loading skeleton */}
          {isImageLoading && !imageError && <div className="absolute inset-0 animate-pulse bg-muted" />}

          {/* Category Badge */}
          <Badge className="absolute top-2 left-2 bg-black/70 text-white">{event.category}</Badge>

          {/* Action Buttons */}
          <div className="absolute top-2 right-2 flex gap-2">
            {showFavoriteButton && (
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                onClick={handleFavoriteToggle}
              >
                <Heart className={`h-4 w-4 ${isEventFavorited ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
              </Button>
            )}

            {showShareButton && (
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 text-gray-600" />
              </Button>
            )}
          </div>
        </div>

        {/* Event Details */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {event.title}
          </h3>

          {/* Date and Time */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{event.time}</span>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{event.location}</span>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>

          {/* Organizer and Attendees */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={event.organizer.avatar || "/placeholder.svg"} alt={event.organizer.name} />
                <AvatarFallback className="text-xs">{event.organizer.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">{event.organizer.name}</span>
            </div>

            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{event.attendees.toLocaleString()}</span>
            </div>
          </div>

          {/* Price and Ticket Links */}
          <div className="flex items-center justify-between">
            <div className="font-semibold text-primary">{event.price}</div>

            {event.ticketLinks && event.ticketLinks.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => handleTicketClick(e, event.ticketLinks![0])}
                className="h-8"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Tickets
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
