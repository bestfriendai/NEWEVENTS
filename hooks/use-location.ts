import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { geocodeLocation } from "@/lib/api/map-api"

interface Location {
  lat: number
  lng: number
  city?: string
  state?: string
  country?: string
  address?: string
}

interface UseLocationResult {
  location: Location | null
  isLoading: boolean
  error: string | null
  isLocationEnabled: boolean
  requestLocation: () => Promise<void>
  setManualLocation: (address: string) => Promise<void>
  clearLocation: () => void
}

const DEFAULT_LOCATION: Location = {
  lat: 40.7128,
  lng: -74.0060,
  city: "New York",
  state: "NY",
  country: "United States"
}

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<Location | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLocationEnabled, setIsLocationEnabled] = useState(false)

  // Load saved location from localStorage on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem("userLocation")
    if (savedLocation) {
      try {
        setLocation(JSON.parse(savedLocation))
      } catch {
        // Invalid saved location
      }
    }
  }, [])

  // Save location to localStorage whenever it changes
  useEffect(() => {
    if (location) {
      localStorage.setItem("userLocation", JSON.stringify(location))
    }
  }, [location])

  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser")
      toast.error("Geolocation is not supported by your browser")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        })
      })

      const { latitude: lat, longitude: lng } = position.coords
      
      // Reverse geocode to get city/state
      try {
        const response = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`)
        const data = await response.json()
        
        if (data.success && data.data) {
          setLocation({
            lat,
            lng,
            city: data.data.city,
            state: data.data.state,
            country: data.data.country,
            address: data.data.address
          })
          setIsLocationEnabled(true)
          toast.success(`Location set to ${data.data.city}, ${data.data.state}`)
        } else {
          // Fallback to just coordinates
          setLocation({ lat, lng })
          setIsLocationEnabled(true)
          toast.success("Location detected")
        }
      } catch {
        // Geocoding failed, just use coordinates
        setLocation({ lat, lng })
        setIsLocationEnabled(true)
        toast.success("Location detected")
      }
    } catch (err) {
      let errorMessage = "Failed to get location"
      
      if (err instanceof GeolocationPositionError) {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = "Location permission denied"
            break
          case err.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable"
            break
          case err.TIMEOUT:
            errorMessage = "Location request timed out"
            break
        }
      }
      
      setError(errorMessage)
      toast.error(errorMessage)
      
      // Use default location
      setLocation(DEFAULT_LOCATION)
      setIsLocationEnabled(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const setManualLocation = useCallback(async (address: string) => {
    if (!address.trim()) {
      toast.error("Please enter a valid address")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const geocoded = await geocodeLocation(address)
      
      if (geocoded) {
        setLocation({
          lat: geocoded.lat,
          lng: geocoded.lng,
          city: geocoded.city,
          state: geocoded.state,
          country: geocoded.country,
          address: geocoded.name
        })
        toast.success(`Location set to ${geocoded.name}`)
      } else {
        throw new Error("Could not find location")
      }
    } catch (err) {
      const errorMessage = "Failed to set location"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearLocation = useCallback(() => {
    setLocation(null)
    setIsLocationEnabled(false)
    localStorage.removeItem("userLocation")
    toast.info("Location cleared")
  }, [])

  return {
    location: location || DEFAULT_LOCATION,
    isLoading,
    error,
    isLocationEnabled,
    requestLocation,
    setManualLocation,
    clearLocation
  }
}