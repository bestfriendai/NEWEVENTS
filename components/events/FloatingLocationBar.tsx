"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, MapPin, Navigation, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLocationContext } from "@/contexts/LocationContext"
import { logger } from "@/lib/utils/logger"

interface FloatingLocationBarProps {
  onLocationSet: (location: { lat: number; lng: number; name: string }) => void
  onClose: () => void
}

export function FloatingLocationBar({ onLocationSet, onClose }: FloatingLocationBarProps) {
  const [locationInput, setLocationInput] = useState("")
  const { userLocation, isLocationLoading, locationError, getCurrentLocation, searchLocation } = useLocationContext()

  const handleLocationSearch = async () => {
    if (!locationInput.trim()) return

    try {
      await searchLocation(locationInput)

      if (userLocation) {
        onLocationSet(userLocation)
      }
    } catch (error) {
      logger.error(
        "Location search failed in floating bar",
        {
          component: "FloatingLocationBar",
          action: "search_error",
          metadata: { query: locationInput },
        },
        error instanceof Error ? error : new Error("Unknown error"),
      )
    }
  }

  const handleGetCurrentLocation = async () => {
    try {
      await getCurrentLocation()

      if (userLocation) {
        onLocationSet(userLocation)
      }
    } catch (error) {
      logger.error(
        "Current location failed in floating bar",
        {
          component: "FloatingLocationBar",
          action: "current_location_error",
        },
        error instanceof Error ? error : new Error("Unknown error"),
      )
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLocationSearch()
    }
    if (e.key === "Escape") {
      onClose()
    }
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Floating Location Bar */}
      <motion.div
        initial={{ y: 100, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 100, opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed bottom-8 left-4 right-4 z-50 max-w-2xl mx-auto"
      >
        <div className="bg-[#1A1D25]/95 backdrop-blur-md rounded-3xl border border-gray-800/50 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800/50">
            <div className="flex items-center">
              <MapPin className="h-6 w-6 text-purple-400 mr-3" />
              <div>
                <h3 className="text-xl font-bold text-white">Set Your Location</h3>
                <p className="text-gray-400 text-sm">Find amazing events happening near you</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Search Input */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Enter your city, address, or zip code..."
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-12 h-14 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 text-lg rounded-xl"
                  disabled={isLocationLoading}
                  autoFocus
                />
              </div>
              <Button
                onClick={handleLocationSearch}
                disabled={!locationInput.trim() || isLocationLoading}
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 px-8 h-14 rounded-xl"
              >
                {isLocationLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Search className="h-5 w-5 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>

            {/* Current Location Button */}
            <div className="text-center">
              <Button
                variant="outline"
                onClick={handleGetCurrentLocation}
                disabled={isLocationLoading}
                className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 rounded-xl"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Use My Current Location
              </Button>
            </div>

            {/* Error Display */}
            {locationError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
              >
                <p className="text-red-400 text-sm text-center">{locationError}</p>
              </motion.div>
            )}

            {/* Success Display */}
            {userLocation && !locationError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-green-400 mr-2" />
                    <span className="text-green-400 text-sm">Location set to: {userLocation.name}</span>
                  </div>
                  <Button
                    onClick={() => onLocationSet(userLocation)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Popular Locations */}
            <div className="mt-6">
              <p className="text-gray-400 text-sm mb-3">Popular locations:</p>
              <div className="flex flex-wrap gap-2">
                {["New York, NY", "Los Angeles, CA", "Chicago, IL", "Miami, FL", "Austin, TX", "Seattle, WA"].map(
                  (city) => (
                    <Button
                      key={city}
                      variant="ghost"
                      size="sm"
                      onClick={() => setLocationInput(city)}
                      className="text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg"
                    >
                      {city}
                    </Button>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}
