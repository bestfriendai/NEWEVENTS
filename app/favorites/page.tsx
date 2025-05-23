"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { EventDetailModal, type EventDetailProps } from "@/components/event-detail-modal"
import { FavoritesHeader } from "@/components/favorites/favorites-header"
import { FavoritesFilters } from "@/components/favorites/favorites-filters"
import { EmptyFavorites } from "@/components/favorites/empty-favorites"
import { FavoritesFooter } from "@/components/favorites/favorites-footer"
import { EventCard } from "@/components/event-card"
import { Tabs, TabsContent } from "@/components/ui/tabs"

// Sample favorites data
const initialFavorites: EventDetailProps[] = [
  {
    id: 102,
    title: "Underground Techno Night",
    description:
      "Dive into the underground techno scene with this exclusive warehouse party featuring cutting-edge techno artists and producers. The raw industrial setting creates the perfect atmosphere for authentic techno sounds and minimalist aesthetics. Limited capacity ensures an intimate experience for true techno enthusiasts.",
    category: "Techno",
    date: "May 29, 2025",
    time: "11:00 PM - 6:00 AM",
    location: "The Warehouse",
    address: "456 Industrial Ave, Eastside",
    price: "$40",
    image: "/vibrant-community-event.png?height=400&width=600&query=underground techno party",
    organizer: {
      name: "Techno Collective",
      avatar: "/avatar-2.png?height=40&width=40&query=techno dj",
    },
    attendees: 450,
    isFavorite: true,
  },
  {
    id: 105,
    title: "80s Retro Dance Night",
    description:
      "Step back in time to the golden era of synth-pop, new wave, and disco at our 80s themed dance party. Dress in your best retro outfits and dance to iconic hits from Madonna, Michael Jackson, Prince, and more. Our vintage decorations, light shows, and special themed cocktails create an authentic 80s atmosphere.",
    category: "Retro",
    date: "June 1, 2025",
    time: "8:00 PM - 2:00 AM",
    location: "Flashback Lounge",
    address: "202 Memory Lane, Midtown",
    price: "$30",
    image: "/vibrant-community-event.png?height=400&width=600&query=80s retro dance party",
    organizer: {
      name: "Time Machine Events",
      avatar: "/avatar-5.png?height=40&width=40&query=retro dj",
    },
    attendees: 540,
    isFavorite: true,
  },
  {
    id: 2,
    title: "Urban Art Exhibition",
    description:
      "Explore the vibrant world of urban art at this exclusive exhibition featuring works from renowned street artists and emerging talents. Witness live painting demonstrations, participate in interactive workshops, and immerse yourself in the creative energy of the urban art scene.",
    category: "Art",
    date: "May 22, 2025",
    time: "10:00 AM - 6:00 PM",
    location: "Modern Gallery",
    address: "456 Art Avenue, Cultural District",
    price: "$25",
    image: "/vibrant-community-event.png?height=400&width=600&query=urban art exhibition",
    organizer: {
      name: "Art Collective",
      avatar: "/avatar-2.png?height=40&width=40&query=art curator",
    },
    attendees: 520,
    isFavorite: true,
  },
]

export default function FavoritesPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [favorites, setFavorites] = useState<EventDetailProps[]>(initialFavorites)
  const [selectedEvent, setSelectedEvent] = useState<EventDetailProps | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [filteredFavorites, setFilteredFavorites] = useState<EventDetailProps[]>(initialFavorites)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  // Filter favorites when search query or active tab changes
  useEffect(() => {
    let filtered = [...favorites]

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          event.location.toLowerCase().includes(query) ||
          event.category.toLowerCase().includes(query),
      )
    }

    // Filter by tab
    if (activeTab !== "all") {
      if (activeTab === "upcoming") {
        // Filter for upcoming events (simple implementation)
        const today = new Date()
        filtered = filtered.filter((event) => {
          const eventDate = new Date(event.date)
          return eventDate >= today
        })
      } else {
        // Filter by category
        filtered = filtered.filter((event) => event.category.toLowerCase() === activeTab.toLowerCase())
      }
    }

    setFilteredFavorites(filtered)
  }, [favorites, searchQuery, activeTab])

  const handleViewEventDetails = (event: EventDetailProps) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setTimeout(() => setSelectedEvent(null), 300) // Clear after animation completes
  }

  const handleRemoveFavorite = (id: number) => {
    setFavorites((prev) => prev.filter((event) => event.id !== id))
  }

  const handleSearch = () => {
    setIsSearching(true)
    // Simulate search delay
    setTimeout(() => {
      setIsSearching(false)
    }, 800)
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0F1116] text-gray-200">
      {/* Header */}
      <FavoritesHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Main content */}
      <main className="flex-1 p-4 md:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-[80vh]">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
              <p className="text-gray-400">Loading your favorites...</p>
            </motion.div>
          </div>
        ) : (
          <>
            <FavoritesFilters
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isSearching={isSearching}
              handleSearch={handleSearch}
            />

            <Tabs defaultValue="all" className="mt-0">
              <TabsContent value="all" className="mt-0">
                {filteredFavorites.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredFavorites.map((event, i) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * i, duration: 0.4 }}
                        whileHover={{ y: -5 }}
                        exit={{ opacity: 0, y: -20 }}
                        layout
                      >
                        <EventCard
                          event={event}
                          onViewDetails={() => handleViewEventDetails(event)}
                          onToggleFavorite={() => handleRemoveFavorite(event.id)}
                          index={i}
                        />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <EmptyFavorites searchQuery={searchQuery} />
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      {/* Footer */}
      <FavoritesFooter />

      {/* Event Detail Modal */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onFavorite={handleRemoveFavorite}
      />
    </div>
  )
}
