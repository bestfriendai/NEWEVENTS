"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Search,
  Heart,
  Trash2,
  Calendar,
  MapPin,
  Clock,
  ChevronRight,
  ArrowLeft,
  Music,
  SlidersHorizontal,
  Loader2,
  Users,
  HeartOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Link from "next/link"
import { EventDetailModal, type EventDetailProps } from "@/components/event-detail-modal"

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

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

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
      // Filter logic would go here in a real app
    }, 800)
  }

  const filteredFavorites = searchQuery
    ? favorites.filter((event) => event.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : favorites

  return (
    <div className="flex flex-col min-h-screen bg-[#0F1116] text-gray-200">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#0F1116] z-10"
      >
        <div className="flex items-center">
          <Link href="/">
            <Button variant="ghost" className="mr-2 text-gray-400 hover:text-gray-200 p-1">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white p-2 rounded-xl mr-2 shadow-glow-sm"
          >
            <Heart size={18} />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400"
          >
            Your Favorites
          </motion.h1>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <Input
              className="w-full bg-[#1A1D25] border-gray-800 rounded-xl pl-10 text-sm focus-visible:ring-purple-500 transition-all duration-300"
              placeholder="Search favorites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Link href="/party">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      className="bg-[#0F1116] hover:bg-[#1A1D25] text-gray-400 border-gray-800 rounded-xl transition-colors duration-300"
                    >
                      <Music className="mr-2 h-4 w-4" />
                      Party
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent className="bg-[#1A1D25] border-gray-800 text-gray-300">
                  <p>Browse party and music events</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Link>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-glow-sm cursor-pointer"
          >
            <span className="text-sm font-medium text-white">DA</span>
          </motion.div>
        </div>
      </motion.header>

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
            {/* Favorites header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-100">Your Saved Events</h2>
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    className="bg-[#1A1D25] hover:bg-[#22252F] text-gray-300 border-gray-800 rounded-xl transition-colors duration-300 mr-2"
                    onClick={handleSearch}
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4 text-purple-400" />
                        Search
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-[#1A1D25] hover:bg-[#22252F] text-gray-300 border-gray-800 rounded-xl transition-colors duration-300"
                  >
                    <SlidersHorizontal className="mr-2 h-4 w-4 text-purple-400" />
                    Sort
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Favorites tabs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="mb-6"
            >
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-[#1A1D25] p-1 rounded-xl mb-6 w-full grid grid-cols-3 sm:grid-cols-5">
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:bg-[#22252F] data-[state=active]:text-purple-400 rounded-lg transition-all duration-300"
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger
                    value="upcoming"
                    className="data-[state=active]:bg-[#22252F] data-[state=active]:text-purple-400 rounded-lg transition-all duration-300"
                  >
                    Upcoming
                  </TabsTrigger>
                  <TabsTrigger
                    value="music"
                    className="data-[state=active]:bg-[#22252F] data-[state=active]:text-purple-400 rounded-lg transition-all duration-300"
                  >
                    Music
                  </TabsTrigger>
                  <TabsTrigger
                    value="art"
                    className="data-[state=active]:bg-[#22252F] data-[state=active]:text-purple-400 rounded-lg transition-all duration-300"
                  >
                    Art
                  </TabsTrigger>
                  <TabsTrigger
                    value="other"
                    className="data-[state=active]:bg-[#22252F] data-[state=active]:text-purple-400 rounded-lg transition-all duration-300"
                  >
                    Other
                  </TabsTrigger>
                </TabsList>

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
                          <Card className="overflow-hidden bg-[#1A1D25] border-gray-800 rounded-xl transition-all duration-300 hover:shadow-glow-sm">
                            <div className="h-48 bg-gradient-to-br from-purple-900/30 to-indigo-900/30 relative overflow-hidden">
                              <motion.img
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.5 }}
                                src={event.image}
                                alt={event.title}
                                className="w-full h-full object-cover mix-blend-luminosity hover:mix-blend-normal transition-all duration-500"
                              />
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="absolute top-2 right-2 bg-[#1A1D25]/80 backdrop-blur-sm rounded-full p-1.5 shadow-glow-xs"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRemoveFavorite(event.id)
                                }}
                              >
                                <Trash2
                                  size={16}
                                  className="text-gray-400 hover:text-red-400 cursor-pointer transition-colors duration-300"
                                />
                              </motion.div>
                              <motion.div
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.2 + 0.1 * i, duration: 0.3 }}
                                className="absolute bottom-2 left-2"
                              >
                                <Badge className="bg-[#1A1D25]/80 backdrop-blur-sm text-purple-400 hover:text-purple-300 border-0 shadow-glow-xs">
                                  {event.category}
                                </Badge>
                              </motion.div>
                            </div>
                            <CardContent className="p-4">
                              <h3 className="font-bold mb-1 text-gray-200">{event.title}</h3>
                              <div className="text-sm text-gray-400 mb-2 flex items-center">
                                <MapPin size={14} className="mr-1 text-purple-400" />
                                {event.location}
                              </div>
                              <div className="text-sm text-gray-400 mb-2 flex items-center">
                                <Calendar size={14} className="mr-1 text-purple-400" />
                                {event.date}
                              </div>
                              <div className="text-sm text-gray-400 mb-3 flex items-center">
                                <Clock size={14} className="mr-1 text-purple-400" />
                                {event.time}
                              </div>
                              <div className="flex items-center justify-between mb-3">
                                <div className="text-sm font-medium text-gray-200">{event.price}</div>
                                <div className="flex items-center text-sm text-gray-400">
                                  <Users size={14} className="mr-1" />
                                  {event.attendees} attending
                                </div>
                              </div>
                              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Button
                                  variant="outline"
                                  className="w-full bg-[#22252F] hover:bg-[#2A2E38] text-purple-400 hover:text-purple-300 border-gray-800 rounded-lg group transition-all duration-300"
                                  onClick={() => handleViewEventDetails(event)}
                                >
                                  View Details
                                  <ChevronRight
                                    size={16}
                                    className="ml-1 transition-transform duration-300 group-hover:translate-x-1"
                                  />
                                </Button>
                              </motion.div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <EmptyFavorites searchQuery={searchQuery} />
                  )}
                </TabsContent>

                {/* Other tab contents would be similar but filtered */}
              </Tabs>
            </motion.div>
          </>
        )}
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="bg-[#0A0B0E] border-t border-gray-800 p-4 text-center text-sm text-gray-500"
      >
        <div className="flex justify-center space-x-4 mb-2">
          <motion.div whileHover={{ y: -2 }} whileTap={{ y: 0 }}>
            <Button
              variant="link"
              className="text-gray-500 hover:text-purple-400 p-0 h-auto transition-colors duration-300"
            >
              Help Center
            </Button>
          </motion.div>
          <motion.div whileHover={{ y: -2 }} whileTap={{ y: 0 }}>
            <Button
              variant="link"
              className="text-gray-500 hover:text-purple-400 p-0 h-auto transition-colors duration-300"
            >
              Privacy Policy
            </Button>
          </motion.div>
          <motion.div whileHover={{ y: -2 }} whileTap={{ y: 0 }}>
            <Button
              variant="link"
              className="text-gray-500 hover:text-purple-400 p-0 h-auto transition-colors duration-300"
            >
              Terms of Service
            </Button>
          </motion.div>
        </div>
        <p>© 2025 DateAI. All rights reserved.</p>
      </motion.footer>

      {/* Event Detail Modal */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onFavorite={() => {
          if (selectedEvent) handleRemoveFavorite(selectedEvent.id)
        }}
      />
    </div>
  )
}

// Empty state component
function EmptyFavorites({ searchQuery }: { searchQuery: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-[#1A1D25] p-4 rounded-full mb-4"
      >
        <HeartOff size={48} className="text-gray-500" />
      </motion.div>
      <h3 className="text-xl font-bold text-gray-300 mb-2">
        {searchQuery ? "No matching favorites found" : "No favorites yet"}
      </h3>
      <p className="text-gray-500 max-w-md mb-6">
        {searchQuery
          ? `We couldn't find any favorites matching "${searchQuery}". Try adjusting your search or browse all events to find something you like.`
          : "Start exploring events and save your favorites to see them here. Discover music, art, and more events happening near you."}
      </p>
      <Link href="/">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg shadow-glow-sm transition-all duration-300">
            Discover Events
          </Button>
        </motion.div>
      </Link>
    </motion.div>
  )
}
