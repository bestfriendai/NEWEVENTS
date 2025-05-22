"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Search,
  MapPin,
  Calendar,
  Heart,
  Music,
  Headphones,
  Clock,
  ChevronRight,
  Users,
  ArrowLeft,
  Loader2,
  Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { EventDetailModal, type EventDetailProps } from "@/components/event-detail-modal"

// Sample party events data
const partyEvents: EventDetailProps[] = [
  {
    id: 101,
    title: "Neon Nights: Electronic Music Festival",
    description:
      "Experience the ultimate electronic music festival with world-class DJs, immersive light shows, and state-of-the-art sound systems. Dance the night away under neon lights and create unforgettable memories with fellow music lovers. This year's lineup features top international talent and emerging artists pushing the boundaries of electronic music.",
    category: "Festival",
    date: "May 28, 2025",
    time: "9:00 PM - 4:00 AM",
    location: "Pulse Nightclub",
    address: "123 Beat Street, Downtown",
    price: "$75",
    image: "/vibrant-community-event.png?height=400&width=600&query=neon nightclub party",
    organizer: {
      name: "Pulse Events",
      avatar: "/avatar-1.png?height=40&width=40&query=dj",
    },
    attendees: 1850,
    isFavorite: false,
  },
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
    id: 103,
    title: "Rooftop Sunset Sessions",
    description:
      "Join us for a magical evening of house music as the sun sets over the city skyline. Our rooftop venue offers breathtaking views, craft cocktails, and smooth beats from resident and guest DJs. The perfect blend of sophisticated ambiance and quality music makes this a must-attend event for house music aficionados.",
    category: "House",
    date: "May 30, 2025",
    time: "6:00 PM - 12:00 AM",
    location: "Skyline Rooftop",
    address: "789 View Terrace, Uptown",
    price: "$55",
    image: "/vibrant-community-event.png?height=400&width=600&query=rooftop sunset party",
    organizer: {
      name: "Skyline Events",
      avatar: "/avatar-3.png?height=40&width=40&query=house dj",
    },
    attendees: 320,
    isFavorite: false,
  },
  {
    id: 104,
    title: "Hip-Hop Block Party",
    description:
      "Celebrate hip-hop culture with this community block party featuring live performances, DJ battles, breakdancing competitions, and graffiti art demonstrations. Local food vendors and merchandise stalls add to the festival atmosphere. This family-friendly event welcomes hip-hop fans of all ages to experience the four elements of hip-hop.",
    category: "Hip-Hop",
    date: "May 31, 2025",
    time: "2:00 PM - 10:00 PM",
    location: "Urban Square",
    address: "101 Beat Boulevard, Westside",
    price: "$25",
    image: "/vibrant-community-event.png?height=400&width=600&query=hip hop block party",
    organizer: {
      name: "Urban Collective",
      avatar: "/avatar-4.png?height=40&width=40&query=hip hop artist",
    },
    attendees: 780,
    isFavorite: false,
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
    id: 106,
    title: "Drum & Bass Warehouse Rave",
    description:
      "Experience the high-energy sounds of drum & bass in this warehouse rave featuring heavyweight DJs and MCs from the global D&B scene. Powerful sound systems, laser shows, and a crowd of dedicated junglists create an electric atmosphere. This is raw, underground drum & bass at its finest.",
    category: "Drum & Bass",
    date: "June 2, 2025",
    time: "10:00 PM - 5:00 AM",
    location: "The Factory",
    address: "303 Bass Drive, Industrial District",
    price: "$35",
    image: "/vibrant-community-event.png?height=400&width=600&query=drum and bass rave",
    organizer: {
      name: "Bass Collective",
      avatar: "/avatar-6.png?height=40&width=40&query=drum and bass dj",
    },
    attendees: 620,
    isFavorite: false,
  },
]

// Featured DJs/Artists
const featuredArtists = [
  {
    id: 1,
    name: "DJ Pulse",
    genre: "Techno / House",
    image: "/dj-1.png?height=300&width=300&query=dj with headphones",
    upcoming: 3,
  },
  {
    id: 2,
    name: "Neon Dreams",
    genre: "Electronic / Ambient",
    image: "/dj-2.png?height=300&width=300&query=female dj performing",
    upcoming: 2,
  },
  {
    id: 3,
    name: "Bass Collective",
    genre: "Drum & Bass / Jungle",
    image: "/dj-3.png?height=300&width=300&query=dj at festival",
    upcoming: 4,
  },
  {
    id: 4,
    name: "Midnight Vibes",
    genre: "Deep House / Progressive",
    image: "/dj-4.png?height=300&width=300&query=dj in club",
    upcoming: 1,
  },
]

export default function PartyPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [priceRange, setPriceRange] = useState([0, 100])
  const [events, setEvents] = useState(partyEvents)
  const [selectedEvent, setSelectedEvent] = useState<EventDetailProps | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFiltering, setIsFiltering] = useState(false)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
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

  const handleToggleFavorite = (id: number) => {
    setEvents((prevEvents) =>
      prevEvents.map((event) => (event.id === id ? { ...event, isFavorite: !event.isFavorite } : event)),
    )
  }

  const handleFilter = () => {
    setIsFiltering(true)
    // Simulate filtering delay
    setTimeout(() => {
      setIsFiltering(false)
      // Filter logic would go here in a real app
    }, 800)
  }

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
            <Music size={18} />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400"
          >
            Party & Music Events
          </motion.h1>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <Input
              className="w-full bg-[#1A1D25] border-gray-800 rounded-xl pl-10 text-sm focus-visible:ring-purple-500 transition-all duration-300"
              placeholder="Search for events..."
            />
          </div>
          <Link href="/favorites">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      className="bg-[#0F1116] hover:bg-[#1A1D25] text-gray-400 border-gray-800 rounded-xl transition-colors duration-300"
                    >
                      <Heart className="mr-2 h-4 w-4" />
                      Favorites
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent className="bg-[#1A1D25] border-gray-800 text-gray-300">
                  <p>View your saved events</p>
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
              <p className="text-gray-400">Loading party events...</p>
            </motion.div>
          </div>
        ) : (
          <>
            {/* Hero section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden mb-8"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-900/80 to-indigo-900/80 z-10"></div>
              <img
                src="/party-hero.png?height=400&width=1200&query=nightclub with dj and crowd"
                alt="Party events"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 z-20 flex flex-col justify-center p-8">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-3xl md:text-4xl font-bold text-white mb-2"
                >
                  Find Your Perfect Night Out
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-gray-200 mb-6 max-w-lg"
                >
                  Discover the hottest parties, clubs, and music events happening near you
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="flex flex-wrap gap-3"
                >
                  <Badge className="bg-purple-600/80 hover:bg-purple-600 text-white border-0 py-1.5 px-3 text-sm cursor-pointer">
                    Nightclubs
                  </Badge>
                  <Badge className="bg-indigo-600/80 hover:bg-indigo-600 text-white border-0 py-1.5 px-3 text-sm cursor-pointer">
                    Live Music
                  </Badge>
                  <Badge className="bg-blue-600/80 hover:bg-blue-600 text-white border-0 py-1.5 px-3 text-sm cursor-pointer">
                    DJ Sets
                  </Badge>
                  <Badge className="bg-pink-600/80 hover:bg-pink-600 text-white border-0 py-1.5 px-3 text-sm cursor-pointer">
                    Festivals
                  </Badge>
                </motion.div>
              </div>
            </motion.div>

            {/* Filters and categories */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="mb-8"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-100">Party Events</h2>
                <Button
                  variant="outline"
                  className="bg-[#1A1D25] hover:bg-[#22252F] text-gray-300 border-gray-800 rounded-xl transition-colors duration-300"
                  onClick={() => document.getElementById("filter-section")?.scrollIntoView({ behavior: "smooth" })}
                >
                  <Filter className="mr-2 h-4 w-4 text-purple-400" />
                  Filters
                </Button>
              </div>

              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-[#1A1D25] p-1 rounded-xl mb-6 w-full grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:bg-[#22252F] data-[state=active]:text-purple-400 rounded-lg transition-all duration-300"
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger
                    value="techno"
                    className="data-[state=active]:bg-[#22252F] data-[state=active]:text-purple-400 rounded-lg transition-all duration-300"
                  >
                    Techno
                  </TabsTrigger>
                  <TabsTrigger
                    value="house"
                    className="data-[state=active]:bg-[#22252F] data-[state=active]:text-purple-400 rounded-lg transition-all duration-300"
                  >
                    House
                  </TabsTrigger>
                  <TabsTrigger
                    value="hiphop"
                    className="data-[state=active]:bg-[#22252F] data-[state=active]:text-purple-400 rounded-lg transition-all duration-300"
                  >
                    Hip-Hop
                  </TabsTrigger>
                  <TabsTrigger
                    value="dnb"
                    className="data-[state=active]:bg-[#22252F] data-[state=active]:text-purple-400 rounded-lg transition-all duration-300"
                  >
                    Drum & Bass
                  </TabsTrigger>
                  <TabsTrigger
                    value="retro"
                    className="data-[state=active]:bg-[#22252F] data-[state=active]:text-purple-400 rounded-lg transition-all duration-300"
                  >
                    Retro
                  </TabsTrigger>
                  <TabsTrigger
                    value="festival"
                    className="data-[state=active]:bg-[#22252F] data-[state=active]:text-purple-400 rounded-lg transition-all duration-300"
                  >
                    Festivals
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {events.map((event, i) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * i, duration: 0.4 }}
                        whileHover={{ y: -5 }}
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
                                handleToggleFavorite(event.id)
                              }}
                            >
                              <Heart
                                size={16}
                                className={
                                  event.isFavorite
                                    ? "text-purple-400 fill-purple-400"
                                    : "text-gray-400 hover:text-purple-400 cursor-pointer transition-colors duration-300"
                                }
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
                </TabsContent>

                {/* Other tab contents would be similar but filtered */}
                <TabsContent value="techno" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {events
                      .filter((event) => event.category === "Techno")
                      .map((event, i) => (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * i, duration: 0.4 }}
                          whileHover={{ y: -5 }}
                        >
                          {/* Same card structure as above */}
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
                                  handleToggleFavorite(event.id)
                                }}
                              >
                                <Heart
                                  size={16}
                                  className={
                                    event.isFavorite
                                      ? "text-purple-400 fill-purple-400"
                                      : "text-gray-400 hover:text-purple-400 cursor-pointer transition-colors duration-300"
                                  }
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
                </TabsContent>

                {/* Similar structure for other tabs */}
              </Tabs>
            </motion.div>

            {/* Featured DJs/Artists */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="mb-8"
            >
              <h2 className="text-xl font-bold text-gray-100 mb-4">Featured Artists</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {featuredArtists.map((artist, i) => (
                  <motion.div
                    key={artist.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i, duration: 0.4 }}
                    whileHover={{ y: -5 }}
                  >
                    <Card className="bg-[#1A1D25] border-gray-800 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-glow-sm">
                      <div className="h-48 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1D25] to-transparent z-10"></div>
                        <motion.img
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.5 }}
                          src={artist.image}
                          alt={artist.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                          <h3 className="font-bold text-gray-100">{artist.name}</h3>
                          <p className="text-sm text-gray-400">{artist.genre}</p>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Headphones size={16} className="mr-2 text-purple-400" />
                            <span className="text-sm text-gray-300">{artist.upcoming} upcoming events</span>
                          </div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-purple-400 hover:text-purple-300 hover:bg-[#22252F] rounded-lg p-1 h-8 w-8"
                            >
                              <ChevronRight size={18} />
                            </Button>
                          </motion.div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Advanced filters section */}
            <motion.div
              id="filter-section"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="mb-8"
            >
              <Card className="bg-[#1A1D25] border-gray-800 rounded-xl overflow-hidden">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-gray-100 mb-4">Advanced Filters</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-300 mb-3">Date Range</h3>
                      <div className="flex space-x-2">
                        <Input
                          type="date"
                          className="bg-[#22252F] border-gray-800 rounded-lg text-gray-300 text-sm focus-visible:ring-purple-500"
                        />
                        <Input
                          type="date"
                          className="bg-[#22252F] border-gray-800 rounded-lg text-gray-300 text-sm focus-visible:ring-purple-500"
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-300 mb-3">Price Range</h3>
                      <div className="px-2">
                        <Slider
                          defaultValue={[0, 100]}
                          max={200}
                          step={5}
                          value={priceRange}
                          onValueChange={setPriceRange}
                          className="mb-2"
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>${priceRange[0]}</span>
                          <span>${priceRange[1]}+</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-300 mb-3">Event Type</h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-[#22252F] hover:bg-[#2A2E38] text-gray-300 border-0 cursor-pointer">
                          Nightclub
                        </Badge>
                        <Badge className="bg-[#22252F] hover:bg-[#2A2E38] text-gray-300 border-0 cursor-pointer">
                          Festival
                        </Badge>
                        <Badge className="bg-[#22252F] hover:bg-[#2A2E38] text-gray-300 border-0 cursor-pointer">
                          Concert
                        </Badge>
                        <Badge className="bg-[#22252F] hover:bg-[#2A2E38] text-gray-300 border-0 cursor-pointer">
                          Warehouse
                        </Badge>
                        <Badge className="bg-[#22252F] hover:bg-[#2A2E38] text-gray-300 border-0 cursor-pointer">
                          Rooftop
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6 bg-gray-800" />

                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      className="bg-[#22252F] hover:bg-[#2A2E38] text-gray-300 border-gray-800 rounded-lg mr-2"
                    >
                      Reset
                    </Button>
                    <Button
                      className={cn(
                        "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg shadow-glow-sm transition-all duration-300",
                        isFiltering && "opacity-90",
                      )}
                      onClick={handleFilter}
                      disabled={isFiltering}
                    >
                      {isFiltering ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Applying...
                        </>
                      ) : (
                        <>
                          <Filter className="mr-2 h-4 w-4" />
                          Apply Filters
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
        onFavorite={handleToggleFavorite}
      />
    </div>
  )
}
