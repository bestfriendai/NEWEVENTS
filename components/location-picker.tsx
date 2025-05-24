"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { geocodeAddress, reverseGeocode } from "@/lib/api/map-api"
import { API_CONFIG } from "@/lib/env"
import { MapPin, Loader2, Search } from "lucide-react"

interface LocationPickerProps {
  onLocationSelect: (location: { address: string; lat: number; lng: number }) => void
  defaultAddress?: string
  className?: string
}

export function LocationPicker({ onLocationSelect, defaultAddress = "", className = "" }: LocationPickerProps) {
  const [address, setAddress] = useState(defaultAddress)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [marker, setMarker] = useState<any>(null)

  // Load Mapbox
  useEffect(() => {
    // Load Mapbox script
    const script = document.createElement("script")
    script.src = `https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.js`
    script.async = true
    document.body.appendChild(script)

    // Load Mapbox CSS
    const link = document.createElement("link")
    link.href = `https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.css`
    link.rel = "stylesheet"
    document.head.appendChild(link)

    script.onload = () => {
      setMapLoaded(true)
    }

    return () => {
      document.body.removeChild(script)
      if (link.parentNode) {
        document.head.removeChild(link)
      }
    }
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapLoaded) return

    const mapboxgl = (window as any).mapboxgl
    mapboxgl.accessToken = API_CONFIG.maps.mapbox.apiKey

    const map = new mapboxgl.Map({
      container: "location-picker-map",
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-74.5, 40], // Default to US
      zoom: 2,
    })

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl())

    // Add geolocate control
    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
    })
    map.addControl(geolocate)

    // Create a marker
    const newMarker = new mapboxgl.Marker({
      color: "#8B5CF6",
      draggable: true,
    })

    // Update location when marker is dragged
    newMarker.on("dragend", async () => {
      const lngLat = newMarker.getLngLat()
      const addressFromCoords = await reverseGeocode(lngLat.lat, lngLat.lng)
      setAddress(addressFromCoords)
      onLocationSelect({
        address: addressFromCoords,
        lat: lngLat.lat,
        lng: lngLat.lng,
      })
    })

    setMapInstance(map)
    setMarker(newMarker)

    // If default address is provided, geocode it
    if (defaultAddress) {
      geocodeAddressAndUpdateMap(defaultAddress, map, newMarker)
    }

    return () => {
      map.remove()
    }
  }, [mapLoaded, defaultAddress, onLocationSelect])

  // Function to geocode address and update map
  const geocodeAddressAndUpdateMap = async (addressToGeocode: string, map: any, marker: any) => {
    setIsLoading(true)
    setError(null)

    try {
      const location = await geocodeAddress(addressToGeocode)

      if (!location) {
        setError("Could not find this location. Please try a different address.")
        setIsLoading(false)
        return
      }

      // Update map
      map.flyTo({
        center: [location.lng, location.lat],
        zoom: 14,
        essential: true,
      })

      // Update marker
      marker.setLngLat([location.lng, location.lat]).addTo(map)

      // Update location
      onLocationSelect({
        address: location.address,
        lat: location.lat,
        lng: location.lng,
      })
    } catch (err) {
      // console.error("Error geocoding address:", err)
      setError("An error occurred while finding this location.")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle search button click
  const handleSearch = () => {
    if (!address.trim()) return
    if (mapInstance && marker) {
      geocodeAddressAndUpdateMap(address, mapInstance, marker)
    }
  }

  // Handle enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  // Handle use current location
  const handleUseCurrentLocation = () => {
    if (mapInstance && "geolocation" in navigator) {
      setIsLoading(true)
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          const addressFromCoords = await reverseGeocode(latitude, longitude)

          setAddress(addressFromCoords)

          mapInstance.flyTo({
            center: [longitude, latitude],
            zoom: 14,
            essential: true,
          })

          if (marker) {
            marker.setLngLat([longitude, latitude]).addTo(mapInstance)
          }

          onLocationSelect({
            address: addressFromCoords,
            lat: latitude,
            lng: longitude,
          })

          setIsLoading(false)
        },
        (_error) => {
          // console.error("Error getting current location:", error)
          setError("Could not get your current location. Please try entering an address.")
          setIsLoading(false)
        },
      )
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Enter location..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10 bg-[#22252F] border-gray-800 text-white"
          />
        </div>
        <Button onClick={handleSearch} disabled={isLoading} className="bg-purple-600 hover:bg-purple-700 text-white">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </div>

      <Button
        variant="outline"
        onClick={handleUseCurrentLocation}
        disabled={isLoading}
        className="w-full border-gray-700 text-gray-300"
      >
        <MapPin className="mr-2 h-4 w-4" />
        Use Current Location
      </Button>

      <Card className="overflow-hidden rounded-xl border-gray-800/50 h-[300px] bg-gray-900/50">
        {!mapLoaded && (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
          </div>
        )}
        <div id="location-picker-map" className="w-full h-full" style={{ display: mapLoaded ? "block" : "none" }} />
      </Card>

      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  )
}
