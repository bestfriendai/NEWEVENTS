"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  MapPin,
  Calendar,
  Heart,
  Ticket,
  Star,
  Navigation,
  X,
  Loader2,
  Target,
  Clock,
  DollarSign,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

// Simple event interface
interface Event {
  id: string
  title: string
  description: string
  category: string
  date: string
  time: string
  venue: string
  city: string
  state: string
  price: string
  isFree: boolean
  image: string
  rating: number
  organizer: string
  distance: number
}

// Sample events data
const SAMPLE_EVENTS: Event[] = [
  {
    id: "1",
    title: "Summer Music Festival 2024",
    description: "Join us for an amazing outdoor music festival featuring top artists from around the world.",
    category: "Music",
    date: "2024-07-15",
    time: "18:00",
    venue: "Central Park",
    city: "New York",
    state: "NY",
    price: "$75 - $150",
    isFree: false,
    image: "/placeholder.svg?height=300&width=400&text=Music+Festival",
    rating: 4.8,
    organizer: "Music Events Co",
    distance: 2.5,
  },
  {
    id: "2",
    title: "Tech Conference 2024",
    description: "Learn about the latest in technology and innovation from industry leaders.",
    category: "Business",
    date: "2024-08-20",
    time: "09:00",
    venue: "Convention Center",
    city: "San Francisco",
    state: "CA",
    price: "$200 - $500",
    isFree: false,
    image: "/placeholder.svg?height=300&width=400&text=Tech+Conference",
    rating: 4.6,
    organizer: "Tech Events",
    distance: 5.2,
  },
  {
    id: "3",
    title: "Comedy Night Live",
    description: "Laugh out loud with the best comedians in the city.",
    category: "Comedy",
    date: "2024-06-30",
    time: "20:00",
    venue: "Comedy Club Downtown",
    city: "Chicago",
    state: "IL",
    price: "$25 - $50",
    isFree: false,
    image: "/placeholder.svg?height=300&width=400&text=Comedy+Night",
    rating: 4.9,
    organizer: "Laugh Factory",
    distance: 1.8,
  },
  {
    id: "4",
    title: "Art Gallery Opening",
    description: "Discover amazing contemporary art from local and international artists.",
    category: "Arts",
    date: "2024-07-05",
    time: "18:30",
    venue: "Modern Art Gallery",
    city: "Los Angeles",
    state: "CA",
    price: "Free",
    isFree: true,
    image: "/placeholder.svg?height=300&width=400&text=Art+Gallery",
    rating: 4.4,
    organizer: "Art Collective",
    distance: 3.1,
  },
  {
    id: "5",
    title: "Family Fun Day",
    description: "A day full of activities for the whole family.",
    category: "Family",
    date: "2024-07-10",
    time: "10:00",
    venue: "City Park",
    city: "Austin",
    state: "TX",
    price: "Free",
    isFree: true,
    image: "/placeholder.svg?height=300&width=400&text=Family+Fun",
    rating: 4.7,
    organizer: "City Recreation",
    distance: 4.3,
  },
  {
    id: "6",
    title: "Basketball Championship",
    description: "Watch the best teams compete in this exciting championship game.",
    category: "Sports",
    date: "2024-08-15",
    time: "19:00",
    venue: "Sports Arena",
    city: "Miami",
    state: "FL",
    price: "$50 - $200",
    isFree: false,
    image: "/placeholder.svg?height=300&width=400&text=Basketball",
    rating: 4.5,
    organizer: "Sports League",
    distance: 6.7,
  },
]

const CATEGORIES = [
  { id: "all", label: "All Events", icon: "🎪" },
  { id: "Music", label: "Music", icon: "🎵" },
  { id: "Sports", label: "Sports", icon: "⚽" },
  { id: "Arts", label: "Arts", icon: "🎨" },
  { id: "Comedy", label: "Comedy", icon: "😂" },
  { id: "Family", label: "Family", icon: "👨‍👩‍👧‍👦" },
  { id: "Business", label: "Business", icon: "💼" },
]

const CITIES = ["New York, NY", "Los Angeles, CA", "Chicago, IL", "San Francisco, CA", "Miami, FL", "Austin, TX"]

export default function MinimalEventsExplorer() {
  const [selectedCity, setSelectedCity] = useState<string>("")
  const [showCitySelector, setShowCitySelector] = useState(true)
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isLoading, setIsLoading] = useState(false)

  // Load events when city is selected
  useEffect(() => {
    if (selectedCity && !showCitySelector) {
      setIsLoading(true)
      // Simulate loading
      setTimeout(() => {
        setEvents(SAMPLE_EVENTS)
        setIsLoading(false)
      }, 1000)
    }
  }, [selectedCity, showCitySelector])

  // Filter events
  useEffect(() => {
    let filtered = events

    if (searchQuery) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.venue.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((event) => event.category === selectedCategory)
    }

    // Sort by distance
    filtered.sort((a, b) => a.distance - b.distance)

    setFilteredEvents(filtered)
  }, [events, searchQuery, selectedCategory])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  // City Selector
  if (showCitySelector) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl"
        >
          <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-purple-400" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Find Events Near You</h1>
                <p className="text-gray-400 text-lg">Choose your city to discover amazing events</p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {CITIES.map((city) => (
                    <Button
                      key={city}
                      onClick={() => {
                        setSelectedCity(city)
                        setShowCitySelector(false)
                      }}
                      className="h-14 bg-white/10 hover:bg-white/20 border border-white/20 text-white justify-start text-lg"
                    >
                      <MapPin className="h-5 w-5 mr-3" />
                      {city}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">Events Explorer</h1>
              <Badge className="bg-green-600/80 text-white">{filteredEvents.length} events found</Badge>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCitySelector(true)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <MapPin className="h-4 w-4 mr-2" />
              {selectedCity}
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Categories */}
      <div className="bg-black/10 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 h-5 w-5" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-white/10 border-white/20 text-white placeholder-white/70 focus:bg-white/20"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {CATEGORIES.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={`whitespace-nowrap ${
                  selectedCategory === category.id
                    ? "bg-purple-600 text-white"
                    : "border-white/20 text-white hover:bg-white/10"
                }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
            <p className="text-white text-lg">Finding events in {selectedCity}...</p>
          </div>
        </div>
      )}

      {/* Events Grid */}
      {!isLoading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="cursor-pointer"
                onClick={() => setSelectedEvent(event)}
              >
                <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white overflow-hidden hover:bg-white/15 transition-all h-full">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={event.image || "/placeholder.svg"}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                    {/* Category Badge */}
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-purple-600 text-white">
                        {CATEGORIES.find((cat) => cat.id === event.category)?.icon} {event.category}
                      </Badge>
                    </div>

                    {/* Price */}
                    <div className="absolute bottom-3 right-3">
                      <div className="bg-black/70 rounded-full px-3 py-1">
                        <span className="text-white font-bold text-sm">{event.price}</span>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="absolute bottom-3 left-3">
                      <div className="bg-black/70 rounded-full px-2 py-1 flex items-center">
                        <Star className="h-3 w-3 text-yellow-400 mr-1" />
                        <span className="text-white text-sm">{event.rating}</span>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2">{event.title}</h3>

                    <div className="space-y-2 mb-4 text-sm text-white/80">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-purple-400" />
                        <span>
                          {formatDate(event.date)} • {formatTime(event.time)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-purple-400" />
                        <span>{event.venue}</span>
                      </div>
                      <div className="flex items-center">
                        <Navigation className="h-4 w-4 mr-2 text-purple-400" />
                        <span>{event.distance} miles away</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarFallback className="text-xs bg-purple-600">{event.organizer[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-400 truncate">{event.organizer}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredEvents.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-white mb-2">No Events Found</h3>
              <p className="text-gray-400 mb-4">Try adjusting your search or category filters</p>
              <Button
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory("all")
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Event Details Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto"
          >
            {/* Event Header */}
            <div className="relative h-80 overflow-hidden">
              <img
                src={selectedEvent.image || "/placeholder.svg"}
                alt={selectedEvent.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

              {/* Close Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 h-10 w-10 p-0 bg-black/50 hover:bg-black/70 rounded-full"
              >
                <X className="h-4 w-4 text-white" />
              </Button>

              {/* Event Info */}
              <div className="absolute bottom-6 left-6 right-6">
                <Badge className="bg-purple-600 text-white mb-3">
                  {CATEGORIES.find((cat) => cat.id === selectedEvent.category)?.icon} {selectedEvent.category}
                </Badge>
                <h1 className="text-2xl font-bold text-white mb-2">{selectedEvent.title}</h1>
                <div className="flex items-center text-white/90">
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarFallback className="bg-purple-600">{selectedEvent.organizer[0]}</AvatarFallback>
                  </Avatar>
                  <span>by {selectedEvent.organizer}</span>
                </div>
              </div>
            </div>

            {/* Event Details */}
            <div className="p-6">
              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center text-gray-600 mb-1">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="text-sm">Date & Time</span>
                  </div>
                  <div className="font-semibold">{formatDate(selectedEvent.date)}</div>
                  <div className="text-sm text-gray-600">{formatTime(selectedEvent.time)}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center text-gray-600 mb-1">
                    <DollarSign className="h-4 w-4 mr-2" />
                    <span className="text-sm">Price</span>
                  </div>
                  <div className="font-semibold text-green-600">{selectedEvent.price}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center text-gray-600 mb-1">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="text-sm">Location</span>
                  </div>
                  <div className="font-semibold">{selectedEvent.venue}</div>
                  <div className="text-sm text-gray-600">{selectedEvent.distance} miles away</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center text-gray-600 mb-1">
                    <Star className="h-4 w-4 mr-2" />
                    <span className="text-sm">Rating</span>
                  </div>
                  <div className="font-semibold">{selectedEvent.rating}</div>
                  <div className="text-sm text-gray-600">out of 5.0</div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">About This Event</h3>
                <p className="text-gray-700">{selectedEvent.description}</p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button className="w-full bg-purple-600 hover:bg-purple-700 h-12">
                  <Ticket className="h-4 w-4 mr-2" />
                  Get Tickets - {selectedEvent.price}
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-10">
                    <Heart className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button variant="outline" className="h-10">
                    <Clock className="h-4 w-4 mr-2" />
                    Remind Me
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
