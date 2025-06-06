"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AppLayout } from "@/components/app-layout"
import { MapPin, Search, ArrowRight, Users } from "lucide-react"

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

            {/* Globe Container - Simplified */}
            <div className="relative mx-auto max-w-4xl">
              <div className="relative z-10 flex justify-center">
                <div className="relative">
                  <div className="w-[600px] h-[600px] max-w-full aspect-square rounded-full bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-gray-400 text-sm">Interactive Globe</p>
                    </div>
                  </div>
                  {/* Glow effect around globe */}
                  <div className="absolute inset-0 bg-gradient-radial from-purple-500/20 via-transparent to-transparent rounded-full blur-xl pointer-events-none"></div>
                </div>
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
