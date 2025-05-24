"use client"

import { useState } from "react"
import { Search, MapPin, Navigation, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLocationContext } from "@/contexts/LocationContext"
import { logger } from "@/lib/utils/logger"

interface LocationSearchSectionProps {
  onLocationSelect?: (location: { lat: number; lng: number; name: string }) => void
  isLoading?: boolean
}

export function LocationSearchSection({ onLocationSelect, isLoading: externalLoading }: LocationSearchSectionProps) {
  const [locationInput, setLocationInput] = useState("")
  const { 
    userLocation, 
    isLocationLoading, 
    locationError, 
    getCurrentLocation, 
    searchLocation 
  } = useLocationContext()

  const isLoading = externalLoading || isLocationLoading

  const handleLocationSearch = async () => {
    if (!locationInput.trim()) return

    try {
      await searchLocation(locationInput)
      
      // Call the callback if provided and location was found
      if (onLocationSelect && userLocation) {
        onLocationSelect(userLocation)
      }
    } catch (error) {
      logger.error("Location search failed in component", {
        component: "LocationSearchSection",
        action: "search_error",
        metadata: { query: locationInput }
      }, error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  const handleGetCurrentLocation = async () => {
    try {
      await getCurrentLocation()
      
      // Call the callback if provided and location was found
      if (onLocationSelect && userLocation) {
        onLocationSelect(userLocation)
      }
    } catch (error) {
      logger.error("Current location failed in component", {
        component: "LocationSearchSection",
        action: "current_location_error"
      }, error instanceof Error ? error : new Error("Unknown error"))
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLocationSearch()
    }
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">Find Events Near You</h2>
        <p className="text-gray-300 text-lg">
          Enter your location to discover amazing events happening in your area
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Enter your city, address, or zip code..."
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-12 h-14 bg-white/10 border-white/20 text-white placeholder-gray-400 text-lg backdrop-blur-sm"
              disabled={isLoading}
            />
          </div>
          <Button
            onClick={handleLocationSearch}
            disabled={!locationInput.trim() || isLoading}
            size="lg"
            className="bg-purple-600 hover:bg-purple-700 px-8 h-14"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Search className="h-5 w-5 mr-2" />
                Search
              </>
            )}
          </Button>
        </div>

        <div className="text-center">
          <Button
            variant="outline"
            onClick={handleGetCurrentLocation}
            disabled={isLoading}
            className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
          >
            <Navigation className="h-4 w-4 mr-2" />
            Use My Current Location
          </Button>
        </div>

        {/* Error Display */}
        {locationError && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm text-center">{locationError}</p>
          </div>
        )}

        {/* Success Display */}
        {userLocation && !locationError && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-green-400 text-sm text-center">
              📍 Location set to: {userLocation.name}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
