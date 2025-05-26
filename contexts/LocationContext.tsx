"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"

interface Location {
  latitude: number
  longitude: number
  city?: string
  address?: string
}

interface LocationContextType {
  location: Location | null
  setLocation: (location: Location) => void
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

  const value = {
    location,
    setLocation,
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
