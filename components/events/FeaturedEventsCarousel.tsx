"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Heart, Star, MapPin, Calendar } from "lucide-react"

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
}

interface FeaturedEventsCarouselProps {
  events: Event[]
  onEventSelect: (event: Event) => void
  onToggleFavorite: (eventId: string) => void
  favoriteEvents: Set<string>
}

export function FeaturedEventsCarousel({
  events,
  onEventSelect,
  onToggleFavorite,
  favoriteEvents,
}: FeaturedEventsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, events.length - 2))
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.max(1, events.length - 2)) % Math.max(1, events.length - 2))
  }

  if (events.length === 0) return null

  return (
    <div className="relative">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" onClick={prevSlide} disabled={events.length <= 3} className="flex-shrink-0">
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 33.333}%)` }}
          >
            {events.map((event) => (
              <div key={event.id} className="w-1/3 flex-shrink-0 px-2">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-4">
                    <div className="relative mb-4">
                      <img
                        src={
                          event.image ||
                          `/placeholder.svg?height=160&width=280&query=${encodeURIComponent(event.title)}`
                        }
                        alt={event.title}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleFavorite(event.id)
                        }}
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            favoriteEvents.has(event.id) ? "fill-red-500 text-red-500" : "text-gray-600"
                          }`}
                        />
                      </Button>
                      <Badge className="absolute bottom-2 left-2 bg-orange-500">Featured</Badge>
                    </div>

                    <div onClick={() => onEventSelect(event)}>
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">{event.title}</h3>

                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(event.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{event.rating}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 text-sm text-gray-600 mb-3">
                        <MapPin className="h-4 w-4" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-lg">{event.price === 0 ? "Free" : `$${event.price}`}</span>
                        <Badge variant="secondary">{event.attendees} attending</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={nextSlide} disabled={events.length <= 3} className="flex-shrink-0">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
