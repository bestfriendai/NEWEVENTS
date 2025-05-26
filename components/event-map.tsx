"use client"

import "mapbox-gl/dist/mapbox-gl.css"
import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { geocodeAddress } from "@/lib/api/map-api"
import { createMap, createMarker, createPopup, cleanupMap } from "@/lib/mapbox-utils"
import type { EventDetail } from "@/types/event.types"

interface EventMapProps {
  event: EventDetail | null
}

export function EventMap({ event }: EventMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Skip if no map container or no event
    if (!mapRef.current || !event) {
      setError("No event data available")
      setIsLoading(false)
      return
    }

    let mapInstance: any = null

    const initMap = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Check if we already have coordinates
        let lat: number, lng: number

        if (event.coordinates) {
          // Use provided coordinates
          lat = event.coordinates.lat
          lng = event.coordinates.lng
        } else {
          // Geocode the address
          const location = await geocodeAddress(event.address)
          if (!location) {
            throw new Error("Could not geocode address")
          }
          lat = location.lat
          lng = location.lng
        }

        // Use the safe Mapbox utilities
        mapInstance = await createMap(mapRef.current!, {
          center: [lng, lat],
          zoom: 14,
        })

        // Create marker element
        const el = document.createElement("div")
        el.className = "marker"
        el.style.width = "24px"
        el.style.height = "24px"
        el.style.borderRadius = "50%"
        el.style.backgroundColor = "#8B5CF6"
        el.style.border = "3px solid white"
        el.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.5)"

        // Create and add marker
        const marker = await createMarker({ element: el })
        marker.setLngLat([lng, lat]).addTo(mapInstance)

        // Create and add popup
        const popup = await createPopup({
          closeButton: false,
          closeOnClick: false,
          offset: 25,
        })
        popup
          .setLngLat([lng, lat])
          .setHTML(`<div class="p-2"><div class="font-medium text-sm">${event.title}</div></div>`)
          .addTo(mapInstance)

        mapInstance.on("load", () => {
          setIsLoading(false)
        })
      } catch (err) {
        // console.error("Error initializing map:", err)
        setError("Could not load map")
        setIsLoading(false)
      }
    }

    initMap()

    return () => {
      if (mapInstance) {
        cleanupMap(mapInstance)
      }
    }
  }, [event])

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-red-500 text-sm">{error}</div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  )
}
