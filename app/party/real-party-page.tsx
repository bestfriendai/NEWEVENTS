"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Music,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Users,
  AlertCircle,
  RefreshCw,
  PartyPopper,
  Sparkles,
  Zap,
  Sun,
  MapPin,
  Heart,
  Star,
  Clock,
  Loader2,
} from "lucide-react"
import { AppLayout } from "@/components/app-layout"
import { useRealEvents } from "@/hooks/use-real-events"
import type { Event } from "@/types/event.types"

// Party-specific categories
const PARTY_CATEGORIES = [
  { id: "all", name: "All Parties", icon: PartyPopper, color: "bg-purple-500" },
  { id: "nightlife", name: "Nightlife", icon: Zap, color: "bg-blue-500" },
  { id: "festival", name: "Festivals", icon: Sparkles, color: "bg-pink-500" },
  { id: "concert", name: "Concerts", icon: Music, color: "bg-green-500" },
  { id: "club", name: "Club Events", icon: Users, color: "bg-red-500" },
  { id: "outdoor", name: "Outdoor", icon: Sun, color: "bg-yellow-500" },
]

// Sort options for party events
const SORT_OPTIONS = [
  { value: "date", label: "Date" },
  { value: "popularity", label: "Popularity" },
  { value: "price", label: "Price" },
  { value: "rating", label: "Rating" },
]

function PartyEventCard({ event }: { event: Event }) {
  const [isFavorite, setIsFavorite] = useState(false)

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = date.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays < 0) {
        return "Past Event"
      } else if (diffDays === 0) {
        return "Today"
      } else if (diffDays === 1) {
        return "Tomorrow"
      } else if (diffDays < 7) {
        return `In ${diffDays} days`
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      }
    } catch {
      return dateString
    }
  }

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } catch {
      return ""
    }
  }

  const formatPrice = (event: Event) => {
    if (!event.price) return "Free"
    if (event.price.min === 0) return "Free"
    if (event.price.min === event.price.max) {
      return `$${event.price.min}`
    }
    return `$${event.price.min}${event.price.max ? ` - $${event.price.max}` : '+'}`
  }

  const getPartyVibe = (event: Event) => {
    const title = event.title.toLowerCase()
    const description = event.description?.toLowerCase() || ""
    const category = event.category.toLowerCase()

    if (title.includes("festival") || description.includes("festival")) return "🎪 Festival"
    if (title.includes("club") || description.includes("nightclub")) return "🕺 Club Night"
    if (title.includes("rooftop") || description.includes("rooftop")) return "🏙️ Rooftop"
    if (title.includes("beach") || description.includes("beach")) return "🏖️ Beach Party"
    if (category.includes("music") || title.includes("concert")) return "🎵 Live Music"
    if (title.includes("dance") || description.includes("dance")) return "💃 Dance Party"
    return "🎉 Party"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="group"
    >
      <Card className="overflow-hidden bg-gradient-to-br from-[#1A1D25]/80 to-[#2A1A2E]/60 border-purple-500/20 hover:border-purple-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
        <div className="relative">
          {event.image && (
            <div className="relative overflow-hidden">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=200&fit=crop&q=80`
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 via-transparent to-transparent" />
            </div>
          )}
          
          {/* Floating badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            <Badge className="bg-purple-600/90 text-white text-xs font-semibold">
              {getPartyVibe(event)}
            </Badge>
            <Badge variant="secondary" className="bg-black/60 text-white text-xs">
              {event.source}
            </Badge>
          </div>

          <div className="absolute top-3 right-3">
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-full backdrop-blur-sm transition-all ${
                isFavorite
                  ? "bg-red-500/80 text-white hover:bg-red-600"
                  : "bg-black/30 text-white hover:bg-black/50"
              }`}
              onClick={() => setIsFavorite(!isFavorite)}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
            </Button>
          </div>

          {/* Date overlay */}
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1">
            <div className="flex items-center gap-2 text-white text-sm">
              <Calendar className="h-3 w-3" />
              <span className="font-medium">{formatDate(event.date)}</span>
            </div>
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          <div className="space-y-2">
            <h3 className="font-bold text-white text-lg line-clamp-2 group-hover:text-purple-300 transition-colors">
              {event.title}
            </h3>
            <p className="text-gray-400 text-sm line-clamp-2">
              {event.description || "Get ready for an amazing party experience!"}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Clock className="h-3 w-3 text-purple-400" />
              <span>{formatTime(event.date)}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-300">
              <MapPin className="h-3 w-3 text-purple-400" />
              <span className="line-clamp-1">
                {event.location.name || event.location.city || "Venue TBD"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-green-400">
                {formatPrice(event)}
              </span>
              {event.rating && (
                <div className="flex items-center gap-1 text-sm text-yellow-400">
                  <Star className="h-3 w-3 fill-current" />
                  <span>{event.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            <Badge 
              variant="outline" 
              className="text-purple-300 border-purple-400/50 bg-purple-500/10"
            >
              {event.category}
            </Badge>
          </div>

          <div className="flex gap-2 pt-2">
            {event.url && (
              <Button
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
                onClick={() => window.open(event.url, '_blank')}
              >
                Get Tickets
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
            >
              <Users className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function RealPartyPage() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [searchQuery, setSearchQuery] = useState("")
  const [location, setLocation] = useState("United States")

  // Use real events hook specifically for party events
  const {
    partyEvents,
    featuredEvents,
    isPartyLoading,
    isFeaturedLoading,
    error,
    loadPartyEvents,
    refreshEvents
  } = useRealEvents()

  // Filter and sort party events
  const filteredPartyEvents = useMemo(() => {
    let filtered = [...partyEvents]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.location.city?.toLowerCase().includes(query)
      )
    }

    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(event => {
        const title = event.title.toLowerCase()
        const description = event.description?.toLowerCase() || ""
        const category = event.category.toLowerCase()

        switch (selectedCategory) {
          case "nightlife":
            return title.includes("club") || title.includes("nightlife") || category.includes("music")
          case "festival":
            return title.includes("festival") || description.includes("festival")
          case "concert":
            return title.includes("concert") || category.includes("music")
          case "club":
            return title.includes("club") || title.includes("nightclub")
          case "outdoor":
            return title.includes("outdoor") || title.includes("beach") || title.includes("rooftop")
          default:
            return true
        }
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        case "popularity":
        case "rating":
          return (b.rating || 0) - (a.rating || 0)
        case "price":
          const priceA = a.price?.min || 0
          const priceB = b.price?.min || 0
          return priceA - priceB
        default:
          return 0
      }
    })

    return filtered
  }, [partyEvents, searchQuery, selectedCategory, sortBy])

  // Handle search
  const handleSearch = async () => {
    await loadPartyEvents(location, 100)
  }

  // Load party events on mount
  useEffect(() => {
    loadPartyEvents(location, 100)
  }, [location])

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#0A0B10] via-[#1A0B2E] to-[#0F1419]">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-600/10 to-transparent" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1920&h=1080&fit=crop&q=80')] bg-cover bg-center opacity-10" />
          
          <div className="relative container mx-auto px-4 py-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 bg-purple-600/20 backdrop-blur-sm rounded-full px-4 py-2 text-purple-300 text-sm font-medium">
                <PartyPopper className="h-4 w-4" />
                Live Party Events
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white">
                Real-Time
                <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 bg-clip-text text-transparent">
                  Party Events
                </span>
              </h1>
              
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Discover the hottest parties, festivals, and nightlife events happening right now
              </p>
            </motion.div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#1A1D25]/60 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-6 space-y-6"
          >
            {/* Search Bar */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input
                  placeholder="Search parties, clubs, festivals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#0F1116] border-gray-700 text-white"
                />
              </div>
              <Button 
                onClick={handleSearch}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                disabled={isPartyLoading}
              >
                {isPartyLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                onClick={refreshEvents}
                className="border-purple-500/50 text-purple-400"
                disabled={isPartyLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isPartyLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              {PARTY_CATEGORIES.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`${
                    selectedCategory === category.id
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                      : "border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
                  }`}
                >
                  <category.icon className="h-4 w-4 mr-2" />
                  {category.name}
                </Button>
              ))}
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-4">
              <span className="text-gray-400 text-sm">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48 bg-[#0F1116] border-gray-700 text-white">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1D25] border-gray-700">
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-white">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-900/20 border border-red-500/50 rounded-lg p-4"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div>
                  <p className="text-red-400 font-medium">Error loading party events</p>
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Featured Party Events */}
          {!isFeaturedLoading && featuredEvents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-purple-400" />
                Featured Party Events
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {featuredEvents.slice(0, 4).map((event) => (
                  <PartyEventCard key={event.id} event={event} />
                ))}
              </div>
            </motion.div>
          )}

          {/* All Party Events */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                Party Events ({filteredPartyEvents.length})
              </h2>
              <Button
                onClick={() => loadPartyEvents(location, 200)}
                variant="outline"
                className="border-purple-500/50 text-purple-400"
                disabled={isPartyLoading}
              >
                Load More
              </Button>
            </div>

            {/* Loading State */}
            {isPartyLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto" />
                  <p className="text-gray-400">Loading party events...</p>
                </div>
              </div>
            )}

            {/* Events Grid */}
            {!isPartyLoading && filteredPartyEvents.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredPartyEvents.map((event) => (
                  <PartyEventCard key={event.id} event={event} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isPartyLoading && filteredPartyEvents.length === 0 && (
              <div className="text-center py-12 space-y-4">
                <PartyPopper className="h-12 w-12 text-gray-500 mx-auto" />
                <h3 className="text-xl font-semibold text-gray-400">No party events found</h3>
                <p className="text-gray-500">
                  Try adjusting your search criteria or check back later for new party events.
                </p>
                <Button
                  onClick={() => loadPartyEvents(location, 100)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Party Events
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AppLayout>
  )
}