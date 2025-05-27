"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { MapPin, Navigation, Search, Loader2, Globe, ArrowRight, Sparkles, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface LocationSetupScreenProps {
  onLocationSet: (location: { lat: number; lng: number; name: string }) => void
}

export function LocationSetupScreen({ onLocationSet }: LocationSetupScreenProps) {
  const [locationQuery, setLocationQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const geocodeLocation = async (query: string): Promise<{ lat: number; lng: number; name: string } | null> => {
    try {
      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY
      if (!mapboxToken) {
        throw new Error("Location services not configured")
      }

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&limit=1&types=place,locality,neighborhood,address`,
      )

      if (!response.ok) {
        throw new Error("Failed to find location")
      }

      const data = await response.json()

      if (data.features && data.features.length > 0) {
        const feature = data.features[0]
        const [lng, lat] = feature.center
        return {
          lat,
          lng,
          name: feature.place_name,
        }
      }

      return null
    } catch (error) {
      console.error("Geocoding error:", error)
      return null
    }
  }

  const handleLocationSearch = async () => {
    if (!locationQuery.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const location = await geocodeLocation(locationQuery)
      if (location) {
        console.log("Location found:", location)
        onLocationSet(location)
      } else {
        setError("Location not found. Please try a different search term.")
      }
    } catch (err) {
      console.error("Location search error:", err)
      setError("Failed to search for location. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 15000,
          enableHighAccuracy: true,
          maximumAge: 300000, // 5 minutes
        })
      })

      const { latitude, longitude } = position.coords
      console.log("Current position:", { latitude, longitude })

      // Reverse geocode to get location name
      let locationName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`

      try {
        const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY
        if (mapboxToken) {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}&limit=1`,
          )
          if (response.ok) {
            const data = await response.json()
            if (data.features && data.features.length > 0) {
              locationName = data.features[0].place_name
            }
          }
        }
      } catch (e) {
        console.warn("Reverse geocoding failed, using coordinates")
      }

      const location = {
        lat: latitude,
        lng: longitude,
        name: locationName,
      }

      console.log("Setting current location:", location)
      onLocationSet(location)
    } catch (err) {
      console.error("Geolocation error:", err)
      let errorMessage = "Unable to get your current location."

      if (err instanceof GeolocationPositionError) {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location permissions and try again."
            break
          case err.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable. Please enter your location manually."
            break
          case err.TIMEOUT:
            errorMessage = "Location request timed out. Please try again or enter your location manually."
            break
        }
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePopularLocationClick = async (city: string) => {
    setLocationQuery(city)
    setIsLoading(true)
    setError(null)

    try {
      const location = await geocodeLocation(city)
      if (location) {
        onLocationSet(location)
      } else {
        setError(`Could not find ${city}. Please try a different location.`)
      }
    } catch (err) {
      setError("Failed to search for location. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const popularLocations = [
    "New York, NY",
    "Los Angeles, CA",
    "Chicago, IL",
    "Miami, FL",
    "Austin, TX",
    "Seattle, WA",
    "San Francisco, CA",
    "Boston, MA",
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1116] via-[#1A1D25] to-[#0F1116] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        <Card className="bg-[#1A1D25]/80 backdrop-blur-xl border-gray-800/50 shadow-2xl">
          <CardContent className="p-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-8"
            >
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <Globe className="h-16 w-16 text-purple-400" />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="absolute inset-0"
                  >
                    <Sparkles className="h-4 w-4 text-pink-400 absolute top-0 right-0" />
                  </motion.div>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Welcome to DateAI Events</h1>
              <p className="text-gray-400 text-lg">Let's find amazing events happening near you</p>
            </motion.div>

            {/* Location Input */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      placeholder="Enter your city, address, or zip code..."
                      value={locationQuery}
                      onChange={(e) => setLocationQuery(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleLocationSearch()}
                      className="pl-12 h-14 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 text-lg rounded-xl"
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>
                  <Button
                    onClick={handleLocationSearch}
                    disabled={!locationQuery.trim() || isLoading}
                    size="lg"
                    className="bg-purple-600 hover:bg-purple-700 px-8 h-14 rounded-xl"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <ArrowRight className="h-5 w-5 mr-2" />
                        Find Events
                      </>
                    )}
                  </Button>
                </div>

                {/* Current Location Button */}
                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={handleCurrentLocation}
                    disabled={isLoading}
                    className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 rounded-xl px-6 py-3"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Use My Current Location
                  </Button>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-red-400">{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}

              {/* Popular Locations */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-4"
              >
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-4">Or choose a popular location:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {popularLocations.map((city) => (
                      <Button
                        key={city}
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePopularLocationClick(city)}
                        className="text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg text-xs"
                        disabled={isLoading}
                      >
                        <MapPin className="h-3 w-3 mr-1" />
                        {city}
                      </Button>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Features Preview */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-8 pt-6 border-t border-gray-800/50"
              >
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                      <Search className="h-6 w-6 text-purple-400" />
                    </div>
                    <p className="text-xs text-gray-400">Smart Search</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto">
                      <MapPin className="h-6 w-6 text-pink-400" />
                    </div>
                    <p className="text-xs text-gray-400">Interactive Map</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                      <Sparkles className="h-6 w-6 text-blue-400" />
                    </div>
                    <p className="text-xs text-gray-400">AI Recommendations</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
