"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"

interface Location {
  latitude: number
  longitude: number
  city?: string
  address?: string
  name?: string // Add name property
}

// Update the context interface
interface LocationContextType {
  location: Location | null
  userLocation: { lat: number; lng: number; name?: string } | null // Add userLocation for compatibility
  setLocation: (location: Location) => void
  searchLocation: (query: string) => Promise<void> // Add searchLocation method
  getCurrentLocation: () => Promise<void>
  isLoading: boolean
  error: string | null
}

const LocationContext = createContext<LocationContextType | undefined>(undefined)

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocationState] = useState<Location | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setLocation = useCallback((newLocation: Location) => {
    setLocationState(newLocation)
    setError(null)
  }, [])

  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        })
      })

      const newLocation: Location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }

      setLocationState(newLocation)
    } catch (err) {
      setError("Unable to retrieve your location")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // In the provider, add the searchLocation method:
  const searchLocation = useCallback(async (query: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // Use your geocoding API (from lib/api/map-api.ts)
      const { geocodeAddress } = await import("@/lib/api/map-api")
      const result = await geocodeAddress(query)

      if (result) {
        const newLocation: Location = {
          latitude: result.lat,
          longitude: result.lng,
          name: result.name,
          address: result.address,
        }
        setLocationState(newLocation)
      } else {
        setError("Location not found")
      }
    } catch (err) {
      setError("Failed to search location")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Add userLocation computed property for compatibility
  const userLocation = location
    ? {
        lat: location.latitude,
        lng: location.longitude,
        name: location.name || location.city || location.address,
      }
    : null

  const value = {
    location,
    userLocation,
    setLocation,
    searchLocation,
    getCurrentLocation,
    isLoading,
    error,
  }

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
}

export function useLocation() {
  const context = useContext(LocationContext)
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider")
  }
  return context
}

// Alias for useLocation for compatibility
export const useLocationContext = useLocation

// Export useLocationContext
