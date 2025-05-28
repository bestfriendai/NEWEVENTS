"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, Share2, Star, MapPin, Clock, Users, ExternalLink } from "lucide-react"

interface Event {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  category: string
  price: number
  image: string
  attendees: number
  rating: number
  isFeatured: boolean
  tags?: string[]
  organizer?: string
}

interface EnhancedEventCardProps {
  event: Event
  isFavorite: boolean
  onToggleFavorite: () => void
  onShare: () => void
  onClick: () => void
}

export function EnhancedEventCard({ event, isFavorite, onToggleFavorite, onShare, onClick }: EnhancedEventCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      day: date.getDate(),
      month: date.toLocaleDateString("en-US", { month: "short" }),
      weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
    }
  }

  const dateInfo = formatDate(event.date)

  return (
    <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
      <div className="relative">
        <img
          src={event.image || `/placeholder.svg?height=200&width=400&query=${encodeURIComponent(event.title)}`}
          alt={event.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Date Badge */}
        <div className="absolute top-4 left-4 bg-white rounded-lg p-2 shadow-lg">
          <div className="text-center">
            <div className="text-xs text-gray-500 uppercase">{dateInfo.month}</div>
            <div className="text-lg font-bold text-gray-900">{dateInfo.day}</div>
            <div className="text-xs text-gray-500">{dateInfo.weekday}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="bg-white/80 hover:bg-white backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation()
              onToggleFavorite()
            }}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="bg-white/80 hover:bg-white backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation()
              onShare()
            }}
          >
            <Share2 className="h-4 w-4 text-gray-600" />
          </Button>
        </div>

        {/* Featured Badge */}
        {event.isFeatured && <Badge className="absolute bottom-4 left-4 bg-orange-500">Featured</Badge>}

        {/* Category Badge */}
        <Badge variant="secondary" className="absolute bottom-4 right-4 bg-white/90 text-gray-700">
          {event.category}
        </Badge>
      </div>

      <CardContent className="p-6" onClick={onClick}>
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
            {event.title}
          </h3>
          <div className="flex items-center space-x-1 ml-2">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{event.rating}</span>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>{event.attendees} attending</span>
          </div>
        </div>

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {event.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {event.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{event.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-gray-900">{event.price === 0 ? "Free" : `$${event.price}`}</span>
            {event.organizer && <p className="text-xs text-gray-500">by {event.organizer}</p>}
          </div>
          <Button size="sm" className="group-hover:bg-blue-600 transition-colors">
            View Details
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
