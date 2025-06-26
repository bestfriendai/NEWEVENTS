"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { AppLayout } from "@/components/app-layout"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LocationSelector } from "@/components/location-selector"
import { useLocation } from "@/hooks/use-location"
import { useRealEvents } from "@/hooks/use-real-events"
import { useFavoriteToggle } from "@/contexts/FavoritesContext"
import type { Event } from "@/types/event.types"
import { 
  Search, 
  MapPin, 
  Calendar, 
  Music, 
  Palette, 
  Trophy, 
  Utensils,
  Briefcase,
  Film,
  Heart,
  TrendingUp,
  Users,
  Sparkles,
  ArrowRight,
  Loader2
} from "lucide-react"

// Event categories with icons and colors
const CATEGORIES = [
  { id: "Music", label: "Music", icon: Music, color: "from-purple-600 to-pink-600" },
  { id: "Arts & Culture", label: "Arts", icon: Palette, color: "from-pink-600 to-rose-600" },
  { id: "Sports", label: "Sports", icon: Trophy, color: "from-green-600 to-emerald-600" },
  { id: "Food & Drink", label: "Food", icon: Utensils, color: "from-orange-600 to-red-600" },
  { id: "Business", label: "Business", icon: Briefcase, color: "from-gray-600 to-slate-600" },
  { id: "Entertainment", label: "Entertainment", icon: Film, color: "from-yellow-600 to-orange-600" },
]

function EventCard({ event }: { event: Event }) {
  const { toggleFavorite, isFavorite } = useFavoriteToggle()
  const isFav = isFavorite(event.id.toString())

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="group cursor-pointer"
    >
      <Card className="overflow-hidden bg-[#1A1D25]/60 border-gray-800/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 h-full">
        <div className="relative h-48">
          {event.image && (
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop&q=80`
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute top-3 right-3">
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-full backdrop-blur-sm transition-colors ${
                isFav
                  ? "bg-red-500/80 text-white hover:bg-red-600"
                  : "bg-black/30 text-white hover:bg-black/50"
              }`}
              onClick={(e) => {
                e.stopPropagation()
                toggleFavorite(event.id.toString())
              }}
            >
              <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
            </Button>
          </div>
          <div className="absolute bottom-3 left-3">
            <Badge className="bg-purple-600/80 text-white">
              {event.category}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-white text-lg line-clamp-2 group-hover:text-purple-400 transition-colors">
            {event.title}
          </h3>

          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Calendar className="h-4 w-4 text-purple-400" />
            <span>{formatDate(event.date)}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-300">
            <MapPin className="h-4 w-4 text-purple-400" />
            <span className="line-clamp-1">
              {event.location.city || event.location.name || "Location TBD"}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const { location } = useLocation()
  const { 
    featuredEvents, 
    isFeaturedLoading, 
    loadFeaturedEvents
  } = useRealEvents()

  // Load featured events on mount and when location changes
  useEffect(() => {
    const locationString = location.city && location.state 
      ? `${location.city}, ${location.state}` 
      : "United States"
    loadFeaturedEvents(locationString, 8)
  }, [location, loadFeaturedEvents])

  const handleSearch = () => {
    if (!searchQuery.trim() && !selectedCategory) return
    
    // Navigate to events page with search params
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (selectedCategory) params.set('category', selectedCategory)
    window.location.href = `/events?${params.toString()}`
  }

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId)
    window.location.href = `/events?category=${categoryId}`
  }

  return (
    <AppLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0A0B10] via-[#0F1419] to-[#0A0B10] pt-16 pb-20">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8 max-w-4xl mx-auto"
          >
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
                Find Your Next
                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                  Amazing Event
                </span>
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Discover concerts, festivals, sports, and more happening near you
              </p>
            </div>

            {/* Search Bar */}
            <div className="bg-[#1A1D25]/60 backdrop-blur-md rounded-2xl border border-gray-800/50 p-6 shadow-2xl">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="Search events, artists, venues..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-12 h-14 bg-[#0F1116] border-gray-700 text-white text-lg"
                  />
                </div>
                <LocationSelector className="h-14" />
                <Button 
                  onClick={handleSearch}
                  className="h-14 px-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-lg"
                >
                  <Search className="mr-2 h-5 w-5" />
                  Search
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 text-center">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2"
              >
                <TrendingUp className="h-5 w-5 text-purple-400" />
                <span className="text-gray-300">
                  <span className="text-2xl font-bold text-white">1000+</span> Events Daily
                </span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-2"
              >
                <Users className="h-5 w-5 text-purple-400" />
                <span className="text-gray-300">
                  <span className="text-2xl font-bold text-white">50K+</span> Active Users
                </span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-2"
              >
                <MapPin className="h-5 w-5 text-purple-400" />
                <span className="text-gray-300">
                  <span className="text-2xl font-bold text-white">200+</span> Cities
                </span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-[#0A0B10]">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Browse by Category
            </h2>
            <p className="text-gray-400 text-lg">
              Find events that match your interests
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map((category, index) => {
              const Icon = category.icon
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleCategoryClick(category.id)}
                  className="group cursor-pointer"
                >
                  <Card className="bg-[#1A1D25]/60 border-gray-800/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 p-6 text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-white font-medium group-hover:text-purple-400 transition-colors">
                      {category.label}
                    </h3>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-16 bg-gradient-to-b from-[#0A0B10] to-[#0F1419]">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-between mb-10"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-purple-400" />
                Featured Events Near You
              </h2>
              <p className="text-gray-400 text-lg">
                {location.city ? `Happening in ${location.city}` : 'Top events in your area'}
              </p>
            </div>
            <Link href="/events">
              <Button variant="outline" className="border-gray-700 hover:border-purple-500">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>

          {isFeaturedLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto mb-4" />
                <p className="text-gray-400">Loading amazing events...</p>
              </div>
            </div>
          ) : featuredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredEvents.slice(0, 8).map((event) => (
                <Link key={event.id} href={`/events/${event.id}`}>
                  <EventCard event={event} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <MapPin className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No events found</h3>
              <p className="text-gray-500 mb-6">
                Try adjusting your location or check back later
              </p>
              <Link href="/events">
                <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                  Browse All Events
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#0F1419]">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 rounded-3xl border border-purple-500/30 p-12 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Discover Amazing Events?
            </h2>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of people finding their perfect events every day
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/events">
                <Button size="lg" className="bg-white hover:bg-gray-100 text-gray-900 px-8">
                  Explore Events
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/create-event">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8">
                  Host an Event
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </AppLayout>
  )
}