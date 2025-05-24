"use client"

import { motion } from "framer-motion"
import { Calendar, Clock, MapPin, Users, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { EventDetailProps } from "@/components/event-detail-modal"

interface FeaturedEventHeroProps {
  event: EventDetailProps
  onExplore: () => void
}

export function FeaturedEventHero({ event, onExplore }: FeaturedEventHeroProps) {
  return (
    <div className="relative h-[60vh] min-h-[500px] overflow-hidden rounded-2xl">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={event.image || "/placeholder.svg"} 
          alt={event.title} 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            <motion.div 
              initial={{ opacity: 0, y: 30 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.8 }}
            >
              <Badge className="bg-purple-600/90 text-white mb-4 text-sm px-3 py-1">
                ⭐ Featured Event
              </Badge>

              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                {event.title}
              </h1>

              <p className="text-xl text-gray-200 mb-8 leading-relaxed">
                {event.description}
              </p>

              <div className="flex flex-wrap items-center gap-6 mb-8 text-white">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-purple-400" />
                  <span className="font-medium">{event.date}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-purple-400" />
                  <span className="font-medium">{event.time}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-purple-400" />
                  <span className="font-medium">{event.location}</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-400" />
                  <span className="font-medium">{event.attendees.toLocaleString()} attending</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg font-semibold"
                  onClick={onExplore}
                >
                  Explore Events Near You
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 px-8 py-3 text-lg backdrop-blur-sm"
                >
                  Learn More
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Floating Stats */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="absolute top-8 right-8 bg-white/10 backdrop-blur-md rounded-xl p-6 text-white hidden lg:block"
      >
        <div className="text-center">
          <div className="text-3xl font-bold text-purple-400">
            {event.attendees.toLocaleString()}
          </div>
          <div className="text-sm text-gray-300">People Attending</div>
        </div>
        <Separator className="my-4 bg-white/20" />
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{event.price}</div>
          <div className="text-sm text-gray-300">Ticket Price</div>
        </div>
      </motion.div>
    </div>
  )
}
