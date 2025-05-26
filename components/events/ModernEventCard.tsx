"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { Calendar, MapPin, Users, Heart, Star, TrendingUp, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface EventCardProps {
  event: any
  onSelect: () => void
  className?: string
  index?: number
}

export function ModernEventCard({ event, onSelect, className, index = 0 }: EventCardProps) {
  const getCategoryColor = (category: string) => {
    const colors = {
      Music: "bg-gradient-to-r from-purple-600 to-blue-600",
      Technology: "bg-gradient-to-r from-blue-600 to-cyan-600",
      Arts: "bg-gradient-to-r from-pink-600 to-rose-600",
      Food: "bg-gradient-to-r from-orange-600 to-red-600",
      Sports: "bg-gradient-to-r from-green-600 to-emerald-600",
      Business: "bg-gradient-to-r from-gray-600 to-slate-600",
    }
    return colors[category as keyof typeof colors] || "bg-gradient-to-r from-gray-500 to-gray-600"
  }

  const getCategoryIcon = (category: string) => {
    const icons = {
      Music: "🎵",
      Technology: "💻",
      Arts: "🎨",
      Food: "🍽️",
      Sports: "⚽",
      Business: "💼",
    }
    return icons[category as keyof typeof icons] || "🎪"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className={cn("cursor-pointer", className)}
      onClick={onSelect}
    >
      <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white overflow-hidden hover:bg-white/15 transition-all duration-300 group">
        <div className="relative h-48 overflow-hidden">
          <Image
            src={event.image || "/placeholder.svg?height=192&width=400&text=" + encodeURIComponent(event.title)}
            alt={event.title}
            fill
            style={{ objectFit: "cover" }}
            className="transition-transform duration-300 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className={`${getCategoryColor(event.category)} text-white`}>
              {getCategoryIcon(event.category)} {event.category}
            </Badge>
            {event.featured && (
              <Badge className="bg-yellow-500/90 text-white">
                <Star className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
            {event.trending && (
              <Badge className="bg-red-500/90 text-white">
                <TrendingUp className="h-3 w-3 mr-1" />
                Trending
              </Badge>
            )}
          </div>

          {/* Price */}
          <div className="absolute bottom-3 right-3">
            <div className="bg-black/70 rounded-full px-3 py-1 backdrop-blur-sm">
              <span className="text-white font-bold text-sm">{event.price}</span>
            </div>
          </div>

          {/* Rating */}
          <div className="absolute bottom-3 left-3">
            <div className="bg-black/70 rounded-full px-2 py-1 backdrop-blur-sm flex items-center">
              <Star className="h-3 w-3 text-yellow-400 mr-1" />
              <span className="text-white text-sm">{event.rating}</span>
            </div>
          </div>

          {/* Favorite Button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-3 right-3 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full"
            onClick={(e) => {
              e.stopPropagation()
              // Handle favorite toggle
            }}
          >
            <Heart className="h-4 w-4 text-white" />
          </Button>
        </div>

        <CardContent className="p-6">
          <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors">
            {event.title}
          </h3>

          <div className="space-y-2 mb-4 text-sm text-white/80">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-purple-400 flex-shrink-0" />
              <span>
                {event.date} • {event.time}
              </span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-purple-400 flex-shrink-0" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-purple-400 flex-shrink-0" />
              <span>{event.attendees.toLocaleString()} attending</span>
            </div>
            <div className="flex items-center">
              <Navigation className="h-4 w-4 mr-2 text-purple-400 flex-shrink-0" />
              <span>{event.distance} away</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Avatar className="h-6 w-6 mr-2">
                <AvatarImage src={event.organizer.avatar || "/placeholder.svg"} />
                <AvatarFallback className="text-xs">{event.organizer.name[0]}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-400 truncate">{event.organizer.name}</span>
              {event.organizer.verified && (
                <Badge variant="secondary" className="ml-2 text-xs bg-blue-500/20 text-blue-400">
                  ✓
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
