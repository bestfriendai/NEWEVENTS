"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Heart, Calendar, MapPin, Clock, Users, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { EventDetail } from "@/types/event.types"

interface EventCardProps {
  id?: number
  title?: string
  date?: string
  time?: string
  location?: string
  image?: string
  category?: string
  isFeatured?: boolean
  index?: number
  event?: EventDetail
  onViewDetails?: () => void
  onToggleFavorite?: () => void
  variant?: "default" | "compact" | "featured"
}

export function EventCard({
  id,
  title,
  date,
  time,
  location,
  image,
  category,
  index = 0,
  event,
  onViewDetails = () => {},
  onToggleFavorite = () => {},
  variant = "default",
}: EventCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Use event object if provided, otherwise use individual props
  const eventData = event || {
    id: id || 0,
    title: title || "Event Title",
    date: date || "Date TBA",
    time: time || "Time TBA",
    location: location || "Location TBA",
    image: image || "/community-event.png",
    category: category || "Event",
    isFavorite: false,
    organizer: {
      name: "Organizer",
      avatar: "/avatar-1.png",
    },
    description: "",
    address: "",
    price: "Price TBA",
  }

  // Determine badge color based on category
  const getBadgeStyles = () => {
    switch (eventData.category) {
      case "Music":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30"
      case "Art":
      case "Arts":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30"
      case "Wellness":
        return "bg-green-500/20 text-green-300 border-green-500/30"
      case "Business":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
      case "Food":
        return "bg-pink-500/20 text-pink-300 border-pink-500/30"
      case "Film":
        return "bg-orange-500/20 text-orange-300 border-orange-500/30"
      case "Sports":
        return "bg-red-500/20 text-red-300 border-red-500/30"
      default:
        return "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
    }
  }

  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        className="group cursor-pointer"
        onClick={onViewDetails}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="bg-[#1A1D25]/60 backdrop-blur-sm border border-gray-800/50 rounded-lg overflow-hidden transition-all duration-300 group-hover:shadow-glow-xs group-hover:border-purple-500/40">
          <div className="flex items-center p-2">
            <div className="relative w-14 h-14 rounded-md overflow-hidden mr-2.5 flex-shrink-0">
              <motion.img
                src={eventData.image}
                alt={eventData.title}
                className="w-full h-full object-cover"
                animate={{ scale: isHovered ? 1.1 : 1 }}
                transition={{ duration: 0.3 }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1D25]/70 to-transparent"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <Badge className={cn("text-xs font-medium border-0 px-2 py-0.5", getBadgeStyles())}>
                  {eventData.category}
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
                  <Heart
                    size={12}
                    className={eventData.isFavorite ? "fill-purple-500 text-purple-500" : "text-gray-400"}
                  />
                </motion.button>
              </div>
              <h3 className="font-medium text-gray-200 text-xs truncate mb-0.5">{eventData.title}</h3>
              <div className="flex items-center text-xs text-gray-400 mt-0.5">
                <Calendar size={10} className="mr-1 text-purple-400 flex-shrink-0" />
                <span className="truncate">{eventData.date}</span>
              </div>
              <div className="flex items-center text-xs text-gray-400 mt-0.5">
                <MapPin size={10} className="mr-1 text-purple-400 flex-shrink-0" />
                <span className="truncate">{eventData.location}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  if (variant === "featured") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
        className="group cursor-pointer relative h-full"
        onClick={onViewDetails}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-indigo-700/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
        <div className="bg-[#1A1D25]/60 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden h-full transition-all duration-300 group-hover:shadow-glow-sm group-hover:border-purple-500/30">
          <div className="relative h-48 overflow-hidden">
            <motion.img
              src={eventData.image}
              alt={eventData.title}
              className="w-full h-full object-cover"
              animate={{ scale: isHovered ? 1.05 : 1 }}
              transition={{ duration: 0.5 }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A1D25] via-transparent to-transparent opacity-80"></div>

            <motion.div
              className="absolute top-3 right-3 z-10"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite()
              }}
            >
              <div className="bg-[#1A1D25]/70 backdrop-blur-sm p-2 rounded-full shadow-glow-xs">
                <Heart
                  size={16}
                  className={eventData.isFavorite ? "fill-purple-500 text-purple-500" : "text-gray-400"}
                />
              </div>
            </motion.div>

            <div className="absolute top-3 left-3 z-10">
              <Badge className={cn("text-xs font-medium border-0 px-2 py-0.5", getBadgeStyles())}>
                {eventData.category}
              </Badge>
            </div>

            <div className="absolute bottom-3 left-3 right-3 z-10">
              <h3 className="font-bold text-white text-lg mb-1 line-clamp-1">{eventData.title}</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-300">
                  <MapPin size={14} className="mr-1 text-purple-400" />
                  <span className="truncate">{eventData.location}</span>
                </div>
                <div className="bg-[#1A1D25]/70 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium text-gray-300">
                  {eventData.price}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 flex flex-col flex-1">
            <div className="flex items-center text-sm text-gray-400 mb-2">
              <Calendar size={14} className="mr-1.5 text-purple-400" />
              {eventData.date}
            </div>
            <div className="flex items-center text-sm text-gray-400 mb-2">
              <Clock size={14} className="mr-1.5 text-purple-400" />
              {eventData.time}
            </div>

            <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-800/50">
              <div className="flex items-center">
                <Avatar className="h-6 w-6 mr-2 border border-gray-800">
                  <AvatarImage
                    src={eventData.organizer?.avatar || "/placeholder.svg"}
                    alt={eventData.organizer?.name || "Organizer"}
                  />
                  <AvatarFallback className="bg-purple-900 text-purple-200 text-xs">
                    {(eventData.organizer?.name || "O").charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center text-xs text-gray-400">
                  <MapPin size={12} className="mr-1" />
                  <span className="text-purple-400 font-medium truncate">{eventData.location || "Location TBA"}</span>
                </div>
              </div>

              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ x: -2 }}
                className="text-purple-400 group-hover:text-purple-300"
              >
                <ChevronRight size={18} />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // Default card variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="group cursor-pointer h-full"
      onClick={onViewDetails}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="bg-[#1A1D25]/60 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden h-full transition-all duration-300 group-hover:shadow-glow-sm group-hover:border-purple-500/30">
        <div className="relative h-40 overflow-hidden">
          <motion.img
            src={eventData.image}
            alt={eventData.title}
            className="w-full h-full object-cover"
            animate={{ scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.5 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1D25] via-transparent to-transparent opacity-70"></div>

          <motion.div
            className="absolute top-3 right-3 z-10"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation()
              onToggleFavorite()
            }}
          >
            <div className="bg-[#1A1D25]/70 backdrop-blur-sm p-1.5 rounded-full shadow-glow-xs">
              <Heart size={14} className={eventData.isFavorite ? "fill-purple-500 text-purple-500" : "text-gray-400"} />
            </div>
          </motion.div>

          <div className="absolute top-3 left-3 z-10">
            <Badge className={cn("text-xs font-medium border-0 px-2 py-0.5", getBadgeStyles())}>
              {eventData.category}
            </Badge>
          </div>

          <div className="absolute bottom-3 left-3 right-3 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Avatar className="h-6 w-6 border border-gray-800">
                  <AvatarImage
                    src={eventData.organizer?.avatar || "/placeholder.svg"}
                    alt={eventData.organizer?.name || "Organizer"}
                  />
                  <AvatarFallback className="bg-purple-900 text-purple-200 text-xs">
                    {(eventData.organizer?.name || "O").charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-xs">
                  <p className="text-gray-300 font-medium line-clamp-1">{eventData.organizer?.name || "Organizer"}</p>
                </div>
              </div>
              <div className="bg-[#1A1D25]/70 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs font-medium text-gray-300">
                {eventData.price}
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 flex flex-col flex-1">
          <h3 className="font-medium text-gray-200 mb-1.5 line-clamp-1">{eventData.title}</h3>
          <div className="flex items-center text-xs text-gray-400 mb-1">
            <MapPin size={12} className="mr-1 text-purple-400 flex-shrink-0" />
            <span className="truncate">{eventData.location}</span>
          </div>
          <div className="flex items-center text-xs text-gray-400 mb-1">
            <Calendar size={12} className="mr-1 text-purple-400 flex-shrink-0" />
            <span>{eventData.date}</span>
          </div>
          <div className="flex items-center text-xs text-gray-400 mb-2">
            <Clock size={12} className="mr-1 text-purple-400 flex-shrink-0" />
            <span>{eventData.time}</span>
          </div>

          <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-800/30">
            <div className="flex items-center text-xs text-gray-400">
              <MapPin size={12} className="mr-1" />
              <span className="text-purple-400 font-medium truncate max-w-[120px]">{eventData.location || "Location TBA"}</span>
            </div>
            <motion.div
              whileHover={{ x: 2 }}
              whileTap={{ x: -2 }}
              className="text-purple-400 group-hover:text-purple-300"
            >
              <ChevronRight size={16} />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
