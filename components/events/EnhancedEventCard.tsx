"use client"

import type React from "react"
import { useState } from "react"

import { motion } from "framer-motion"
import Image from "next/image"
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Heart,
  Star,
  Share2,
  TrendingUp,
  Zap,
  Music,
  Palette,
  Gamepad2,
  Utensils,
  Briefcase,
  GraduationCap,
  ExternalLink,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { useFavoriteToggle } from "@/contexts/FavoritesContext"
import { cn } from "@/lib/utils"
import type { EventDetail } from "@/types/event.types"

const CATEGORY_ICONS = {
  Music: Music,
  Arts: Palette,
  Sports: Gamepad2,
  Food: Utensils,
  Business: Briefcase,
  Education: GraduationCap,
  Nightlife: Zap,
  Event: Zap,
}

const CATEGORY_COLORS = {
  Music: "from-purple-600 to-blue-600",
  Arts: "from-pink-600 to-rose-600",
  Sports: "from-green-600 to-emerald-600",
  Food: "from-orange-600 to-red-600",
  Business: "from-gray-600 to-slate-600",
  Education: "from-blue-600 to-cyan-600",
  Nightlife: "from-yellow-600 to-orange-600",
  Event: "from-purple-500 to-pink-500",
}

interface EnhancedEventCardProps {
  event: EventDetail
  onSelect: () => void
  className?: string
  index?: number
  variant?: "default" | "featured" | "compact"
}

export function EnhancedEventCard({
  event,
  onSelect,
  className,
  index = 0,
  variant = "default",
}: EnhancedEventCardProps) {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  const { isFavorite, toggleFavorite, isLoading: favoriteLoading } = useFavoriteToggle(event.id)
  const IconComponent = CATEGORY_ICONS[event.category as keyof typeof CATEGORY_ICONS] || Zap
  const categoryColor = CATEGORY_COLORS[event.category as keyof typeof CATEGORY_COLORS] || "from-purple-500 to-pink-500"

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await toggleFavorite()
  }

  const handleImageLoad = () => {
    setImageLoading(false)
  }

  const handleImageError = () => {
    setImageLoading(false)
    setImageError(true)
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (navigator.share) {
      await navigator.share({
        title: event.title,
        text: event.description,
        url: window.location.href + `?event=${event.id}`,
      })
    } else {
      await navigator.clipboard.writeText(window.location.href + `?event=${event.id}`)
    }
  }

  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        whileHover={{ x: 4 }}
        className={cn("cursor-pointer", className)}
        onClick={onSelect}
      >
        <Card className="bg-[#1A1D25]/60 backdrop-blur-sm border border-gray-800/30 hover:border-purple-500/50 transition-all duration-300 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex space-x-4">
              <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                {imageLoading && (
                  <div className="absolute inset-0 bg-gray-800 flex items-center justify-center z-10">
                    <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
                  </div>
                )}
                <Image
                  src={imageError ? "/community-event.png" : (event.image || "/community-event.png")}
                  alt={event.title}
                  fill
                  className={cn(
                    "object-cover transition-opacity duration-300",
                    imageLoading ? "opacity-0" : "opacity-100"
                  )}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  sizes="80px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <Badge
                  className={`absolute bottom-1 left-1 bg-gradient-to-r ${categoryColor} text-white text-xs px-1 py-0.5`}
                >
                  <IconComponent className="h-2 w-2" />
                </Badge>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white text-sm line-clamp-1 mb-1">{event.title}</h3>
                <div className="space-y-1 text-xs text-gray-400">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1 text-purple-400" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1 text-purple-400" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-purple-400 font-semibold text-sm">{event.price}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={handleToggleFavorite}
                    disabled={favoriteLoading}
                  >
                    <Heart
                      className={cn(
                        "h-3 w-3 transition-all duration-200",
                        isFavorite ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-red-400",
                      )}
                    />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (variant === "featured") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        whileHover={{ y: -8, scale: 1.02 }}
        className={cn("cursor-pointer group", className)}
        onClick={onSelect}
      >
        <Card className="bg-gradient-to-br from-[#1A1D25] to-[#22252F] border border-purple-500/30 hover:border-purple-400/60 transition-all duration-300 overflow-hidden group-hover:shadow-2xl group-hover:shadow-purple-500/20">
          <div className="relative h-64 overflow-hidden">
            {imageLoading && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center z-10">
                <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
              </div>
            )}
            <Image
              src={imageError ? "/community-event.png" : (event.image || "/community-event.png")}
              alt={event.title}
              fill
              className={cn(
                "object-cover transition-all duration-500 group-hover:scale-110",
                imageLoading ? "opacity-0" : "opacity-100"
              )}
              onLoad={handleImageLoad}
              onError={handleImageError}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Featured Badge */}
            <div className="absolute top-4 left-4">
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg">
                <TrendingUp className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            </div>

            {/* Category Badge */}
            <div className="absolute top-4 right-4">
              <Badge className={`bg-gradient-to-r ${categoryColor} text-white border-0 shadow-lg`}>
                <IconComponent className="h-3 w-3 mr-1" />
                {event.category}
              </Badge>
            </div>

            {/* Action Buttons */}
            <div className="absolute bottom-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 backdrop-blur-sm border-0 rounded-full"
                onClick={handleToggleFavorite}
                disabled={favoriteLoading}
              >
                <Heart className={cn("h-4 w-4", isFavorite ? "fill-red-500 text-red-500" : "text-white")} />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 backdrop-blur-sm border-0 rounded-full"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 text-white" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 backdrop-blur-sm border-0 rounded-full"
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect()
                }}
              >
                <ExternalLink className="h-4 w-4 text-white" />
              </Button>
            </div>

            {/* Price */}
            <div className="absolute bottom-4 left-4">
              <div className="bg-black/70 rounded-full px-4 py-2 backdrop-blur-sm">
                <span className="text-white font-bold">{event.price}</span>
              </div>
            </div>

            {/* Rating */}
            {event.rating && (
              <div className="absolute top-1/2 left-4 transform -translate-y-1/2">
                <div className="bg-black/70 rounded-full px-3 py-1 backdrop-blur-sm flex items-center">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                  <span className="text-white font-medium">{event.rating}</span>
                </div>
              </div>
            )}
          </div>

          <CardContent className="p-6">
            <h3 className="font-bold text-white text-xl mb-3 line-clamp-2 group-hover:text-purple-400 transition-colors duration-300">
              {event.title}
            </h3>

            <p className="text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">{event.description}</p>

            <div className="space-y-3 text-sm">
              <div className="flex items-center text-gray-300">
                <Calendar className="h-4 w-4 mr-3 text-purple-400" />
                <span>{event.date}</span>
                <Clock className="h-4 w-4 ml-4 mr-2 text-purple-400" />
                <span>{event.time}</span>
              </div>

              <div className="flex items-center text-gray-300">
                <MapPin className="h-4 w-4 mr-3 text-purple-400" />
                <span className="line-clamp-1">{event.location}</span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                <div className="flex items-center text-gray-300">
                  <Users className="h-4 w-4 mr-2 text-purple-400" />
                  <span>
                    {typeof event.attendees === "number" ? event.attendees.toLocaleString() : event.attendees} attending
                  </span>
                </div>
                <div className="flex items-center">
                  <Avatar className="h-7 w-7 mr-2 border border-purple-500/30">
                    <AvatarImage src={event.organizer?.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-xs bg-purple-600">
                      {event.organizer?.name?.[0] || "O"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-gray-400 truncate max-w-24">
                    {event.organizer?.name || "Organizer"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // Default variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className={cn("cursor-pointer group", className)}
      onClick={onSelect}
    >
      <Card className="bg-[#1A1D25]/80 backdrop-blur-md border border-gray-800/50 hover:border-purple-500/50 transition-all duration-300 overflow-hidden group-hover:shadow-2xl group-hover:shadow-purple-500/20">
        <div className="relative h-48 overflow-hidden">
          {imageLoading && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center z-10">
              <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
            </div>
          )}
          <Image
            src={imageError ? "/community-event.png" : (event.image || "/community-event.png")}
            alt={event.title}
            fill
            className={cn(
              "object-cover transition-all duration-500 group-hover:scale-110",
              imageLoading ? "opacity-0" : "opacity-100"
            )}
            onLoad={handleImageLoad}
            onError={handleImageError}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <Badge className={`bg-gradient-to-r ${categoryColor} text-white border-0 shadow-lg`}>
              <IconComponent className="h-3 w-3 mr-1" />
              {event.category}
            </Badge>
          </div>

          {/* Featured Badge */}
          {event.isFeatured && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg">
                <TrendingUp className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            </div>
          )}

          {/* Action Buttons */}
          <div className="absolute bottom-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 backdrop-blur-sm border-0 rounded-full"
              onClick={handleToggleFavorite}
              disabled={favoriteLoading}
            >
              <Heart className={cn("h-4 w-4", isFavorite ? "fill-red-500 text-red-500" : "text-white")} />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 backdrop-blur-sm border-0 rounded-full"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4 text-white" />
            </Button>
          </div>

          {/* Price */}
          <div className="absolute bottom-3 left-3">
            <div className="bg-black/70 rounded-full px-3 py-1 backdrop-blur-sm">
              <span className="text-white font-bold text-sm">{event.price}</span>
            </div>
          </div>
        </div>

        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold text-white text-lg line-clamp-2 group-hover:text-purple-400 transition-colors duration-300">
              {event.title}
            </h3>
            {event.rating && (
              <div className="flex items-center space-x-1 text-sm ml-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-gray-300">{event.rating}</span>
              </div>
            )}
          </div>

          <p className="text-gray-400 text-sm mb-4 line-clamp-2">{event.description}</p>

          <div className="space-y-2 text-sm">
            <div className="flex items-center text-gray-300">
              <Calendar className="h-4 w-4 mr-2 text-purple-400" />
              <span>{event.date}</span>
              {event.time && (
                <>
                  <Clock className="h-4 w-4 ml-3 mr-1 text-purple-400" />
                  <span>{event.time}</span>
                </>
              )}
            </div>

            <div className="flex items-center text-gray-300">
              <MapPin className="h-4 w-4 mr-2 text-purple-400" />
              <span className="line-clamp-1">{event.location}</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center text-gray-300">
                <Users className="h-4 w-4 mr-2 text-purple-400" />
                <span>
                  {typeof event.attendees === "number" ? event.attendees.toLocaleString() : event.attendees} attending
                </span>
              </div>
              <div className="flex items-center">
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarImage src={event.organizer?.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-xs bg-purple-600">{event.organizer?.name?.[0] || "O"}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-gray-400 truncate max-w-20">{event.organizer?.name || "Organizer"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
