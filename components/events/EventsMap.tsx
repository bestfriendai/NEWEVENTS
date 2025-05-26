"use client"

import { useEffect, useRef, useState } from "react"
import { loadMapbox, createMap, createMarker, createPopup, cleanupMap } from "@/lib/mapbox-utils"
import { logger } from "@/lib/utils/logger"

interface ProcessedEvent {
  event_id: string
  name: string
  category: string
  venue: {
    name: string
    latitude: number
    longitude: number
  }
  start_time: string
}

interface EventsMapProps {
  events: ProcessedEvent[]
  center: [number, number]
  selectedEvent: ProcessedEvent | null
  onEventSelect: (event: ProcessedEvent) => void
  onError?: () => void
}

const CATEGORY_COLORS = {
  Concerts: "#8B5CF6",
  "General Events": "#06B6D4",
  "Day Parties": "#F59E0B",
  "Club Events": "#EF4444",
  Parties: "#10B981",
}

export default function EventsMap({ events, center, selectedEvent, onEventSelect, onError }: EventsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const markers = useRef<any[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    const initMap = async () => {
      try {
        // Check if Mapbox API key is available
        if (!process.env.NEXT_PUBLIC_MAPBOX_API_KEY) {
          setError(
            "Mapbox API key is not configured. Please add NEXT_PUBLIC_MAPBOX_API_KEY to your environment variables.",
          )
          return
        }

        const mapboxgl = await loadMapbox()

        map.current = await createMap(mapContainer.current!, {
          style: "mapbox://styles/mapbox/dark-v11",
          center: center[0] !== 0 && center[1] !== 0 ? center : [-74.006, 40.7128], // Default to NYC
          zoom: 12,
          attributionControl: false,
        })

        map.current.on("load", () => {
          setMapLoaded(true)
        })

        map.current.on("error", (e: any) => {
          logger.error("Map error:", e)
          setError("Failed to load map. Please check your Mapbox configuration.")
        })
      } catch (err) {
        logger.error("Failed to initialize map:", err)
        const errorMessage =
          err instanceof Error && err.message.includes("API access token")
            ? "Mapbox API key is missing or invalid. Please check your configuration."
            : "Failed to initialize map. Please check your internet connection."

        setError(errorMessage)
        onError?.()
      }
    }

    initMap()

    return () => {
      if (map.current) {
        cleanupMap(map.current)
        map.current = null
      }
    }
  }, [])

  // Update map center when location changes
  useEffect(() => {
    if (map.current && mapLoaded && center[0] !== 0 && center[1] !== 0) {
      map.current.flyTo({
        center: center,
        zoom: 12,
        duration: 1000,
      })
    }
  }, [center, mapLoaded])

  // Update markers when events change
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove())
    markers.current = []

    // Add new markers
    const addMarkers = async () => {
      try {
        for (const event of events) {
          if (!event.venue.latitude || !event.venue.longitude) continue

          const color = CATEGORY_COLORS[event.category as keyof typeof CATEGORY_COLORS] || "#6B7280"

          // Create custom marker element
          const markerElement = document.createElement("div")
          markerElement.className = "custom-marker"
          markerElement.style.cssText = `
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background-color: ${color};
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: transform 0.2s;
          `

          // Add hover effect
          markerElement.addEventListener("mouseenter", () => {
            markerElement.style.transform = "scale(1.5)"
          })
          markerElement.addEventListener("mouseleave", () => {
            markerElement.style.transform = "scale(1)"
          })

          const marker = await createMarker({
            element: markerElement,
            anchor: "center",
          })

          marker.setLngLat([event.venue.longitude, event.venue.latitude])

          // Create popup
          const popup = await createPopup({
            closeButton: false,
            closeOnClick: false,
            className: "event-popup",
          })

          const formatDate = (dateString: string) => {
            try {
              return new Date(dateString).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            } catch {
              return "Date TBD"
            }
          }

          popup.setHTML(`
            <div class="p-3 max-w-xs">
              <div class="font-semibold text-sm mb-1">${event.name}</div>
              <div class="text-xs text-gray-600 mb-1">${event.venue.name}</div>
              <div class="text-xs text-gray-500">${formatDate(event.start_time)}</div>
              <div class="mt-2">
                <span class="inline-block px-2 py-1 text-xs rounded-full" style="background-color: ${color}20; color: ${color};">
                  ${event.category}
                </span>
              </div>
            </div>
          `)

          marker.setPopup(popup)

          // Add click handler
          markerElement.addEventListener("click", () => {
            onEventSelect(event)
          })

          marker.addTo(map.current)
          markers.current.push(marker)
        }
      } catch (err) {
        logger.error("Failed to add markers:", err)
      }
    }

    addMarkers()
  }, [events, mapLoaded, onEventSelect])

  // Highlight selected event
  useEffect(() => {
    if (!map.current || !mapLoaded || !selectedEvent) return

    // Find and highlight the selected event marker
    const selectedMarker = markers.current.find((marker, index) => {
      const event = events[index]
      return event && event.event_id === selectedEvent.event_id
    })

    if (selectedMarker) {
      // Fly to the selected marker
      map.current.flyTo({
        center: [selectedEvent.venue.longitude, selectedEvent.venue.latitude],
        zoom: 15,
        duration: 1000,
      })

      // Show popup
      selectedMarker.togglePopup()
    }
  }, [selectedEvent, mapLoaded, events])

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900 text-white p-6">
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
          <h3 className="text-lg font-semibold mb-2">Map Unavailable</h3>
          <p className="text-gray-300 mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="block w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Reload Page
            </button>
            <p className="text-xs text-gray-400">Events will still be available in the sidebar</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full">
      <div ref={mapContainer} className="h-full w-full" />

      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
            <p>Loading map...</p>
          </div>
        </div>
      )}

      {/* Legend */}
      {mapLoaded && events.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <h4 className="text-sm font-semibold mb-2">Event Categories</h4>
          <div className="space-y-1">
            {Object.entries(CATEGORY_COLORS).map(([category, color]) => {
              const count = events.filter((e) => e.category === category).length
              if (count === 0) return null

              return (
                <div key={category} className="flex items-center text-xs">
                  <div className="w-3 h-3 rounded-full mr-2 border border-white" style={{ backgroundColor: color }} />
                  <span>
                    {category} ({count})
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
