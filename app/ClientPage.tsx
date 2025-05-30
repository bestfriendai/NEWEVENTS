"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { AppLayout } from "@/components/app-layout"
import { MapPin, Calendar, Search, Sparkles, ArrowRight, Star, Users, Zap, Menu, X } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import dynamic from "next/dynamic"

// Dynamically import the COBE globe to avoid SSR issues
const SimpleCobeGlobe = dynamic(() => import("@/components/simple-cobe-globe"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-[600px] h-[600px]">
      <div className="text-purple-400">Loading Globe...</div>
    </div>
  ),
})

export default function ClientPage() {
  const heroRef = useRef<HTMLElement>(null)
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState("concerts")
  const [isClient, setIsClient] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Generate stable particle positions (fixed values to prevent hydration mismatch)
  const particlePositions = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: (i * 17 + 23) % 100, // Deterministic positioning
      top: (i * 13 + 37) % 100,
      delay: (i * 0.15) % 3,
      duration: 2 + ((i * 0.1) % 2),
    })),
  )[0]

  useEffect(() => {
    setIsClient(true)
  }, [])

  const features = [
    {
      title: "Discover Events",
      description: "Find events that match your interests, from concerts to workshops.",
      icon: Search,
    },
    {
      title: "Personalized Recommendations",
      description: "Get AI-powered suggestions based on your preferences and past activities.",
      icon: Sparkles,
    },
    {
      title: "Location-Based Search",
      description: "Find events near you or in any city around the world.",
      icon: MapPin,
    },
  ]

  const categories = [
    { id: "concerts", label: "Concerts", count: 1240 },
    { id: "sports", label: "Sports", count: 890 },
    { id: "arts", label: "Arts & Theater", count: 650 },
    { id: "food", label: "Food & Drink", count: 420 },
  ]

  const testimonials = [
    {
      quote: "DateAI completely changed how I discover events. The recommendations are spot on!",
      author: "Alex Morgan",
      role: "Music Enthusiast",
      avatar: "/avatar-1.png",
    },
    {
      quote: "I've found amazing events I never would have discovered otherwise. Highly recommend!",
      author: "Sarah Johnson",
      role: "Frequent Traveler",
      avatar: "/avatar-2.png",
    },
    {
      quote: "The interface is intuitive and the event suggestions are always relevant to my interests.",
      author: "Michael Chen",
      role: "Tech Professional",
      avatar: "/avatar-3.png",
    },
  ]

  return (
    <>
      <AppLayout>
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative overflow-hidden bg-gradient-to-b from-[#0A0B10] via-[#0F1419] to-[#0A0B10] pt-10 pb-16 md:pt-16 md:pb-24 lg:pt-20 lg:pb-32 min-h-[90vh] flex items-center"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Gradient orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>

          {/* Floating particles */}
          <div className="absolute inset-0">
            {isClient &&
              particlePositions.map((particle) => (
                <div
                  key={particle.id}
                  className="absolute w-1 h-1 bg-white/30 rounded-full animate-pulse"
                  style={{
                    left: `${particle.left}%`,
                    top: `${particle.top}%`,
                    animationDelay: `${particle.delay}s`,
                    animationDuration: `${particle.duration}s`,
                  }}
                />
              ))}
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-screen-xl mx-auto">
            <div className="text-center mb-8 md:mb-12 animate-in">
              <div className="inline-block px-4 py-1.5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full mb-4 border border-purple-500/20 backdrop-blur-sm">
                <span className="text-sm font-medium bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  ✨ Discover events worldwide
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 md:mb-6 leading-[1.1] tracking-tight">
                Find your next{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
                  unforgettable experience
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-300 mb-6 md:mb-8 leading-relaxed max-w-2xl mx-auto">
                DateAI uses artificial intelligence to help you discover events that perfectly match your interests and
                preferences around the globe.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/events">
                  <Button className="bg-white hover:bg-gray-100 text-gray-900 py-6 px-8 rounded-xl text-base font-medium shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105">
                    Explore Events
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/create-event">
                  <Button
                    variant="outline"
                    className="border-gray-700 text-white py-6 px-8 rounded-xl text-base font-medium hover:bg-white/5 backdrop-blur-sm"
                  >
                    Create Event
                  </Button>
                </Link>
              </div>
            </div>

            {/* COBE Globe Container */}
            <div className="relative mx-auto max-w-4xl">
              <div className="relative z-10 flex justify-center">
                <div className="relative">
                  <div className="w-[600px] h-[600px] max-w-full aspect-square rounded-full overflow-hidden">
                    <SimpleCobeGlobe />
                  </div>
                  {/* Glow effect around globe */}
                  <div className="absolute inset-0 bg-gradient-radial from-purple-500/20 via-transparent to-transparent rounded-full blur-xl pointer-events-none"></div>
                </div>
              </div>

              {/* Floating Cards */}
              <div className="absolute top-1/4 -left-4 md:-left-16 z-20 floating-card">
                <FloatingCard
                  icon={<Calendar className="h-5 w-5 text-purple-400" />}
                  title="Music Festival"
                  subtitle="New York, Tomorrow"
                />
              </div>
              <div className="absolute top-1/2 -right-4 md:-right-16 z-20 floating-card">
                <FloatingCard
                  icon={<Users className="h-5 w-5 text-pink-400" />}
                  title="Tech Conference"
                  subtitle="San Francisco, Next Week"
                />
              </div>
              <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 z-20 floating-card">
                <FloatingCard
                  icon={<Zap className="h-5 w-5 text-blue-400" />}
                  title="Art Exhibition"
                  subtitle="London, This Weekend"
                />
              </div>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 md:mt-16 flex flex-col md:flex-row items-center justify-center gap-6 animate-in">
              <div className="flex items-center">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full border-2 border-[#0A0B10]"></div>
                  <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-blue-500 rounded-full border-2 border-[#0A0B10]"></div>
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full border-2 border-[#0A0B10]"></div>
                </div>
                <div className="ml-4">
                  <div className="flex items-center">
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    <span className="ml-1 text-sm font-medium text-white">4.9</span>
                  </div>
                  <p className="text-xs text-gray-400">from 2,000+ reviews</p>
                </div>
              </div>
              <div className="h-8 border-l border-gray-700 hidden md:block"></div>
              <div className="flex items-center gap-6">
                <div className="w-20 h-5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded opacity-70"></div>
                <div className="w-20 h-5 bg-gradient-to-r from-pink-500/20 to-blue-500/20 rounded opacity-70"></div>
                <div className="w-20 h-5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded opacity-70"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator - only on desktop */}
        {!isMobile && (
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center animate-bounce hidden md:flex">
            <div className="w-8 h-12 rounded-full border-2 border-gray-700 flex justify-center">
              <div className="w-1 h-3 bg-gradient-to-b from-purple-400 to-pink-400 rounded-full mt-2 animate-pulse"></div>
            </div>
            <span className="text-gray-500 mt-2 text-sm">Scroll Down</span>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-[#0A0B10] border-t border-gray-800">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-screen-xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How DateAI Works</h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Our platform makes it easy to discover events that perfectly match your interests and preferences.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-[#12141D] rounded-xl p-6 border border-gray-800 hover:border-purple-500/30 transition-all duration-300 hover:transform hover:scale-105"
                >
                  <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg p-3 w-12 h-12 flex items-center justify-center mb-4">
                    <feature.icon className="text-purple-400 h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-24 bg-[#12141D]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-screen-xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Browse by Category</h2>
                <p className="text-lg text-gray-400 max-w-2xl">
                  Explore thousands of events across different categories.
                </p>
              </div>
              <Link
                href="/events"
                className="text-purple-400 hover:text-purple-300 flex items-center mt-4 md:mt-0 transition-colors"
              >
                View all categories <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            <div className="flex flex-wrap gap-4 mb-8">
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105",
                    activeTab === category.id
                      ? "bg-white text-gray-900 shadow-lg"
                      : "bg-[#1A1D25] text-gray-300 hover:bg-[#1A1D25]/80",
                  )}
                  onClick={() => setActiveTab(category.id)}
                >
                  {category.label} <span className="text-xs opacity-70">({category.count})</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeTab === "concerts" && (
                <>
                  <EventCard
                    title="Summer Music Festival"
                    date="Aug 15-17, 2023"
                    location="Central Park, New York"
                    image="/event-1.png"
                    category="Music"
                  />
                  <EventCard
                    title="Jazz Night Downtown"
                    date="Jul 28, 2023"
                    location="Blue Note, Chicago"
                    image="/event-2.png"
                    category="Music"
                  />
                  <EventCard
                    title="Electronic Dance Party"
                    date="Sep 5, 2023"
                    location="Warehouse District, LA"
                    image="/event-3.png"
                    category="Music"
                  />
                </>
              )}
              {activeTab === "sports" && (
                <>
                  <EventCard
                    title="Championship Basketball"
                    date="Aug 22, 2023"
                    location="Madison Square Garden, NY"
                    image="/event-4.png"
                    category="Sports"
                  />
                  <EventCard
                    title="Marathon 2023"
                    date="Oct 10, 2023"
                    location="Downtown, Boston"
                    image="/event-5.png"
                    category="Sports"
                  />
                  <EventCard
                    title="Tennis Open Finals"
                    date="Sep 12, 2023"
                    location="Tennis Center, Miami"
                    image="/event-6.png"
                    category="Sports"
                  />
                </>
              )}
              {activeTab === "arts" && (
                <>
                  <EventCard
                    title="Modern Art Exhibition"
                    date="Aug 5-30, 2023"
                    location="Metropolitan Museum, NY"
                    image="/event-7.png"
                    category="Arts"
                  />
                  <EventCard
                    title="Broadway Show Premier"
                    date="Sep 15, 2023"
                    location="Theater District, NY"
                    image="/event-8.png"
                    category="Arts"
                  />
                  <EventCard
                    title="Photography Workshop"
                    date="Aug 12, 2023"
                    location="Art Center, San Francisco"
                    image="/event-9.png"
                    category="Arts"
                  />
                </>
              )}
              {activeTab === "food" && (
                <>
                  <EventCard
                    title="Wine & Food Festival"
                    date="Sep 8-10, 2023"
                    location="Waterfront Park, San Diego"
                    image="/event-10.png"
                    category="Food"
                  />
                  <EventCard
                    title="Craft Beer Tasting"
                    date="Aug 19, 2023"
                    location="Brewery District, Portland"
                    image="/event-11.png"
                    category="Food"
                  />
                  <EventCard
                    title="Chef's Table Experience"
                    date="Sep 22, 2023"
                    location="Gourmet Hall, Chicago"
                    image="/event-12.png"
                    category="Food"
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24 bg-[#0A0B10]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-screen-xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">What Our Users Say</h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Join thousands of satisfied users who have discovered amazing events with DateAI.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-[#12141D] rounded-xl p-6 border border-gray-800 hover:border-purple-500/30 transition-all duration-300"
                >
                  <p className="text-gray-300 mb-4 italic">"{testimonial.quote}"</p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white font-semibold text-sm">
                        {testimonial.author.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{testimonial.author}</p>
                      <p className="text-gray-400 text-sm">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-[#12141D]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-screen-xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Discover Amazing Events?</h2>
            <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of users who have found their perfect events with DateAI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/events">
                <Button className="bg-white hover:bg-gray-100 text-gray-900 py-6 px-8 rounded-xl text-base font-medium shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105 w-full sm:w-auto">
                  Get Started Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/create-event">
                <Button
                  variant="outline"
                  className="border-gray-700 text-white py-6 px-8 rounded-xl text-base font-medium hover:bg-white/5 backdrop-blur-sm transition-all duration-200 w-full sm:w-auto"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      </AppLayout>

      {/* Mobile menu button */}
      {!sidebarOpen && (
        <Button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 right-4 z-50 bg-purple-600 hover:bg-purple-700"
          size="sm"
        >
          <Menu className="h-4 w-4" />
        </Button>
      )}

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 w-full md:w-96 h-full bg-[#12141D] border-l border-gray-700 flex flex-col shadow-2xl z-50"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">DateAI Menu</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Search */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    placeholder="Search for events, venues, or categories..."
                    className="flex-1 bg-gray-800 border border-gray-700 text-white placeholder-gray-400 px-3 py-2 rounded-md text-sm"
                  />
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Menu Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-6">
                {/* Quick Actions */}
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    <Link href="/create-event">
                      <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-800">
                        <Calendar className="h-4 w-4 mr-3" />
                        Create Event
                      </Button>
                    </Link>
                    <Link href="/events">
                      <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-800">
                        <Search className="h-4 w-4 mr-3" />
                        Explore Events
                      </Button>
                    </Link>
                    <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-800">
                      <Star className="h-4 w-4 mr-3" />
                      Saved Events
                    </Button>
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Categories</h3>
                  <div className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-800">
                      <Calendar className="h-4 w-4 mr-3" />
                      Concerts & Music
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-800">
                      <Users className="h-4 w-4 mr-3" />
                      Social Events
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-800">
                      <Zap className="h-4 w-4 mr-3" />
                      Sports & Fitness
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-800">
                      <MapPin className="h-4 w-4 mr-3" />
                      Local Events
                    </Button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Recent Activity</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-800 rounded-lg">
                      <p className="text-sm text-white">Music Festival</p>
                      <p className="text-xs text-gray-400">New York, Tomorrow</p>
                    </div>
                    <div className="p-3 bg-gray-800 rounded-lg">
                      <p className="text-sm text-white">Tech Conference</p>
                      <p className="text-xs text-gray-400">San Francisco, Next Week</p>
                    </div>
                    <div className="p-3 bg-gray-800 rounded-lg">
                      <p className="text-sm text-white">Art Exhibition</p>
                      <p className="text-xs text-gray-400">London, This Weekend</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-700">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                <Sparkles className="h-4 w-4 mr-2" />
                Get AI Recommendations
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

interface FloatingCardProps {
  icon: React.ReactNode
  title: string
  subtitle: string
}

function FloatingCard({ icon, title, subtitle }: FloatingCardProps) {
  return (
    <div className="bg-[#1A1D25]/90 backdrop-blur-md border border-gray-800/50 rounded-lg p-3 shadow-lg">
      <div className="flex items-center space-x-2">
        {icon}
        <div>
          <p className="text-white text-sm font-medium">{title}</p>
          <p className="text-gray-400 text-xs">{subtitle}</p>
        </div>
      </div>
    </div>
  )
}

interface EventCardProps {
  title: string
  date: string
  location: string
  image: string
  category: string
}

function EventCard({ title, date, location, image, category }: EventCardProps) {
  return (
    <div className="bg-[#1A1D25] rounded-xl overflow-hidden border border-gray-800 hover:border-purple-500/30 transition-all duration-300 hover:transform hover:scale-105">
      <div className="aspect-[3/2] w-full relative">
        <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-2 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <p className="text-gray-400 text-xs">{category}</p>
          </div>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-white font-semibold mb-2">{title}</h3>
        <p className="text-gray-400 text-sm mb-1">{date}</p>
        <p className="text-gray-500 text-sm">{location}</p>
      </div>
    </div>
  )
}
