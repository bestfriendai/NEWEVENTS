"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { Calendar, Clock, MapPin, Users, Heart, Zap, Music, Palette, Trophy, Coffee, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useFavoriteToggle } from "@/contexts/FavoritesContext"
import { cn } from "@/lib/utils"
import type { EventDetail } from "@/types/event.types"
import { logger } from "@/lib/utils/logger"

const CATEGORY_ICONS = {
  Music: Music,
  Arts: Palette,
  Sports: Trophy,
  Food: Coffee,
  Business: Briefcase,
  Event: Zap,
}

interface EventCardProps {
  event: EventDetail
  onSelect: () => void
  className?: string
}

export function EventCard({ event, onSelect, className }: EventCardProps) {
  const { isFavorite, toggleFavorite, isLoading: favoriteLoading } = useFavoriteToggle(event.id)
  const IconComponent = CATEGORY_ICONS[event.category as keyof typeof CATEGORY_ICONS] || Zap

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    try {
      await toggleFavorite()
      
      logger.info("Favorite toggled from EventCard", {
        component: "EventCard",
        action: "favorite_toggle",
        metadata: { eventId: event.id, newState: !isFavorite }
      })
    } catch (error) {
      logger.error("Failed to toggle favorite from EventCard", {
        component: "EventCard",
        action: "favorite_toggle_error",
        metadata: { eventId: event.id }
      }, error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  const handleCardClick = () => {
    logger.info("Event card clicked", {
      component: "EventCard",
      action: "card_click",
      metadata: { eventId: event.id, title: event.title }
    })
    onSelect()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={cn(
        "bg-[#1A1D25] rounded-xl border border-gray-800 hover:border-purple-500/50 transition-all duration-300 overflow-hidden cursor-pointer group",
        className
      )}
      onClick={handleCardClick}
    >
      <div className="aspect-video relative overflow-hidden">
        <Image
          src={event.image || "/placeholder.svg?height=200&width=300&text=" + encodeURIComponent(event.title)}
          alt={event.title}
          fill
          style={{ objectFit: 'cover' }}
          className="transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <Badge className="bg-purple-600/90 text-white backdrop-blur-sm">
            <IconComponent className="h-3 w-3 mr-1" />
            {event.category}
          </Badge>
        </div>

        {/* Favorite button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-3 right-3 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 backdrop-blur-sm transition-all duration-200"
          onClick={handleToggleFavorite}
          disabled={favoriteLoading}
        >
          <Heart 
            className={cn(
              "h-4 w-4 transition-all duration-200",
              isFavorite 
                ? "fill-red-500 text-red-500 scale-110" 
                : "text-white hover:text-red-400"
            )} 
          />
        </Button>

        {/* Price */}
        <div className="absolute bottom-3 right-3">
          <div className="bg-black/70 rounded-full px-3 py-1 backdrop-blur-sm">
            <span className="text-white font-semibold text-sm">{event.price}</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <h3 className="font-bold text-white text-lg mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors duration-200">
          {event.title}
        </h3>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {event.description}
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-400">
            <Calendar className="h-4 w-4 mr-2 text-purple-400 flex-shrink-0" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center text-sm text-gray-400">
            <Clock className="h-4 w-4 mr-2 text-purple-400 flex-shrink-0" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center text-sm text-gray-400">
            <MapPin className="h-4 w-4 mr-2 text-purple-400 flex-shrink-0" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Avatar className="h-6 w-6 mr-2">
              <AvatarImage src={event.organizer.avatar || "/placeholder.svg"} />
              <AvatarFallback className="text-xs">
                {event.organizer.name[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-400 truncate">
              {event.organizer.name}
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-400">
            <Users className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="text-purple-400 font-medium">
              {typeof event.attendees === 'number' ? event.attendees.toLocaleString() : event.attendees}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Grid wrapper component for consistent spacing
export function EventCardGrid({ 
  events, 
  onEventSelect, 
  className 
}: { 
  events: EventDetail[]
  onEventSelect: (event: EventDetail) => void
  className?: string 
}) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", className)}>
      {events.map((event, index) => (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
        >
          <EventCard 
            event={event} 
            onSelect={() => onEventSelect(event)} 
          />
        </motion.div>
      ))}
    </div>
  )
}
