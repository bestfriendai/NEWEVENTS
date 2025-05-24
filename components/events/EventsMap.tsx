"use client"

import { useState, useEffect, useRef } from "react"
import { MAPBOX_API_KEY } from "@/lib/env"
import { SimpleMapFallback } from "@/components/simple-map-fallback"
import { MapSkeleton } from "@/components/ui/event-skeleton"
import { logger } from "@/lib/utils/logger"
import type { EventDetailProps } from "@/components/event-detail-modal"

interface UserLocation {
  lat: number
  lng: number
  name: string
}

interface EventsMapProps {
  userLocation: UserLocation | null
  events: EventDetailProps[]
  onEventSelect: (event: EventDetailProps) => void
  className?: string
}

export function EventsMap({ userLocation, events, onEventSelect, className }: EventsMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const userMarkerRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || typeof window === "undefined") return

    const initializeMap = async () => {
      try {
        setIsLoading(true)

        // Load Mapbox GL JS dynamically
        const script = document.createElement("script")
        script.src = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"

        script.onload = () => {
          // Load CSS
          const link = document.createElement("link")
          link.href = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css"
          link.rel = "stylesheet"
          document.head.appendChild(link)

          try {
            const mapboxgl = (window as any).mapboxgl
            mapboxgl.accessToken = MAPBOX_API_KEY

            mapRef.current = new mapboxgl.Map({
              container: mapContainerRef.current,
              style: "mapbox://styles/mapbox/dark-v11",
              center: [-74.006, 40.7128], // Default to NYC
              zoom: 10,
              attributionControl: false
            })

            // Add navigation controls
            mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

            mapRef.current.on("load", () => {
              setMapLoaded(true)
              setIsLoading(false)

              logger.info("Map loaded successfully", {
                component: "EventsMap",
                action: "map_load_success"
              })
            })

            mapRef.current.on("error", () => {
              const errorMessage = "Failed to load map"
              setMapError(errorMessage)
              setIsLoading(false)

              logger.error("Map load error", {
                component: "EventsMap",
                action: "map_load_error"
              }, new Error(errorMessage))
            })

          } catch (error) {
            const errorMessage = "Failed to initialize Mapbox"
            setMapError(errorMessage)
            setIsLoading(false)

            logger.error("Mapbox initialization error", {
              component: "EventsMap",
              action: "mapbox_init_error"
            }, error instanceof Error ? error : new Error(errorMessage))
          }
        }

        script.onerror = () => {
          const errorMessage = "Failed to load Mapbox script"
          setMapError(errorMessage)
          setIsLoading(false)

          logger.error("Mapbox script load error", {
            component: "EventsMap",
            action: "script_load_error"
          }, new Error(errorMessage))
        }

        document.body.appendChild(script)

      } catch (error) {
        const errorMessage = "Map initialization failed"
        setMapError(errorMessage)
        setIsLoading(false)

        logger.error("Map initialization failed", {
          component: "EventsMap",
          action: "init_error"
        }, error instanceof Error ? error : new Error(errorMessage))
      }
    }

    initializeMap()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Update user location marker
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !userLocation) return

    try {
      // Remove existing user marker
      if (userMarkerRef.current) {
        userMarkerRef.current.remove()
      }

      // Create user location marker with pulse effect
      const el = document.createElement("div")
      el.className = "user-location-marker"
      el.innerHTML = `
        <div style="
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: #3B82F6;
          border: 3px solid white;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
          position: relative;
        ">
          <div style="
            position: absolute;
            top: -3px;
            left: -3px;
            width: 26px;
            height: 26px;
            border-radius: 50%;
            background-color: rgba(59, 130, 246, 0.3);
            animation: pulse 2s infinite;
          "></div>
        </div>
      `

      // Add pulse animation CSS if not already added
      if (!document.getElementById('pulse-animation')) {
        const style = document.createElement('style')
        style.id = 'pulse-animation'
        style.textContent = `
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.5); opacity: 0.5; }
            100% { transform: scale(2); opacity: 0; }
          }
        `
        document.head.appendChild(style)
      }

      const mapboxgl = (window as any).mapboxgl
      userMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(mapRef.current)

      // Fly to user location
      mapRef.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 12,
        duration: 2000,
      })

      logger.info("User location marker updated", {
        component: "EventsMap",
        action: "user_marker_update",
        metadata: { location: userLocation }
      })

    } catch (error) {
      logger.error("Failed to update user location marker", {
        component: "EventsMap",
        action: "user_marker_error"
      }, error instanceof Error ? error : new Error("Unknown error"))
    }
  }, [userLocation, mapLoaded])

  // Update event markers using GeoJSON for better performance
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return

    try {
      const validEvents = events.filter(event => event.coordinates)

      // Create GeoJSON source for events
      const geojsonData = {
        type: 'FeatureCollection' as const,
        features: validEvents.map(event => ({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [event.coordinates!.lng, event.coordinates!.lat]
          },
          properties: {
            id: event.id,
            title: event.title,
            category: event.category,
            price: event.price,
            image: event.image
          }
        }))
      }

      // Remove existing source and layers
      if (mapRef.current.getSource('events')) {
        if (mapRef.current.getLayer('events-layer')) {
          mapRef.current.removeLayer('events-layer')
        }
        mapRef.current.removeSource('events')
      }

      // Add new source
      mapRef.current.addSource('events', {
        type: 'geojson',
        data: geojsonData,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      })

      // Add cluster layer
      mapRef.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'events',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#8B5CF6',
            10,
            '#7C3AED',
            30,
            '#6D28D9'
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            10,
            30,
            30,
            40
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      })

      // Add cluster count labels
      mapRef.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'events',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        },
        paint: {
          'text-color': '#ffffff'
        }
      })

      // Add individual event points
      mapRef.current.addLayer({
        id: 'events-layer',
        type: 'circle',
        source: 'events',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#8B5CF6',
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      })

      // Add click handlers
      mapRef.current.on('click', 'events-layer', (e: any) => {
        const eventId = e.features[0].properties.id
        const event = events.find(e => e.id === eventId)
        if (event) {
          onEventSelect(event)
        }
      })

      mapRef.current.on('click', 'clusters', (e: any) => {
        const features = mapRef.current.queryRenderedFeatures(e.point, {
          layers: ['clusters']
        })
        const clusterId = features[0].properties.cluster_id
        mapRef.current.getSource('events').getClusterExpansionZoom(
          clusterId,
          (err: any, zoom: number) => {
            if (err) return

            mapRef.current.easeTo({
              center: features[0].geometry.coordinates,
              zoom: zoom
            })
          }
        )
      })

      // Change cursor on hover
      mapRef.current.on('mouseenter', 'events-layer', () => {
        mapRef.current.getCanvas().style.cursor = 'pointer'
      })

      mapRef.current.on('mouseleave', 'events-layer', () => {
        mapRef.current.getCanvas().style.cursor = ''
      })

      logger.info("Event markers updated", {
        component: "EventsMap",
        action: "markers_update",
        metadata: { eventCount: validEvents.length }
      })

    } catch (error) {
      logger.error("Failed to update event markers", {
        component: "EventsMap",
        action: "markers_error"
      }, error instanceof Error ? error : new Error("Unknown error"))
    }
  }, [events, mapLoaded, onEventSelect])

  // Show loading state
  if (isLoading) {
    return <MapSkeleton />
  }

  // Show error fallback
  if (mapError) {
    return (
      <SimpleMapFallback
        events={events}
        onViewDetails={onEventSelect}
        onToggleFavorite={(eventId: number) => {
          // This is a placeholder - the favorites functionality will be handled by the context
          logger.info("Favorite toggle from map fallback", {
            component: "EventsMap",
            action: "fallback_favorite_toggle",
            metadata: { eventId }
          })
        }}
      />
    )
  }

  return (
    <div className={`${className || 'h-[500px] rounded-xl border border-gray-800'} overflow-hidden`}>
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  )
}
