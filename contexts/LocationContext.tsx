"use client"

import { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction } from 'react'
import { logger } from '@/lib/utils/logger'

export interface UserLocation {
  lat: number
  lng: number
  name: string
}

interface LocationContextType {
  userLocation: UserLocation | null
  setUserLocation: Dispatch<SetStateAction<UserLocation | null>>
  isLocationLoading: boolean
  setIsLocationLoading: Dispatch<SetStateAction<boolean>>
  locationError: string | null
  setLocationError: Dispatch<SetStateAction<string | null>>
  getCurrentLocation: () => Promise<void>
  searchLocation: (query: string) => Promise<void>
}

const LocationContext = createContext<LocationContextType | undefined>(undefined)

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [isLocationLoading, setIsLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  const getCurrentLocation = async (): Promise<void> => {
    if (!navigator.geolocation) {
      const error = "Geolocation is not supported by this browser"
      setLocationError(error)
      logger.warn("Geolocation not supported", {
        component: "LocationContext",
        action: "geolocation_not_supported"
      })
      return
    }

    setIsLocationLoading(true)
    setLocationError(null)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        })
      })

      const { latitude, longitude } = position.coords
      
      // TODO: Implement reverse geocoding to get address name
      const location: UserLocation = {
        lat: latitude,
        lng: longitude,
        name: "Your Current Location"
      }

      setUserLocation(location)
      
      logger.info("Current location obtained", {
        component: "LocationContext",
        action: "location_success",
        metadata: { 
          lat: latitude, 
          lng: longitude,
          accuracy: position.coords.accuracy 
        }
      })

    } catch (error) {
      const errorMessage = error instanceof GeolocationPositionError 
        ? getGeolocationErrorMessage(error.code)
        : "Failed to get current location"
      
      setLocationError(errorMessage)
      
      logger.error("Failed to get current location", {
        component: "LocationContext",
        action: "location_error"
      }, error instanceof Error ? error : new Error(errorMessage))
    } finally {
      setIsLocationLoading(false)
    }
  }

  const searchLocation = async (query: string): Promise<void> => {
    if (!query.trim()) {
      setLocationError("Please enter a location")
      return
    }

    setIsLocationLoading(true)
    setLocationError(null)

    try {
      // TODO: Implement geocoding search using the geocoding utility
      // For now, this is a placeholder
      const { geocodeAddress } = await import('@/lib/utils/geocoding')
      const result = await geocodeAddress(query)
      
      if (result) {
        const location: UserLocation = {
          lat: result.lat,
          lng: result.lng,
          name: result.address
        }
        
        setUserLocation(location)
        
        logger.info("Location search successful", {
          component: "LocationContext",
          action: "search_success",
          metadata: { query, result: location }
        })
      } else {
        throw new Error("Location not found")
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to search location"
      setLocationError(errorMessage)
      
      logger.error("Location search failed", {
        component: "LocationContext",
        action: "search_error",
        metadata: { query }
      }, error instanceof Error ? error : new Error(errorMessage))
    } finally {
      setIsLocationLoading(false)
    }
  }

  const value: LocationContextType = {
    userLocation,
    setUserLocation,
    isLocationLoading,
    setIsLocationLoading,
    locationError,
    setLocationError,
    getCurrentLocation,
    searchLocation
  }

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  )
}

export const useLocationContext = () => {
  const context = useContext(LocationContext)
  if (!context) {
    throw new Error("useLocationContext must be used within a LocationProvider")
  }
  return context
}

// Helper function to get user-friendly geolocation error messages
function getGeolocationErrorMessage(code: number): string {
  switch (code) {
    case GeolocationPositionError.PERMISSION_DENIED:
      return "Location access denied. Please enable location permissions and try again."
    case GeolocationPositionError.POSITION_UNAVAILABLE:
      return "Location information is unavailable. Please try again later."
    case GeolocationPositionError.TIMEOUT:
      return "Location request timed out. Please try again."
    default:
      return "An unknown error occurred while getting your location."
  }
}
