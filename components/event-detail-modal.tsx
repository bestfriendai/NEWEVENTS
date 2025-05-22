"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Calendar, Clock, MapPin, DollarSign, Heart, Share2, Users, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EventMap } from "@/components/event-map"

export interface EventDetailProps {
  id: number
  title: string
  description: string
  category: string
  date: string
  time: string
  location: string
  address: string
  price: string
  image: string
  organizer: {
    name: string
    avatar: string
  }
  attendees: number
  isFavorite: boolean
}

interface EventDetailModalProps {
  event: EventDetailProps
  onClose: () => void
  onToggleFavorite?: (eventId: number) => void
}

export function EventDetailModal({ event, onClose, onToggleFavorite }: EventDetailModalProps) {
  const [isFavorite, setIsFavorite] = useState(event.isFavorite)
  const [showFullDescription, setShowFullDescription] = useState(false)

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite)
    if (onToggleFavorite) {
      onToggleFavorite(event.id)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: event.title,
          text: `Check out this event: ${event.title}`,
          url: window.location.href,
        })
        .catch((error) => console.log("Error sharing", error))
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => alert("Link copied to clipboard!"))
        .catch((error) => console.error("Could not copy text: ", error))
    }
  }

  // Truncate description if it's too long
  const shortDescription =
    event.description.length > 250 ? `${event.description.substring(0, 250)}...` : event.description

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-auto rounded-2xl bg-[#1A1D25] shadow-2xl"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Event image */}
          <div className="relative h-64 md:h-80 w-full overflow-hidden">
            <img src={event.image || "/placeholder.svg"} alt={event.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A1D25] to-transparent" />
          </div>

          {/* Event content */}
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                {/* Category */}
                <div className="inline-block px-3 py-1 mb-4 text-xs font-medium rounded-full bg-purple-500/20 text-purple-400">
                  {event.category}
                </div>

                {/* Title */}
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">{event.title}</h2>

                {/* Description */}
                <div className="mb-6 text-gray-300">
                  <p>{showFullDescription ? event.description : shortDescription}</p>
                  {event.description.length > 250 && (
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="mt-2 text-purple-400 hover:text-purple-300 text-sm font-medium"
                    >
                      {showFullDescription ? "Show less" : "Read more"}
                    </button>
                  )}
                </div>

                {/* Event details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center text-gray-300">
                    <Calendar className="h-5 w-5 mr-3 text-purple-400" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <Clock className="h-5 w-5 mr-3 text-purple-400" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <MapPin className="h-5 w-5 mr-3 text-purple-400" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <DollarSign className="h-5 w-5 mr-3 text-purple-400" />
                    <span>{event.price}</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <Users className="h-5 w-5 mr-3 text-purple-400" />
                    <span>{event.attendees} attending</span>
                  </div>
                </div>

                {/* Organizer */}
                <div className="flex items-center mb-6">
                  <img
                    src={event.organizer.avatar || "/placeholder.svg"}
                    alt={event.organizer.name}
                    className="h-10 w-10 rounded-full mr-3 object-cover"
                  />
                  <div>
                    <p className="text-sm text-gray-400">Organized by</p>
                    <p className="text-white font-medium">{event.organizer.name}</p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-4">
                  <Button className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Get Tickets
                  </Button>
                  <Button
                    variant="outline"
                    className={`flex-1 border-gray-700 ${
                      isFavorite ? "bg-purple-500/20 text-purple-400 border-purple-500/30" : "text-gray-300"
                    }`}
                    onClick={handleToggleFavorite}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${isFavorite ? "fill-purple-400" : ""}`} />
                    {isFavorite ? "Favorited" : "Add to Favorites"}
                  </Button>
                  <Button variant="outline" className="flex-1 border-gray-700 text-gray-300" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>

              {/* Map */}
              <div className="w-full md:w-2/5">
                <h3 className="text-lg font-medium text-white mb-3">Location</h3>
                <EventMap address={event.address} height="250px" />
                <p className="mt-2 text-sm text-gray-400">{event.address}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
