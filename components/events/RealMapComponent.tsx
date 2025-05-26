"use client"

import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { env } from "@/lib/env"
import type { EventDetail } from "@/types/event.types"

interface RealMapComponentProps {
  userLocation?: { lat: number; lng: number; name: string }
  events: EventDetail[]
  onEventSelect: (event: EventDetail) => void
  className?: string
}

export function RealMapComponent({ userLocation, events, onEventSelect, className }: RealMapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<mapboxgl.Marker[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    mapboxgl.accessToken = env.MAPBOX_API_KEY

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: userLocation ? [userLocation.lng, userLocation.lat] : [-74.006, 40.7128], // Default to NYC
      zoom: userLocation ? 12 : 10,
      pitch: 45,
      bearing: 0,
    })

    map.current.on("load", () => {
      setMapLoaded(true)
    })

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right")

    // Add geolocate control
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      "top-right",
    )

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Update map center when user location changes
  useEffect(() => {
    if (map.current && userLocation) {
      map.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 12,
        duration: 2000,
      })
    }
  }, [userLocation])

  // Add event markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove())
    markers.current = []

    // Add new markers for events
    events.forEach((event) => {
      if (!event.location_lat || !event.location_lng) return

      // Create custom marker element
      const markerElement = document.createElement("div")
      markerElement.className = "event-marker"
      markerElement.innerHTML = `
        <div class="w-8 h-8 bg-purple-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
          <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
        </div>
      `

      // Create marker
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([event.location_lng, event.location_lat])
        .addTo(map.current!)

      // Add click handler
      markerElement.addEventListener("click", () => {
        onEventSelect(event)
      })

      // Add popup on hover
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        closeOnClick: false,
      }).setHTML(`
        <div class="p-2">
          <h3 class="font-semibold text-sm">${event.title}</h3>
          <p class="text-xs text-gray-600">${event.category}</p>
          <p class="text-xs text-gray-600">${new Date(event.start_date || "").toLocaleDateString()}</p>
        </div>
      `)

      markerElement.addEventListener("mouseenter", () => {
        popup.setLngLat([event.location_lng!, event.location_lat!]).addTo(map.current!)
      })

      markerElement.addEventListener("mouseleave", () => {
        popup.remove()
      })

      markers.current.push(marker)
    })

    // Fit map to show all events
    if (events.length > 0) {
      const bounds = new mapboxgl.LngLatBounds()
      events.forEach((event) => {
        if (event.location_lat && event.location_lng) {
          bounds.extend([event.location_lng, event.location_lat])
        }
      })

      if (userLocation) {
        bounds.extend([userLocation.lng, userLocation.lat])
      }

      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15,
      })
    }
  }, [events, mapLoaded, onEventSelect])

  return (
    <div className={className}>
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
            <p className="text-gray-400 text-sm">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  )
}
