"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Heart, Calendar, MapPin, Clock, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { EventDetailProps } from "./event-detail-modal"

interface EventMapMarkerProps {
  event: EventDetailProps
  onClick: () => void
  onViewDetails: () => void
  onToggleFavorite: () => void
  isSelected: boolean
  style?: React.CSSProperties
}

export function EventMapMarker({
  event,
  onClick,
  onViewDetails,
  onToggleFavorite,
  isSelected,
  style,
}: EventMapMarkerProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Determine marker color based on category
  const getMarkerColor = () => {
    switch (event.category) {
      case "Music":
        return "bg-purple-500"
      case "Art":
        return "bg-blue-500"
      case "Wellness":
        return "bg-green-500"
      case "Business":
        return "bg-yellow-500"
      case "Food":
        return "bg-pink-500"
      case "Film":
        return "bg-orange-500"
      default:
        return "bg-indigo-500"
    }
  }

  // Determine shadow color based on category
  const getShadowColor = () => {
    switch (event.category) {
      case "Music":
        return "shadow-purple-500/50"
      case "Art":
        return "shadow-blue-500/50"
      case "Wellness":
        return "shadow-green-500/50"
      case "Business":
        return "shadow-yellow-500/50"
      case "Food":
        return "shadow-pink-500/50"
      case "Film":
        return "shadow-orange-500/50"
      default:
        return "shadow-indigo-500/50"
    }
  }

  return (
    <>
      {/* Marker */}
      <motion.div
        className="absolute cursor-pointer z-10"
        style={style}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <motion.div className={cn("relative", isSelected && "z-20")}>
          {/* Pulse animation for selected marker */}
          {isSelected && (
            <motion.div
              className={cn("absolute -inset-4 rounded-full opacity-30", getMarkerColor())}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: [0.8, 1.2, 0.8],
                opacity: [0, 0.3, 0],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop",
              }}
            />
          )}

          {/* Main marker */}
          <motion.div
            className={cn(
              "w-5 h-5 rounded-full shadow-lg relative",
              getMarkerColor(),
              getShadowColor(),
              isSelected && "ring-2 ring-white",
            )}
          >
            {/* Small dot in the corner */}
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-white shadow-sm" />
          </motion.div>

          {/* Category label on hover */}
          <AnimatePresence>
            {isHovered && !isSelected && (
              <motion.div
                className="absolute top-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-[#1A1D25]/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md shadow-md">
                  {event.title.length > 20 ? `${event.title.substring(0, 20)}...` : event.title}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Popup when marker is selected */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            className="absolute z-30 bottom-8 left-1/2 transform -translate-x-1/2 w-72"
            style={style}
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-[#1A1D25]/95 backdrop-blur-md rounded-xl overflow-hidden shadow-xl border border-gray-800">
              {/* Event image */}
              <div className="h-32 relative">
                <img src={event.image || "/placeholder.svg"} alt={event.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1D25] via-transparent to-transparent opacity-70"></div>

                {/* Category badge */}
                <div className="absolute top-2 left-2">
                  <Badge
                    className={`backdrop-blur-sm border-0 shadow-glow-xs px-2 py-0.5 text-xs font-medium
                      ${
                        event.category === "Music"
                          ? "bg-purple-500/20 text-purple-300"
                          : event.category === "Art"
                            ? "bg-blue-500/20 text-blue-300"
                            : event.category === "Wellness"
                              ? "bg-green-500/20 text-green-300"
                              : event.category === "Business"
                                ? "bg-yellow-500/20 text-yellow-300"
                                : event.category === "Food"
                                  ? "bg-pink-500/20 text-pink-300"
                                  : "bg-orange-500/20 text-orange-300"
                      }`}
                  >
                    {event.category}
                  </Badge>
                </div>

                {/* Favorite button */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute top-2 right-2 bg-[#1A1D25]/80 backdrop-blur-sm rounded-full p-1.5 shadow-glow-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleFavorite()
                  }}
                >
                  <Heart
                    size={14}
                    className={
                      event.isFavorite
                        ? "text-purple-400 fill-purple-400"
                        : "text-gray-400 hover:text-purple-400 cursor-pointer transition-colors duration-300"
                    }
                  />
                </motion.div>

                {/* Event title */}
                <div className="absolute bottom-2 left-2 right-2">
                  <h3 className="text-sm font-bold text-white line-clamp-1">{event.title}</h3>
                </div>
              </div>

              {/* Event details */}
              <div className="p-3 space-y-2">
                <div className="flex items-center text-xs text-gray-400">
                  <Calendar size={12} className="mr-1.5 text-purple-400" />
                  {event.date}
                </div>
                <div className="flex items-center text-xs text-gray-400">
                  <Clock size={12} className="mr-1.5 text-purple-400" />
                  {event.time}
                </div>
                <div className="flex items-center text-xs text-gray-400">
                  <MapPin size={12} className="mr-1.5 text-purple-400" />
                  {event.location}
                </div>

                {/* Price and attendees */}
                <div className="flex items-center justify-between pt-1">
                  <div className="text-xs font-medium text-white">{event.price}</div>
                  <div className="flex items-center">
                    <Avatar className="h-5 w-5 border border-gray-800">
                      <AvatarImage src={event.organizer.avatar || "/placeholder.svg"} alt={event.organizer.name} />
                      <AvatarFallback className="bg-purple-900 text-purple-200 text-xs">
                        {event.organizer.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-1.5">
                      <p className="text-xs text-gray-400">
                        <span className="text-purple-400">{event.attendees}</span> attending
                      </p>
                    </div>
                  </div>
                </div>

                {/* View details button */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg shadow-glow-xs text-xs h-8 mt-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      onViewDetails()
                    }}
                  >
                    View Details
                    <ChevronRight size={14} className="ml-1" />
                  </Button>
                </motion.div>
              </div>

              {/* Pointer */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-[#1A1D25] border-r border-b border-gray-800 rotate-45"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
