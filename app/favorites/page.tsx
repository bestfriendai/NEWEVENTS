"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { AppLayout } from "@/components/app-layout"
import { EventDetailModal } from "@/components/event-detail-modal"
import { FavoritesHeader } from "@/components/favorites/favorites-header"
import { FavoritesFilters } from "@/components/favorites/favorites-filters"
import { EmptyFavorites } from "@/components/favorites/empty-favorites"
import { FavoritesFooter } from "@/components/favorites/favorites-footer"
import { EventCard } from "@/components/event-card"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Heart, Loader2 } from "lucide-react"
import { useFavorites, useFavoriteToggle } from "@/contexts/FavoritesContext"
import { getSupabaseClient } from "@/lib/auth/anonymous-auth"
import { useAuth } from "@/lib/auth/auth-provider"
import type { EventDetail } from "@/types/event.types"
import type { Event } from "@/types/event.types"

function FavoriteEventCard({ event }: { event: Event }) {
  const { toggleFavorite } = useFavoriteToggle()

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const formatPrice = (event: Event) => {
    if (!event.price) return "Free"
    if (event.price.min === event.price.max) {
      return `${event.price.currency || 'USD'} ${event.price.min}`
    }
    return `${event.price.currency || 'USD'} ${event.price.min}${event.price.max ? ` - ${event.price.max}` : '+'}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="group"
    >
      <Card className="overflow-hidden bg-[#1A1D25]/60 border-gray-800/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
        <div className="relative">
          {event.image && (
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop&q=80`
              }}
            />
          )}
          <div className="absolute top-3 right-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full backdrop-blur-sm bg-red-500/80 text-white hover:bg-red-600"
              onClick={(e) => {
                e.stopPropagation()
                toggleFavorite(event.id.toString())
              }}
            >
              <Heart className="h-4 w-4 fill-current" />
            </Button>
          </div>
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-purple-600/80 text-white">
              {event.source}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          <div className="space-y-2">
            <h3 className="font-semibold text-white text-lg line-clamp-2 group-hover:text-purple-400 transition-colors">
              {event.title}
            </h3>
            <p className="text-gray-400 text-sm line-clamp-2">
              {event.description || "No description available"}
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Calendar className="h-4 w-4 text-purple-400" />
            <span>{formatDate(event.date)}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-300">
            <MapPin className="h-4 w-4 text-purple-400" />
            <span className="line-clamp-1">
              {event.location.name || event.location.city || event.location.address || "Location TBD"}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-purple-400 border-purple-400/50">
                {event.category}
              </Badge>
              <span className="text-lg font-semibold text-green-400">
                {formatPrice(event)}
              </span>
            </div>
          </div>

          {event.url && (
            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              onClick={(e) => {
                e.stopPropagation()
                window.open(event.url, '_blank')
              }}
            >
              Get Tickets
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function FavoritesPage() {
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [favoriteEvents, setFavoriteEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredFavorites, setFilteredFavorites] = useState<Event[]>([])
  
  const { favorites, isLoading: isFavoritesLoading } = useFavorites()
  const { isAuthenticated } = useAuth()

  // Load favorite events from database
  useEffect(() => {
    const loadFavoriteEvents = async () => {
      if (!isAuthenticated || favorites.length === 0) {
        setFavoriteEvents([])
        setIsPageLoading(false)
        return
      }

      try {
        const supabase = getSupabaseClient()
        if (!supabase) {
          setIsPageLoading(false)
          return
        }

        // Fetch events data for all favorite IDs
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .in('id', favorites.map(id => parseInt(id)))
          .eq('is_active', true)

        if (error) {
          console.error('Error loading favorite events:', error)
        } else if (data) {
          // Transform database events to match Event type
          const transformedEvents: Event[] = data.map(event => ({
            id: event.id,
            externalId: event.external_id,
            title: event.title || '',
            description: event.description || '',
            category: event.category || 'Other',
            date: event.start_date,
            endDate: event.end_date,
            location: {
              name: event.location_name || '',
              address: event.location_address || '',
              city: event.location_city || '',
              state: event.location_state || '',
              country: event.location_country || '',
              lat: event.location_lat || 0,
              lng: event.location_lng || 0
            },
            image: event.image_url || '',
            url: event.ticket_url || '',
            source: event.source || 'database',
            price: {
              min: event.price_min || 0,
              max: event.price_max || 0,
              currency: event.price_currency || 'USD'
            },
            organizer: {
              name: event.organizer_name || '',
              url: event.organizer_url || ''
            },
            venue: {
              id: event.venue_id || '',
              name: event.venue_name || event.location_name || '',
              address: event.location_address || ''
            },
            isVirtual: event.is_virtual || false,
            isFeatured: event.is_featured || false,
            rating: event.popularity_score || 0
          }))

          setFavoriteEvents(transformedEvents)
        }
      } catch (error) {
        console.error('Error loading favorite events:', error)
      } finally {
        setIsPageLoading(false)
      }
    }

    loadFavoriteEvents()
  }, [favorites, isAuthenticated])

  // Filter favorites when search query or active tab changes
  useEffect(() => {
    let filtered = [...favoriteEvents]

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.category.toLowerCase().includes(query) ||
          event.location.name?.toLowerCase().includes(query) ||
          event.location.city?.toLowerCase().includes(query)
      )
    }

    // Filter by tab
    if (activeTab !== "all") {
      if (activeTab === "upcoming") {
        filtered = filtered.filter((event) => new Date(event.date) > new Date())
      } else if (activeTab === "past") {
        filtered = filtered.filter((event) => new Date(event.date) <= new Date())
      } else {
        // Filter by category
        filtered = filtered.filter((event) => 
          event.category.toLowerCase().includes(activeTab.toLowerCase())
        )
      }
    }

    // Sort by date
    filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    setFilteredFavorites(filtered)
  }, [searchQuery, activeTab, favoriteEvents])

  const handleViewDetails = (event: Event) => {
    // Convert to EventDetail format for modal
    const eventDetail: EventDetail = {
      id: event.id,
      title: event.title,
      description: event.description || '',
      category: event.category,
      date: new Date(event.date).toLocaleDateString(),
      time: new Date(event.date).toLocaleTimeString(),
      location: event.location.name || event.location.city || '',
      address: event.location.address || '',
      price: event.price ? `$${event.price.min}${event.price.max ? `-${event.price.max}` : ''}` : 'Free',
      image: event.image || '',
      organizer: {
        name: event.organizer?.name || 'Unknown',
        avatar: '/avatar-1.png'
      },
      attendees: Math.floor(Math.random() * 1000) + 100,
      isFavorite: true
    }
    setSelectedEvent(eventDetail)
    setIsModalOpen(true)
  }

  const handleRemoveFavorite = () => {
    if (selectedEvent) {
      setFavoriteEvents(prev => prev.filter(e => e.id !== selectedEvent.id))
      setIsModalOpen(false)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-b from-[#0A0B10] via-[#0F1419] to-[#0A0B10] py-8">
          <div className="container mx-auto px-4">
            <div className="text-center py-20">
              <Heart className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Sign in to view favorites</h2>
              <p className="text-gray-400">
                Create an account to save your favorite events
              </p>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  const isLoading = isPageLoading || isFavoritesLoading

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-b from-[#0A0B10] via-[#0F1419] to-[#0A0B10] py-8">
        <div className="container mx-auto px-4 space-y-8">
          <FavoritesHeader
            totalFavorites={favoriteEvents.length}
            isSearching={false}
            onSearch={handleSearch}
          />

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto mb-4" />
                <p className="text-gray-400">Loading your favorites...</p>
              </div>
            </div>
          ) : favoriteEvents.length === 0 ? (
            <EmptyFavorites />
          ) : (
            <>
              <FavoritesFilters
                activeTab={activeTab}
                onTabChange={setActiveTab}
                favorites={favoriteEvents}
              />

              <Tabs value={activeTab} className="w-full">
                <TabsContent value={activeTab} className="mt-6">
                  {filteredFavorites.length === 0 ? (
                    <div className="text-center py-20">
                      <Heart className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-400">
                        No {activeTab === "all" ? "" : activeTab} favorites found
                      </h3>
                      <p className="text-gray-500 mt-2">
                        {searchQuery
                          ? "Try adjusting your search"
                          : "Events you favorite will appear here"}
                      </p>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    >
                      {filteredFavorites.map((event, index) => (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => handleViewDetails(event)}
                          className="cursor-pointer"
                        >
                          <FavoriteEventCard event={event} />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </TabsContent>
              </Tabs>

              {filteredFavorites.length > 0 && (
                <FavoritesFooter totalEvents={filteredFavorites.length} />
              )}
            </>
          )}
        </div>
      </div>

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onToggleFavorite={handleRemoveFavorite}
        />
      )}
    </AppLayout>
  )
}