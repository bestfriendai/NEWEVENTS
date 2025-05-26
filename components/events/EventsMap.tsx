"use client"

import { useEffect, useRef, useState } from "react"
import { logger } from "@/lib/utils/logger"
import type { EventDetailProps } from "@/components/event-detail-modal"

interface EventsMapProps {
  events: EventDetailProps[]
  center: { lat: number; lng: number }
  zoom?: number
  selectedEventId: number | null
  onEventSelect: (event: EventDetailProps) => void
  className?: string
}

export function EventsMap({ events, center, zoom = 10, selectedEventId, onEventSelect, className }: EventsMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [mapboxLoaded, setMapboxLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  // Load Mapbox and initialize map
  useEffect(() => {
    if (typeof window === "undefined") return

    const mapboxApiKey = process.env.NEXT_PUBLIC_MAPBOX_API_KEY
    if (!mapboxApiKey) {
      setMapError("Mapbox API key not configured. Please add NEXT_PUBLIC_MAPBOX_API_KEY to your environment variables.")
      logger.error("Mapbox API key missing", { component: "EventsMap" })
      return
    }

    const loadMapbox = async () => {
      try {
        // Import Mapbox GL JS
        const mapboxgl = (await import("mapbox-gl")).default

        // Set access token
        ;(mapboxgl as any).accessToken = mapboxApiKey

        if (mapContainerRef.current && !mapRef.current) {
          // Create map instance
          mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: "mapbox://styles/mapbox/dark-v11",
            center: [center.lng, center.lat],
            zoom: zoom,
            projection: { name: "globe" } as any,
          })

          // Add map event listeners
          mapRef.current.on("load", () => {
            setMapboxLoaded(true)
            logger.info("Mapbox map loaded successfully", { component: "EventsMap" })

            // Set fog for globe effect
            try {
              mapRef.current.setFog({})
            } catch (e) {
              logger.warn("Could not set fog effect", { component: "EventsMap" })
            }
          })

          mapRef.current.on("error", (e: any) => {
            const errorMessage = e.error?.message || "Unknown map error"
            logger.error("Mapbox error", { component: "EventsMap", error: errorMessage })
            setMapError(`Map error: ${errorMessage}`)
          })

          // Add navigation controls
          mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right")
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load Mapbox"
        logger.error("Failed to load Mapbox", { component: "EventsMap", error: message })
        setMapError(`Failed to load map: ${message}`)
      }
    }

    loadMapbox()

    // Cleanup function
    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove()
        } catch (e) {
          logger.warn("Error removing map", { component: "EventsMap" })
        }
        mapRef.current = null
      }
    }
  }, []) // Only run once on mount

  // Update map center and zoom when props change
  useEffect(() => {
    if (mapRef.current && mapboxLoaded) {
      try {
        mapRef.current.flyTo({
          center: [center.lng, center.lat],
          zoom: zoom,
          duration: 1500,
        })
      } catch (e) {
        logger.warn("Error flying to location", { component: "EventsMap" })
      }
    }
  }, [center, zoom, mapboxLoaded])

  // Create marker element
  const createMarkerElement = (event: EventDetailProps, isSelected: boolean): HTMLElement => {
    const el = document.createElement("div")
    el.className = `w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200 transform hover:scale-110 ${
      isSelected
        ? "bg-purple-500 border-white ring-4 ring-purple-500/50 scale-110 z-10"
        : "bg-pink-500 border-white hover:bg-pink-400"
    }`

    el.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    `

    el.title = event.title
    el.style.zIndex = isSelected ? "1000" : "100"

    return el
  }

  // Update markers when events or selection changes
  useEffect(() => {
    if (!mapRef.current || !mapboxLoaded || mapError) return

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      try {
        marker.remove()
      } catch (e) {
        logger.warn("Error removing marker", { component: "EventsMap" })
      }
    })
    markersRef.current = []

    // Get Mapbox GL from window (it should be loaded by now)
    const mapboxgl = (window as any).mapboxgl
    if (!mapboxgl) {
      logger.warn("Mapbox GL not available on window", { component: "EventsMap" })
      return
    }

    // Add new markers
    events.forEach((event) => {
      if (event.coordinates) {
        try {
          const isSelected = event.id === selectedEventId
          const markerElement = createMarkerElement(event, isSelected)

          // Create marker
          const marker = new mapboxgl.Marker(markerElement)
            .setLngLat([event.coordinates.lng, event.coordinates.lat])
            .addTo(mapRef.current)

          // Add click handler
          markerElement.addEventListener("click", (e) => {
            e.stopPropagation()
            onEventSelect(event)
          })

          // Create popup
          const popup = new mapboxgl.Popup({
            offset: 25,
            closeButton: false,
            closeOnClick: false,
          }).setHTML(`
            <div class="p-2 max-w-xs">
              <div class="font-semibold text-sm mb-1">${event.title}</div>
              <div class="text-xs text-gray-600 mb-1">${event.location}</div>
              <div class="text-xs text-gray-500">${event.date} ${event.time || ""}</div>
              <div class="text-xs font-medium text-purple-600 mt-1">${event.price}</div>
            </div>
          `)

          // Show popup on hover
          markerElement.addEventListener("mouseenter", () => {
            marker.setPopup(popup).togglePopup()
          })

          markerElement.addEventListener("mouseleave", () => {
            popup.remove()
          })

          markersRef.current.push(marker)
        } catch (e) {
          logger.warn("Error creating marker", { component: "EventsMap", eventId: event.id })
        }
      }
    })

    logger.info("Updated map markers", {
      component: "EventsMap",
      markerCount: markersRef.current.length,
      eventCount: events.length,
    })
  }, [events, selectedEventId, mapboxLoaded, mapError, onEventSelect])

  // Error state
  if (mapError) {
    return (
      <div className={`flex items-center justify-center bg-gray-800 text-red-400 p-8 ${className}`}>
        <div className="text-center max-w-md">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2 text-white">Map Unavailable</h3>
          <p className="text-gray-300 mb-4">{mapError}</p>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="block w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Reload Page
            </button>
            <p className="text-xs text-gray-400">Events are still available in the sidebar</p>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (!mapboxLoaded) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 ${className}`}>
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-lg">Loading interactive map...</p>
          <p className="text-sm text-gray-400 mt-2">Powered by Mapbox</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map overlay info */}
      {events.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white">
          <div className="text-sm">
            <span className="font-medium">{events.length}</span> events found
          </div>
          <div className="text-xs text-gray-400 mt-1">Click markers to view details</div>
        </div>
      )}
    </div>
  )
}
