"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  MapPin,
  Calendar,
  Clock,
  Search,
  Navigation,
  Loader2,
  ExternalLink,
  Ticket,
  Info,
  Filter,
  Heart,
  AlertTriangle,
  Users,
  Star,
  Sparkles,
  Music,
  PartyPopper,
  Briefcase,
  Coffee,
  X,
} from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"

// Enhanced mock data with more realistic content
const MOCK_EVENTS = [
  {
    event_id: "1",
    name: "Neon Nights: Electronic Music Festival",
    description:
      "Experience the future of electronic music with world-renowned DJs, stunning visual effects, and an unforgettable atmosphere under the stars.",
    start_time: "2024-07-15 20:00:00",
    end_time: "2024-07-16 04:00:00",
    category: "Concerts",
    venue: {
      name: "Skyline Amphitheater",
      full_address: "1200 Harbor Blvd, Los Angeles, CA 90210",
      latitude: 34.0522,
      longitude: -118.2437,
    },
    thumbnail: "/placeholder.svg?height=300&width=400&text=Electronic+Festival",
    ticket_links: [{ source: "Ticketmaster", link: "https://example.com" }],
    info_links: [{ source: "Festival Website", link: "https://example.com" }],
    tags: ["electronic", "festival", "outdoor", "dj"],
    price: "$89",
    attendees: 2847,
    rating: 4.8,
  },
  {
    event_id: "2",
    name: "Future of AI Summit 2024",
    description:
      "Join industry leaders, researchers, and innovators as we explore the cutting-edge developments in artificial intelligence and machine learning.",
    start_time: "2024-07-20 09:00:00",
    end_time: "2024-07-20 18:00:00",
    category: "General Events",
    venue: {
      name: "Tech Innovation Center",
      full_address: "500 Innovation Drive, San Francisco, CA 94107",
      latitude: 37.7749,
      longitude: -122.4194,
    },
    thumbnail: "/placeholder.svg?height=300&width=400&text=AI+Summit",
    ticket_links: [{ source: "Eventbrite", link: "https://example.com" }],
    info_links: [{ source: "Summit Website", link: "https://example.com" }],
    tags: ["technology", "ai", "conference", "networking"],
    price: "$299",
    attendees: 1250,
    rating: 4.9,
  },
  {
    event_id: "3",
    name: "Sunset Rooftop Pool Party",
    description:
      "Dive into summer vibes at our exclusive rooftop pool party featuring top DJs, premium cocktails, and breathtaking city views.",
    start_time: "2024-07-18 15:00:00",
    end_time: "2024-07-18 22:00:00",
    category: "Day Parties",
    venue: {
      name: "Azure Sky Lounge",
      full_address: "888 Ocean Drive, Miami Beach, FL 33139",
      latitude: 25.7617,
      longitude: -80.1918,
    },
    thumbnail: "/placeholder.svg?height=300&width=400&text=Rooftop+Party",
    ticket_links: [{ source: "Party Tickets", link: "https://example.com" }],
    info_links: [],
    tags: ["party", "pool", "rooftop", "cocktails"],
    price: "$65",
    attendees: 420,
    rating: 4.6,
  },
  {
    event_id: "4",
    name: "Underground Bass Club Night",
    description:
      "Experience the underground scene with heavy bass, intimate vibes, and the city's best underground DJs in an exclusive venue.",
    start_time: "2024-07-19 22:00:00",
    end_time: "2024-07-20 06:00:00",
    category: "Club Events",
    venue: {
      name: "The Vault",
      full_address: "123 Underground St, New York, NY 10001",
      latitude: 40.7128,
      longitude: -74.006,
    },
    thumbnail: "/placeholder.svg?height=300&width=400&text=Club+Night",
    ticket_links: [{ source: "Club Tickets", link: "https://example.com" }],
    info_links: [],
    tags: ["club", "bass", "underground", "nightlife"],
    price: "$45",
    attendees: 180,
    rating: 4.7,
  },
  {
    event_id: "5",
    name: "Garden Party Brunch Experience",
    description:
      "Join us for an elegant garden party brunch with live acoustic music, artisanal food, and botanical cocktails in a beautiful outdoor setting.",
    start_time: "2024-07-21 11:00:00",
    end_time: "2024-07-21 16:00:00",
    category: "Parties",
    venue: {
      name: "Botanical Gardens Pavilion",
      full_address: "2000 Garden Way, Portland, OR 97205",
      latitude: 45.5152,
      longitude: -122.6784,
    },
    thumbnail: "/placeholder.svg?height=300&width=400&text=Garden+Brunch",
    ticket_links: [{ source: "Garden Events", link: "https://example.com" }],
    info_links: [],
    tags: ["brunch", "garden", "acoustic", "outdoor"],
    price: "$55",
    attendees: 95,
    rating: 4.9,
  },
]

const EVENT_CATEGORIES = ["Concerts", "General Events", "Day Parties", "Club Events", "Parties"]

const DATE_FILTERS = [
  { value: "any", label: "Any Date" },
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "this_weekend", label: "This Weekend" },
  { value: "next_week", label: "Next Week" },
]

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Concerts":
      return <Music className="h-4 w-4" />
    case "General Events":
      return <Briefcase className="h-4 w-4" />
    case "Day Parties":
      return <Coffee className="h-4 w-4" />
    case "Club Events":
      return <PartyPopper className="h-4 w-4" />
    case "Parties":
      return <Sparkles className="h-4 w-4" />
    default:
      return <Calendar className="h-4 w-4" />
  }
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case "Concerts":
      return "from-purple-500 to-pink-500"
    case "General Events":
      return "from-blue-500 to-cyan-500"
    case "Day Parties":
      return "from-yellow-500 to-orange-500"
    case "Club Events":
      return "from-red-500 to-pink-500"
    case "Parties":
      return "from-green-500 to-emerald-500"
    default:
      return "from-gray-500 to-gray-600"
  }
}

export default function EventsPage() {
  const [location, setLocation] = useState("")
  const [events, setEvents] = useState(MOCK_EVENTS)
  const [filteredEvents, setFilteredEvents] = useState(MOCK_EVENTS)
  const [selectedEvent, setSelectedEvent] = useState<(typeof MOCK_EVENTS)[0] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>(EVENT_CATEGORIES)
  const [selectedDate, setSelectedDate] = useState("any")
  const [showFilters, setShowFilters] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])

  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Filter events based on search query and selected categories
  useEffect(() => {
    let filtered = events

    // Filter by search query
    if (debouncedSearchQuery) {
      filtered = filtered.filter(
        (event) =>
          event.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          event.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          event.venue.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          event.tags.some((tag) => tag.toLowerCase().includes(debouncedSearchQuery.toLowerCase())),
      )
    }

    // Filter by categories
    filtered = filtered.filter((event) => selectedCategories.includes(event.category))

    setFilteredEvents(filtered)
  }, [events, debouncedSearchQuery, selectedCategories])

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  const formatDateTime = (dateTimeString: string) => {
    try {
      const date = new Date(dateTimeString)
      return {
        date: date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        time: date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }
    } catch {
      return { date: "TBD", time: "TBD" }
    }
  }

  const toggleFavorite = (eventId: string) => {
    setFavorites((prev) => (prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]))
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
          setLoading(false)
        },
        (error) => {
          setError("Unable to get your location")
          setLoading(false)
        },
      )
    } else {
      setError("Geolocation is not supported by this browser")
    }
  }

  const searchEvents = () => {
    if (!location.trim()) {
      setError("Please enter a location")
      return
    }

    setLoading(true)
    setError(null)

    // Simulate API call
    setTimeout(() => {
      setEvents(MOCK_EVENTS)
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-[#0A0B0F] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 bg-black/20 backdrop-blur-xl border-b border-white/10 sticky top-0"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-6">
              <motion.div whileHover={{ scale: 1.05 }} className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    DateAI Events
                  </h1>
                  <p className="text-xs text-gray-400">Discover amazing experiences</p>
                </div>
              </motion.div>

              <AnimatePresence>
                {filteredEvents.length > 0 && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                  >
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 px-3 py-1">
                      <Users className="h-3 w-3 mr-1" />
                      {filteredEvents.length} events found
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="border-white/20 text-white hover:bg-white/10 backdrop-blur-sm"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {showFilters && <X className="h-4 w-4 ml-2" />}
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Search Section */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-10 bg-black/10 backdrop-blur-sm border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 h-5 w-5 group-focus-within:text-purple-300 transition-colors" />
                <Input
                  placeholder="Enter city, zip code, or address..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && searchEvents()}
                  className="pl-12 h-14 bg-white/5 border-white/20 text-white placeholder-white/50 focus:bg-white/10 focus:border-purple-500/50 transition-all duration-300 rounded-xl backdrop-blur-sm"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            </div>
            <div className="flex gap-3">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  onClick={getCurrentLocation}
                  disabled={loading}
                  className="border-white/20 text-white hover:bg-white/10 backdrop-blur-sm h-14 px-6"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Use My Location
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={searchEvents}
                  disabled={loading || !location.trim()}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-14 px-8 shadow-lg shadow-purple-500/25"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                  Search Events
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 bg-black/10 backdrop-blur-sm border-b border-white/5 overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Search Events */}
                <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                  <Label className="text-white mb-3 block font-medium">Search Events</Label>
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 h-4 w-4" />
                    <Input
                      placeholder="Search by name, venue, or tags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder-white/50 focus:bg-white/10 focus:border-purple-500/50 transition-all duration-300 rounded-lg backdrop-blur-sm"
                    />
                  </div>
                </motion.div>

                {/* Date Filter */}
                <motion.div initial={{ x: 0, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                  <Label className="text-white mb-3 block font-medium">Date</Label>
                  <Select value={selectedDate} onValueChange={setSelectedDate}>
                    <SelectTrigger className="bg-white/5 border-white/20 text-white backdrop-blur-sm rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      {DATE_FILTERS.map((filter) => (
                        <SelectItem key={filter.value} value={filter.value} className="text-white hover:bg-gray-800">
                          {filter.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>

                {/* Category Filter */}
                <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                  <Label className="text-white mb-3 block font-medium">Event Categories</Label>
                  <div className="space-y-3 max-h-32 overflow-y-auto custom-scrollbar">
                    {EVENT_CATEGORIES.map((category) => (
                      <motion.div key={category} whileHover={{ x: 5 }} className="flex items-center space-x-3 group">
                        <Checkbox
                          id={category}
                          checked={selectedCategories.includes(category)}
                          onCheckedChange={() => handleCategoryToggle(category)}
                          className="border-white/20 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                        />
                        <Label
                          htmlFor={category}
                          className="text-sm text-white cursor-pointer flex items-center space-x-2 group-hover:text-purple-300 transition-colors"
                        >
                          {getCategoryIcon(category)}
                          <span>{category}</span>
                        </Label>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4"
          >
            <Alert variant="destructive" className="bg-red-900/20 border-red-500/50 backdrop-blur-sm">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-200">
                {error}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setError(null)}
                  className="ml-4 border-red-500/50 text-red-200 hover:bg-red-500/20"
                >
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map Placeholder */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 overflow-hidden shadow-2xl">
              <CardContent className="p-0">
                <div className="h-96 lg:h-[600px] bg-gradient-to-br from-purple-900/30 via-blue-900/30 to-pink-900/30 flex items-center justify-center relative overflow-hidden">
                  {/* Animated background elements */}
                  <div className="absolute inset-0">
                    <div className="absolute top-10 left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-xl animate-pulse" />
                    <div className="absolute bottom-10 right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-xl animate-pulse delay-1000" />
                    <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-pink-500/20 rounded-full blur-xl animate-pulse delay-2000" />
                  </div>

                  <div className="text-center text-white relative z-10">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="mb-6"
                    >
                      <MapPin className="h-20 w-20 mx-auto text-purple-400 opacity-60" />
                    </motion.div>
                    <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Interactive Event Map
                    </h3>
                    <p className="text-white/60 mb-6 max-w-md">
                      Discover events around you with our interactive map. Configure Mapbox API to enable full
                      functionality.
                    </p>

                    {filteredEvents.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-2xl">
                        {filteredEvents.slice(0, 6).map((event, index) => (
                          <motion.div
                            key={event.event_id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.05, y: -5 }}
                            className="bg-white/10 backdrop-blur-sm p-3 rounded-lg cursor-pointer hover:bg-white/20 transition-all duration-300 border border-white/10"
                            onClick={() => setSelectedEvent(event)}
                          >
                            <div
                              className={`w-full h-2 rounded-full bg-gradient-to-r ${getCategoryColor(event.category)} mb-2`}
                            />
                            <div className="font-medium text-sm truncate text-white">{event.name}</div>
                            <div className="text-white/60 text-xs truncate">{event.venue.name}</div>
                            <div className="flex items-center justify-between mt-2">
                              <Badge className="text-xs bg-white/20 text-white border-0">{event.category}</Badge>
                              <div className="flex items-center text-xs text-white/60">
                                <Star className="h-3 w-3 mr-1 text-yellow-400" />
                                {event.rating}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Event List/Details Panel */}
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="space-y-6"
          >
            <AnimatePresence mode="wait">
              {selectedEvent ? (
                /* Event Details */
                <motion.div
                  key="details"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-white/5 backdrop-blur-xl border-white/10 text-white shadow-2xl overflow-hidden">
                    <CardContent className="p-0">
                      {/* Event Image */}
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={selectedEvent.thumbnail || "/placeholder.svg"}
                          alt={selectedEvent.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Floating Action Buttons */}
                        <div className="absolute top-4 right-4 flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => toggleFavorite(selectedEvent.event_id)}
                            className="w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20"
                          >
                            <Heart
                              className={`h-5 w-5 ${
                                favorites.includes(selectedEvent.event_id) ? "fill-red-500 text-red-500" : "text-white"
                              }`}
                            />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setSelectedEvent(null)}
                            className="w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20"
                          >
                            <X className="h-5 w-5 text-white" />
                          </motion.button>
                        </div>

                        {/* Category Badge */}
                        <div className="absolute top-4 left-4">
                          <Badge
                            className={`bg-gradient-to-r ${getCategoryColor(selectedEvent.category)} text-white border-0 px-3 py-1`}
                          >
                            {getCategoryIcon(selectedEvent.category)}
                            <span className="ml-2">{selectedEvent.category}</span>
                          </Badge>
                        </div>

                        {/* Rating */}
                        <div className="absolute bottom-4 right-4 flex items-center bg-black/40 backdrop-blur-sm rounded-full px-3 py-1 border border-white/20">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" />
                          <span className="text-white text-sm font-medium">{selectedEvent.rating}</span>
                        </div>
                      </div>

                      <div className="p-6">
                        <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                          {selectedEvent.name}
                        </h3>

                        {/* Event Details */}
                        <div className="space-y-4 mb-6">
                          <div className="flex items-center text-sm group">
                            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3 group-hover:bg-purple-500/30 transition-colors">
                              <Calendar className="h-4 w-4 text-purple-400" />
                            </div>
                            <span className="text-gray-300">{formatDateTime(selectedEvent.start_time).date}</span>
                          </div>

                          <div className="flex items-center text-sm group">
                            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-500/30 transition-colors">
                              <Clock className="h-4 w-4 text-blue-400" />
                            </div>
                            <span className="text-gray-300">
                              {formatDateTime(selectedEvent.start_time).time}
                              {selectedEvent.end_time && ` - ${formatDateTime(selectedEvent.end_time).time}`}
                            </span>
                          </div>

                          <div className="flex items-start text-sm group">
                            <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center mr-3 mt-0.5 group-hover:bg-pink-500/30 transition-colors">
                              <MapPin className="h-4 w-4 text-pink-400" />
                            </div>
                            <div>
                              <div className="font-medium text-white">{selectedEvent.venue.name}</div>
                              <div className="text-gray-400 text-xs">{selectedEvent.venue.full_address}</div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-sm">
                              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mr-3">
                                <Users className="h-4 w-4 text-green-400" />
                              </div>
                              <span className="text-gray-300">{selectedEvent.attendees} attending</span>
                            </div>
                            <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                              {selectedEvent.price}
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <div className="mb-6">
                          <h4 className="font-semibold mb-3 text-white">About This Event</h4>
                          <p className="text-sm text-gray-300 leading-relaxed">{selectedEvent.description}</p>
                        </div>

                        {/* Tags */}
                        {selectedEvent.tags.length > 0 && (
                          <div className="mb-6">
                            <h4 className="font-semibold mb-3 text-white">Tags</h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedEvent.tags.map((tag, index) => (
                                <motion.div
                                  key={index}
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: index * 0.1 }}
                                >
                                  <Badge
                                    variant="outline"
                                    className="text-xs border-white/20 text-gray-300 hover:bg-white/10 transition-colors"
                                  >
                                    #{tag}
                                  </Badge>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-3">
                          {selectedEvent.ticket_links.map((link, index) => (
                            <motion.div key={index} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Button
                                asChild
                                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/25"
                              >
                                <a href={link.link} target="_blank" rel="noopener noreferrer">
                                  <Ticket className="h-4 w-4 mr-2" />
                                  Get Tickets - {link.source}
                                  <ExternalLink className="h-4 w-4 ml-2" />
                                </a>
                              </Button>
                            </motion.div>
                          ))}

                          {selectedEvent.info_links.map((link, index) => (
                            <motion.div key={index} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Button
                                variant="outline"
                                asChild
                                className="w-full border-white/20 text-white hover:bg-white/10 backdrop-blur-sm"
                              >
                                <a href={link.link} target="_blank" rel="noopener noreferrer">
                                  <Info className="h-4 w-4 mr-2" />
                                  More Info - {link.source}
                                  <ExternalLink className="h-4 w-4 ml-2" />
                                </a>
                              </Button>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                /* Event List */
                <motion.div
                  key="list"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-white/5 backdrop-blur-xl border-white/10 text-white shadow-2xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                        Events {location && `in ${location}`}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loading && (
                        <div className="space-y-4">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className="space-y-2"
                            >
                              <Skeleton className="h-4 w-3/4 bg-white/20" />
                              <Skeleton className="h-3 w-1/2 bg-white/20" />
                              <Skeleton className="h-3 w-2/3 bg-white/20" />
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {!loading && filteredEvents.length === 0 && events.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-center py-12"
                        >
                          <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="h-8 w-8 text-purple-400" />
                          </div>
                          <p className="text-gray-400 mb-4">No events match your current filters</p>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSearchQuery("")
                              setSelectedCategories(EVENT_CATEGORIES)
                            }}
                            className="border-white/20 text-white hover:bg-white/10 backdrop-blur-sm"
                          >
                            Clear Filters
                          </Button>
                        </motion.div>
                      )}

                      {!loading && (
                        <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                          {filteredEvents.map((event, index) => (
                            <motion.div
                              key={event.event_id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              whileHover={{ scale: 1.02, x: 5 }}
                              className="p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-all duration-300 border border-white/10 backdrop-blur-sm group"
                              onClick={() => setSelectedEvent(event)}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <h4 className="font-medium line-clamp-2 flex-1 text-white group-hover:text-purple-300 transition-colors">
                                  {event.name}
                                </h4>
                                <div className="flex items-center gap-2 ml-3">
                                  <Badge
                                    className={`text-xs bg-gradient-to-r ${getCategoryColor(event.category)} text-white border-0`}
                                  >
                                    {getCategoryIcon(event.category)}
                                  </Badge>
                                  <motion.button
                                    whileHover={{ scale: 1.2 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      toggleFavorite(event.event_id)
                                    }}
                                    className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                                  >
                                    <Heart
                                      className={`h-3 w-3 ${
                                        favorites.includes(event.event_id)
                                          ? "fill-red-500 text-red-500"
                                          : "text-gray-400"
                                      }`}
                                    />
                                  </motion.button>
                                </div>
                              </div>

                              <div className="space-y-2 text-sm text-gray-300">
                                <div className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-2 text-purple-400" />
                                  <span>{formatDateTime(event.start_time).date}</span>
                                </div>

                                <div className="flex items-center">
                                  <MapPin className="h-3 w-3 mr-2 text-pink-400" />
                                  <span className="line-clamp-1">{event.venue.name}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <Users className="h-3 w-3 mr-2 text-green-400" />
                                    <span className="text-xs">{event.attendees} attending</span>
                                  </div>
                                  <div className="flex items-center">
                                    <Star className="h-3 w-3 mr-1 text-yellow-400" />
                                    <span className="text-xs">{event.rating}</span>
                                  </div>
                                  <div className="font-bold text-green-400">{event.price}</div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(147, 51, 234, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(147, 51, 234, 0.7);
        }
      `}</style>
    </div>
  )
}
