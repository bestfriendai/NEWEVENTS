"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Heart, 
  Share2, 
  ExternalLink, 
  Star,
  DollarSign,
  Ticket,
  TrendingUp,
  Zap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { EventDetailProps } from "@/components/event-detail-modal"

interface EnhancedEventCardProps {
  event: EventDetailProps
  onSelect?: () => void
  onFavorite?: () => void
  onShare?: () => void
  isFavorite?: boolean
  isLoading?: boolean
  variant?: "default" | "compact" | "featured"
  showQuickActions?: boolean
  className?: string
  index?: number
}

const getCategoryIcon = (category: string) => {
  const icons: Record<string, string> = {
    music: "🎵",
    arts: "🎨", 
    sports: "⚽",
    food: "🍕",
    business: "💼",
    technology: "💻",
    health: "🏥",
    education: "📚",
    entertainment: "🎭",
    community: "👥",
  }
  return icons[category?.toLowerCase()] || "📅"
}

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    music: "bg-purple-500",
    arts: "bg-pink-500",
    sports: "bg-green-500", 
    food: "bg-orange-500",
    business: "bg-blue-500",
    technology: "bg-indigo-500",
    health: "bg-red-500",
    education: "bg-yellow-500",
    entertainment: "bg-teal-500",
    community: "bg-gray-500",
  }
  return colors[category?.toLowerCase()] || "bg-gray-500"
}

const formatPrice = (price: any) => {
  if (!price) return "Free"
  if (typeof price === "string") return price
  if (typeof price === "object" && price.min !== undefined) {
    return price.min === 0 ? "Free" : `From $${price.min}`
  }
  return "Price TBA"
}

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Tomorrow"
    if (diffDays < 7) return `In ${diffDays} days`
    
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined
    })
  } catch {
    return dateString
  }
}

export function EnhancedEventCard({
  event,
  onSelect,
  onFavorite,
  onShare,
  isFavorite = false,
  isLoading = false,
  variant = "default",
  showQuickActions = true,
  className,
  index = 0
}: EnhancedEventCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleCardClick = useCallback(() => {
    if (!isLoading) {
      onSelect?.()
    }
  }, [onSelect, isLoading])

  const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onFavorite?.()
  }, [onFavorite])

  const handleShareClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onShare?.()
  }, [onShare])

  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        whileHover={{ y: -2 }}
        className={cn("cursor-pointer", className)}
        onClick={handleCardClick}
      >
        <Card className="bg-[#1A1D25]/80 backdrop-blur-sm border border-gray-800/50 hover:border-purple-500/30 transition-all duration-300 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={event.image || "/placeholder.svg"}
                  alt={event.title}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white text-sm truncate">{event.title}</h3>
                <p className="text-gray-400 text-xs mt-1">{formatDate(event.date)}</p>
                <p className="text-gray-500 text-xs truncate">{event.location}</p>
              </div>
              {showQuickActions && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFavoriteClick}
                  className="flex-shrink-0 p-1 h-8 w-8"
                >
                  <Heart className={cn("h-4 w-4", isFavorite && "fill-red-500 text-red-500")} />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (variant === "featured") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        whileHover={{ y: -8, scale: 1.02 }}
        className={cn("cursor-pointer", className)}
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Card className="bg-gradient-to-br from-[#1A1D25] to-[#2A2D35] border border-purple-500/30 hover:border-purple-400/50 transition-all duration-500 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-purple-500/20">
          <div className="relative h-64 overflow-hidden">
            <Image
              src={event.image || "/placeholder.svg"}
              alt={event.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            {/* Featured badge */}
            <div className="absolute top-4 left-4">
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg">
                <Star className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            </div>

            {/* Quick actions */}
            <AnimatePresence>
              {isHovered && showQuickActions && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-4 right-4 flex gap-2"
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleFavoriteClick}
                          className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 backdrop-blur-sm"
                        >
                          <Heart className={cn("h-4 w-4", isFavorite && "fill-red-500 text-red-500")} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isFavorite ? "Remove from favorites" : "Add to favorites"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleShareClick}
                          className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 backdrop-blur-sm"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Share event</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Event info overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={cn("text-white border-0", getCategoryColor(event.category))}>
                  {getCategoryIcon(event.category)} {event.category}
                </Badge>
                <Badge variant="outline" className="text-white border-white/30">
                  {formatPrice(event.price)}
                </Badge>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">{event.title}</h3>
              
              <div className="flex items-center gap-4 text-gray-300 text-sm">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(event.date)}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{event.location}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    )
  }

  // Default variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -5 }}
      className={cn("cursor-pointer group", className)}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className="bg-[#1A1D25]/80 backdrop-blur-sm border border-gray-800/50 hover:border-purple-500/30 transition-all duration-300 overflow-hidden hover:shadow-lg hover:shadow-purple-500/10">
        <div className="relative h-48 overflow-hidden">
          <Image
            src={event.image || "/placeholder.svg"}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Category badge */}
          <div className="absolute top-3 left-3">
            <Badge className={cn("text-white border-0", getCategoryColor(event.category))}>
              {getCategoryIcon(event.category)} {event.category}
            </Badge>
          </div>

          {/* Quick actions */}
          <AnimatePresence>
            {isHovered && showQuickActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute top-3 right-3 flex gap-2"
              >
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleFavoriteClick}
                  className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 backdrop-blur-sm"
                >
                  <Heart className={cn("h-4 w-4", isFavorite && "fill-red-500 text-red-500")} />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleShareClick}
                  className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 backdrop-blur-sm"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Price badge */}
          <div className="absolute bottom-3 right-3">
            <Badge variant="outline" className="text-white border-white/30 bg-black/50 backdrop-blur-sm">
              {formatPrice(event.price)}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
            {event.title}
          </h3>
          
          <div className="space-y-2 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>{formatDate(event.date)}</span>
              {event.time && (
                <>
                  <Clock className="h-4 w-4 flex-shrink-0 ml-2" />
                  <span>{event.time}</span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>

            {event.organizer && (
              <div className="flex items-center gap-2 pt-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={event.organizer.logo} />
                  <AvatarFallback className="text-xs">
                    {event.organizer.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-gray-500 truncate">{event.organizer.name}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
