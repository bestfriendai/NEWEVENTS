"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { geocodeAddress } from "@/lib/api/map-api"
import type { EventDetailProps } from "@/components/event-detail-modal"

interface EventMapProps {
  event: EventDetailProps
}

export function EventMap({ event }: EventMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Skip if no map container
    if (!mapRef.current) return

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

        // Load the Mapbox script
        let mapboxgl = (window as any).mapboxgl
        if (!mapboxgl) {
          const script = document.createElement("script")
          script.src = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"
          script.async = true
          document.body.appendChild(script)

          const link = document.createElement("link")
          link.href = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css"
          link.rel = "stylesheet"
          document.head.appendChild(link)

          await new Promise((resolve) => {
            script.onload = resolve
          })
        }

        // Initialize the map
        mapboxgl = (window as any).mapboxgl
        mapboxgl.accessToken =
          "pk.eyJ1IjoiZGF0ZWFpIiwiYSI6ImNsbjRtYnFvejAyaWsycXBmcTkzYnN0am0ifQ.Z5Z9_rv0PVvJAGrb7AJmRg"

        const map = new mapboxgl.Map({
          container: mapRef.current,
          style: "mapbox://styles/mapbox/dark-v11",
          center: [lng, lat],
          zoom: 14,
        })

        // Add marker
        const el = document.createElement("div")
        el.className = "marker"
        el.style.width = "24px"
        el.style.height = "24px"
        el.style.borderRadius = "50%"
        el.style.backgroundColor = "#8B5CF6"
        el.style.border = "3px solid white"
        el.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.5)"

        new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(map)

        // Add popup
        new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 25,
        })
          .setLngLat([lng, lat])
          .setHTML(`<div class="p-2"><div class="font-medium text-sm">${event.title}</div></div>`)
          .addTo(map)

        map.on("load", () => {
          setIsLoading(false)
        })

        return () => {
          map.remove()
        }
      } catch (err) {
        console.error("Error initializing map:", err)
        setError("Could not load map")
        setIsLoading(false)
      }
    }

    initMap()
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
