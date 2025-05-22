"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  User,
  Settings,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Globe,
  Edit,
  Camera,
  Heart,
  Users,
  Clock,
  ChevronRight,
  LogOut,
  Bell,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { AppLayout } from "@/components/app-layout"
import { EventCard } from "@/components/event-card"
import { EventDetailModal, type EventDetailProps } from "@/components/event-detail-modal"

// Sample user data
const userData = {
  id: 1,
  name: "Alex Morgan",
  username: "@alexmorgan",
  avatar: "/avatar-1.png",
  coverPhoto: "/profile-cover.png?height=400&width=1200&query=city skyline night",
  bio: "Event enthusiast and digital nomad. Always looking for the next adventure and great experiences to share.",
  location: "San Francisco, CA",
  email: "alex@example.com",
  phone: "+1 (555) 123-4567",
  website: "alexmorgan.com",
  joinDate: "May 2023",
  stats: {
    eventsAttended: 47,
    eventsHosted: 12,
    followers: 842,
    following: 356,
  },
  interests: ["Music", "Art", "Technology", "Food", "Travel", "Photography"],
  upcomingEvents: 5,
  completedProfile: 85,
}

// Sample events data (reusing from other pages)
const sampleEvents: EventDetailProps[] = [
  {
    id: 1,
    title: "Neon Nights Music Festival",
    description:
      "Join us for an unforgettable night of electronic music featuring top DJs and artists from around the world. Experience stunning light shows, immersive art installations, and dance the night away under the stars. This annual festival brings together music lovers for a celebration of sound and community.",
    category: "Music",
    date: "May 21, 2025",
    time: "8:00 PM - 2:00 AM",
    location: "Skyline Arena",
    address: "123 Main Street, Downtown",
    price: "$45 - $120",
    image: "/vibrant-community-event.png?height=400&width=600&query=neon music festival",
    organizer: {
      name: "Pulse Events",
      avatar: "/avatar-1.png?height=40&width=40&query=event organizer",
    },
    attendees: 1240,
    isFavorite: false,
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
  {
    id: 5,
    title: "Culinary Masterclass",
    description:
      "Learn the secrets of gourmet cooking from renowned chef Maria Sanchez in this hands-on masterclass. Create exquisite dishes using premium ingredients and advanced techniques. The class includes a multi-course meal with wine pairings and a take-home recipe book.",
    category: "Food",
    date: "May 25, 2025",
    time: "6:00 PM - 9:00 PM",
    location: "Gourmet Kitchen",
    address: "222 Culinary Court, Restaurant Row",
    price: "$85",
    image: "/vibrant-community-event.png?height=400&width=600&query=cooking masterclass",
    organizer: {
      name: "Culinary Arts Institute",
      avatar: "/avatar-5.png?height=40&width=40&query=chef",
    },
    attendees: 30,
    isFavorite: true,
  },
]

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<EventDetailProps | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [events, setEvents] = useState(sampleEvents)

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

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative mb-8"
        >
          {/* Cover Photo */}
          <div className="h-64 rounded-xl overflow-hidden relative">
            <img src={userData.coverPhoto || "/placeholder.svg"} alt="Cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B10] to-transparent"></div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="absolute top-4 right-4">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-[#1A1D25]/70 backdrop-blur-sm hover:bg-[#22252F] text-gray-300 h-9 w-9"
              >
                <Edit className="h-4 w-4 text-purple-400" />
              </Button>
            </motion.div>
          </div>

          {/* Profile Info */}
          <div className="flex flex-col md:flex-row items-start md:items-end -mt-20 md:-mt-16 relative z-10 px-4">
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-[#0A0B10] shadow-glow-sm">
                <AvatarImage src={userData.avatar || "/placeholder.svg"} alt={userData.name} />
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white text-2xl">
                  {userData.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="absolute bottom-2 right-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-[#1A1D25]/70 backdrop-blur-sm hover:bg-[#22252F] text-gray-300 h-8 w-8"
                >
                  <Camera className="h-4 w-4 text-purple-400" />
                </Button>
              </motion.div>
            </div>
            <div className="mt-4 md:mt-0 md:ml-6 flex-1">
              <h1 className="text-3xl font-bold text-white">{userData.name}</h1>
              <p className="text-gray-400 mb-2">{userData.username}</p>
              <p className="text-gray-300 max-w-2xl mb-4">{userData.bio}</p>
              <div className="flex flex-wrap gap-4 mb-2">
                <div className="flex items-center text-gray-400 text-sm">
                  <MapPin className="h-4 w-4 mr-1 text-purple-400" />
                  {userData.location}
                </div>
                <div className="flex items-center text-gray-400 text-sm">
                  <Calendar className="h-4 w-4 mr-1 text-purple-400" />
                  Joined {userData.joinDate}
                </div>
                <div className="flex items-center text-gray-400 text-sm">
                  <Clock className="h-4 w-4 mr-1 text-purple-400" />
                  {userData.upcomingEvents} upcoming events
                </div>
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg shadow-glow-sm transition-all duration-300">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  className="bg-[#1A1D25]/60 backdrop-blur-sm hover:bg-[#22252F] text-gray-300 border-gray-800/50 rounded-lg transition-colors duration-300"
                >
                  <Settings className="mr-2 h-4 w-4 text-purple-400" />
                  Settings
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8"
          >
            <div className="bg-[#1A1D25]/60 backdrop-blur-sm border border-gray-800/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{userData.stats.eventsAttended}</p>
              <p className="text-gray-400 text-sm">Events Attended</p>
            </div>
            <div className="bg-[#1A1D25]/60 backdrop-blur-sm border border-gray-800/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{userData.stats.eventsHosted}</p>
              <p className="text-gray-400 text-sm">Events Hosted</p>
            </div>
            <div className="bg-[#1A1D25]/60 backdrop-blur-sm border border-gray-800/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{userData.stats.followers}</p>
              <p className="text-gray-400 text-sm">Followers</p>
            </div>
            <div className="bg-[#1A1D25]/60 backdrop-blur-sm border border-gray-800/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{userData.stats.following}</p>
              <p className="text-gray-400 text-sm">Following</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Profile Content */}
        <Tabs defaultValue="events" className="mt-8">
          <TabsList className="bg-[#1A1D25]/60 backdrop-blur-sm p-1 rounded-lg mb-6 w-full grid grid-cols-2 sm:grid-cols-4">
            <TabsTrigger
              value="events"
              className="data-[state=active]:bg-[#22252F] data-[state=active]:text-purple-400 rounded-lg transition-all duration-300"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Events
            </TabsTrigger>
            <TabsTrigger
              value="about"
              className="data-[state=active]:bg-[#22252F] data-[state=active]:text-purple-400 rounded-lg transition-all duration-300"
            >
              <User className="mr-2 h-4 w-4" />
              About
            </TabsTrigger>
            <TabsTrigger
              value="friends"
              className="data-[state=active]:bg-[#22252F] data-[state=active]:text-purple-400 rounded-lg transition-all duration-300"
            >
              <Users className="mr-2 h-4 w-4" />
              Friends
            </TabsTrigger>
            <TabsTrigger
              value="favorites"
              className="data-[state=active]:bg-[#22252F] data-[state=active]:text-purple-400 rounded-lg transition-all duration-300"
            >
              <Heart className="mr-2 h-4 w-4" />
              Favorites
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-[#1A1D25]/60 backdrop-blur-sm border border-gray-800/50 rounded-xl h-80 animate-pulse"
                    ></div>
                  ))
                : events.map((event, index) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onViewDetails={() => handleViewEventDetails(event)}
                      onToggleFavorite={() => handleToggleFavorite(event.id)}
                      index={index}
                    />
                  ))}
            </div>
          </TabsContent>

          <TabsContent value="about" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-[#1A1D25]/60 backdrop-blur-sm border border-gray-800/50 rounded-xl p-6"
                >
                  <h3 className="text-lg font-medium text-white mb-4">Contact Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-purple-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-400">Email</p>
                        <p className="text-white">{userData.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-purple-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-400">Phone</p>
                        <p className="text-white">{userData.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Globe className="h-5 w-5 text-purple-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-400">Website</p>
                        <p className="text-white">{userData.website}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-purple-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-400">Location</p>
                        <p className="text-white">{userData.location}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="bg-[#1A1D25]/60 backdrop-blur-sm border border-gray-800/50 rounded-xl p-6"
                >
                  <h3 className="text-lg font-medium text-white mb-4">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {userData.interests.map((interest) => (
                      <Badge
                        key={interest}
                        className="bg-[#22252F] hover:bg-[#2A2E38] text-purple-300 border-purple-500/30 py-1.5 px-3"
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </motion.div>
              </div>

              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-[#1A1D25]/60 backdrop-blur-sm border border-gray-800/50 rounded-xl p-6"
                >
                  <h3 className="text-lg font-medium text-white mb-4">Profile Completion</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-gray-300">Profile completion</p>
                      <p className="text-purple-400 font-medium">{userData.completedProfile}%</p>
                    </div>
                    <Progress value={userData.completedProfile} className="h-2 bg-[#22252F]" />
                    <div className="text-sm text-gray-400 mt-2">
                      Complete your profile to get more personalized event recommendations.
                    </div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg shadow-glow-sm transition-all duration-300 mt-2">
                        Complete Profile
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="bg-[#1A1D25]/60 backdrop-blur-sm border border-gray-800/50 rounded-xl p-6"
                >
                  <h3 className="text-lg font-medium text-white mb-4">Account Settings</h3>
                  <div className="space-y-3">
                    <motion.div
                      whileHover={{ x: 4 }}
                      className="flex items-center justify-between p-2 hover:bg-[#22252F] rounded-lg cursor-pointer transition-colors duration-200"
                    >
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-purple-400 mr-3" />
                        <p className="text-gray-300">Edit Profile</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    </motion.div>
                    <motion.div
                      whileHover={{ x: 4 }}
                      className="flex items-center justify-between p-2 hover:bg-[#22252F] rounded-lg cursor-pointer transition-colors duration-200"
                    >
                      <div className="flex items-center">
                        <Settings className="h-5 w-5 text-purple-400 mr-3" />
                        <p className="text-gray-300">Account Settings</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    </motion.div>
                    <motion.div
                      whileHover={{ x: 4 }}
                      className="flex items-center justify-between p-2 hover:bg-[#22252F] rounded-lg cursor-pointer transition-colors duration-200"
                    >
                      <div className="flex items-center">
                        <Bell className="h-5 w-5 text-purple-400 mr-3" />
                        <p className="text-gray-300">Notifications</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    </motion.div>
                    <Separator className="bg-gray-800/50 my-2" />
                    <motion.div
                      whileHover={{ x: 4 }}
                      className="flex items-center justify-between p-2 hover:bg-[#22252F] rounded-lg cursor-pointer transition-colors duration-200"
                    >
                      <div className="flex items-center">
                        <LogOut className="h-5 w-5 text-red-400 mr-3" />
                        <p className="text-red-400">Logout</p>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="friends" className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-[#1A1D25]/60 backdrop-blur-sm border border-gray-800/50 rounded-xl h-24 animate-pulse"
                    ></div>
                  ))
                : Array.from({ length: 8 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.05 }}
                      whileHover={{ y: -4, transition: { duration: 0.2 } }}
                      className="bg-[#1A1D25]/60 backdrop-blur-sm border border-gray-800/50 rounded-xl p-4 cursor-pointer"
                    >
                      <div className="flex items-center">
                        <Avatar className="h-12 w-12 border border-gray-800 mr-3">
                          <AvatarImage
                            src={`/avatar-${(i % 6) + 1}.png?height=48&width=48&query=person ${i}`}
                            alt={`Friend ${i + 1}`}
                          />
                          <AvatarFallback className="bg-purple-900 text-purple-200">
                            {String.fromCharCode(65 + i)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-white">Friend {i + 1}</p>
                          <div className="flex items-center text-xs text-gray-400">
                            <MapPin className="h-3 w-3 mr-1 text-purple-400" />
                            City {i + 1}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
            </div>
          </TabsContent>

          <TabsContent value="favorites" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-[#1A1D25]/60 backdrop-blur-sm border border-gray-800/50 rounded-xl h-80 animate-pulse"
                    ></div>
                  ))
                : events
                    .filter((event) => event.isFavorite)
                    .map((event, index) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onViewDetails={() => handleViewEventDetails(event)}
                        onToggleFavorite={() => handleToggleFavorite(event.id)}
                        index={index}
                      />
                    ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Event Detail Modal */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onFavorite={handleToggleFavorite}
      />
    </AppLayout>
  )
}
