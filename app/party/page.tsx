"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { EventDetailModal } from "@/components/event-detail-modal";
import type { EventDetail } from "@/types/event.types";
import { PartyHeader } from "@/components/party/party-header"
import { PartyHero } from "@/components/party/party-hero"
import { CategoryTabs } from "@/components/party/category-tabs"
import { FeaturedArtists } from "@/components/party/featured-artists"
import { AdvancedFilters } from "@/components/party/advanced-filters"
import { PartyFooter } from "@/components/party/party-footer"
import { EventCard } from "@/components/event-card"

// Party events will be loaded from real APIs
const getPartyEvents = async (): Promise<EventDetail[]> => {
  // This would fetch real party/nightlife events from the APIs
  // For now, return empty array - real implementation would filter by nightlife category
  return []
}

const partyEvents: EventDetail[] = [
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
  const [events, setEvents] = useState(partyEvents)
  const [filteredEvents, setFilteredEvents] = useState<EventDetail[]>([])
  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFiltering, setIsFiltering] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  // Filter events when tab changes
  useEffect(() => {
    if (activeTab === "all") {
      setFilteredEvents(events)
    } else {
      const filtered = events.filter(
        (event) =>
          event.category.toLowerCase() === activeTab.toLowerCase() ||
          event.title.toLowerCase().includes(activeTab.toLowerCase()),
      )
      setFilteredEvents(filtered)
    }
  }, [activeTab, events])

  const handleViewEventDetails = (event: EventDetail) => {
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
      <PartyHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

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
            <PartyHero />

            {/* Filters and categories */}
            <CategoryTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onFilterClick={() => setShowFilters(!showFilters)}
            />

            <Tabs defaultValue="all" className="mt-0">
              <TabsContent value="all" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredEvents.map((event, i) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * i, duration: 0.4 }}
                      whileHover={{ y: -5 }}
                    >
                      <EventCard
                        event={event}
                        onViewDetails={() => handleViewEventDetails(event)}
                        onToggleFavorite={() => handleToggleFavorite(event.id)}
                        index={i}
                      />
                    </motion.div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            {/* Featured DJs/Artists */}
            <FeaturedArtists artists={featuredArtists} />

            {/* Advanced filters section */}
            {showFilters && <AdvancedFilters isFiltering={isFiltering} handleFilter={handleFilter} />}
          </>
        )}
      </main>

      {/* Footer */}
      <PartyFooter />

      {/* Event detail modal */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onFavorite={handleToggleFavorite}
      />
    </div>
  )
}
