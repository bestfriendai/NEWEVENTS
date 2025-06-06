"use client"

import { useState } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { AppLayout } from "@/components/app-layout"
import { MapPin, Search, ArrowRight, Users, Loader2 } from "lucide-react"

// Dynamic import for COBE globe (properly implemented)
const CobeGlobe = dynamic(() => import("@/components/cobe-globe"), {
  ssr: false,
  loading: () => (
    <div className="w-[600px] h-[600px] max-w-full aspect-square rounded-full bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-purple-400 mx-auto mb-4 animate-spin" />
        <p className="text-gray-400 text-sm">Loading Interactive Globe...</p>
      </div>
    </div>
  ),
})

export default function Home() {
  const [isClient, setIsClient] = useState(false)

  // Simple client-side check
  if (typeof window !== "undefined" && !isClient) {
    setIsClient(true)
  }

  return (
    <AppLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0A0B10] via-[#0F1419] to-[#0A0B10] pt-10 pb-16 md:pt-16 md:pb-24 lg:pt-20 lg:pb-32 min-h-[90vh] flex items-center">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Gradient orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="text-center lg:text-left space-y-6">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                  Discover Amazing{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                    Events
                  </span>{" "}
                  Near You
                </h1>
                <p className="text-lg md:text-xl text-gray-300 mb-6 md:mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  DateAI uses artificial intelligence to help you discover events that perfectly match your interests and
                  preferences around the globe.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
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

            {/* Interactive Globe Container */}
            <div className="relative mx-auto max-w-4xl">
              <div className="relative z-10 flex justify-center">
                <div className="relative">
                  {/* Interactive COBE Globe */}
                  <CobeGlobe
                    size={600}
                    className="drop-shadow-2xl"
                    markers={[
                      { location: [37.7595, -122.4367], size: 0.04 }, // San Francisco
                      { location: [40.7128, -74.0060], size: 0.04 },  // New York
                      { location: [51.5074, -0.1278], size: 0.04 },   // London
                      { location: [35.6762, 139.6503], size: 0.04 },  // Tokyo
                      { location: [48.8566, 2.3522], size: 0.04 },    // Paris
                      { location: [-33.8688, 151.2093], size: 0.04 }, // Sydney
                      { location: [19.4326, -99.1332], size: 0.04 },  // Mexico City
                      { location: [-22.9068, -43.1729], size: 0.04 }, // Rio de Janeiro
                      { location: [55.7558, 37.6173], size: 0.04 },   // Moscow
                      { location: [39.9042, 116.4074], size: 0.04 },  // Beijing
                      { location: [34.0522, -118.2437], size: 0.04 }, // Los Angeles
                      { location: [19.076, 72.8777], size: 0.04 },    // Mumbai
                    ]}
                  />
                  {/* Enhanced Glow effect around globe */}
                  <div className="absolute inset-0 bg-gradient-radial from-purple-500/30 via-purple-500/10 to-transparent rounded-full blur-2xl pointer-events-none"></div>
                  <div className="absolute inset-0 bg-gradient-radial from-blue-500/20 via-transparent to-transparent rounded-full blur-3xl pointer-events-none"></div>
                </div>
              </div>

              {/* Floating particles effect */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-purple-400 rounded-full opacity-60 animate-pulse"></div>
                <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-blue-400 rounded-full opacity-40 animate-pulse delay-1000"></div>
                <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-pink-400 rounded-full opacity-50 animate-pulse delay-2000"></div>
                <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-indigo-400 rounded-full opacity-30 animate-pulse delay-3000"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-[#0A0B10]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Why Choose DateAI?
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Discover the perfect events with our AI-powered platform that understands your preferences and connects you with amazing experiences.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#12141D]/80 backdrop-blur-md rounded-xl p-6 border border-gray-800/50 hover:border-purple-500/30 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Smart Discovery</h3>
              <p className="text-gray-400">
                Our AI analyzes your preferences to suggest events you&apos;ll love, from concerts to workshops and everything in between.
              </p>
            </div>

            <div className="bg-[#12141D]/80 backdrop-blur-md rounded-xl p-6 border border-gray-800/50 hover:border-purple-500/30 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Location-Based</h3>
              <p className="text-gray-400">
                Find events happening near you or explore exciting opportunities in cities around the world.
              </p>
            </div>

            <div className="bg-[#12141D]/80 backdrop-blur-md rounded-xl p-6 border border-gray-800/50 hover:border-purple-500/30 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Community Driven</h3>
              <p className="text-gray-400">
                Connect with like-minded people and build lasting relationships through shared experiences and interests.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-purple-900/20 to-indigo-900/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Discover Amazing Events?</h2>
          <p className="text-lg text-gray-300 mb-8">
            Join thousands of users who are finding the perfect events for their next adventure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/events">
              <Button className="bg-white hover:bg-gray-100 text-gray-900 py-6 px-8 rounded-xl text-base font-medium shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105 w-full sm:w-auto">
                Start Exploring
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/create-event">
              <Button
                variant="outline"
                className="border-gray-700 text-white py-6 px-8 rounded-xl text-base font-medium hover:bg-white/5 backdrop-blur-sm w-full sm:w-auto"
              >
                Create Event
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </AppLayout>
  )
}
