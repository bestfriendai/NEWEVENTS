"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { EventDetailModal } from "@/components/event-detail-modal";
import type { EventDetailProps } from "@/components/event-detail-modal";
import { FavoritesHeader } from "@/components/favorites/favorites-header"
import { FavoritesFilters } from "@/components/favorites/favorites-filters"
import { EmptyFavorites } from "@/components/favorites/empty-favorites"
import { FavoritesFooter } from "@/components/favorites/favorites-footer"
import { EventCard } from "@/components/event-card"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { AppLayout } from "@/components/app-layout"

// Helper function to get favorites from localStorage
const getFavoritesFromStorage = (): EventDetailProps[] => {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem("dateai-favorites")
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    return []
  }
}

// Helper function to save favorites to localStorage
const saveFavoritesToStorage = (favorites: EventDetailProps[]) => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem("dateai-favorites", JSON.stringify(favorites))
  } catch (error) {
    // Handle storage error silently
  }
}

function FavoritesPageContent() {
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [favorites, setFavorites] = useState<EventDetailProps[]>([])
  const [selectedEvent, setSelectedEvent] = useState<EventDetailProps | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [filteredFavorites, setFilteredFavorites] = useState<EventDetailProps[]>([])

  useEffect(() => {
    // Load favorites from localStorage
    const loadFavorites = () => {
      const storedFavorites = getFavoritesFromStorage()
      setFavorites(storedFavorites)
      setFilteredFavorites(storedFavorites)
      setIsLoading(false)
    }

    // Small delay to show loading state
    const timer = setTimeout(loadFavorites, 300)
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

  const handleViewEventDetails = (event: EventDetail) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setTimeout(() => setSelectedEvent(null), 300) // Clear after animation completes
  }

  const handleRemoveFavorite = (id: number) => {
    const updatedFavorites = favorites.filter((event) => event.id !== id)
    setFavorites(updatedFavorites)
    saveFavoritesToStorage(updatedFavorites)
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

export default function FavoritesPage() {
  return (
    <AppLayout>
      <FavoritesPageContent />
    </AppLayout>
  )
}
