"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  MapPin,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { EventDetailModal } from "@/components/event-detail-modal"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { env } from "@/lib/env"
import { cn } from "@/lib/utils"
import { logger } from "@/lib/utils/logger"
import { fetchEvents } from "@/app/actions/event-actions"
import { reverseGeocode } from "@/lib/api/map-api"
import type { EventDetail } from "@/types/event.types"
import type { MapboxMap, MapboxMarker, MapboxPopup, MapboxGeoJSONSource, MapboxEvent } from "@/types"
import { SimpleMapFallback } from "@/components/simple-map-fallback"

// Categories for filtering (removed unused constant)

// Default locations for initial events
const DEFAULT_LOCATIONS = [
  { name: "New York", lat: 40.7128, lng: -74.006 },
  { name: "Los Angeles", lat: 34.0522, lng: -118.2437 },
  { name: "Chicago", lat: 41.8781, lng: -87.6298 },
  { name: "Miami", lat: 25.7617, lng: -80.1918 },
  { name: "Austin", lat: 30.2672, lng: -97.7431 },
]

interface EnhancedMapExplorerProps {
  events?: EventDetail[]
  initialLocation?: { lat: number; lng: number }
  initialLocationName?: string
}

export function EnhancedMapExplorer({
  events: initialEvents = [],
  initialLocation,
  initialLocationName,
}: EnhancedMapExplorerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapboxMap | null>(null)
  const clusterLayerRef = useRef<string | null>(null)
  const geoJsonSourceRef = useRef<MapboxGeoJSONSource | null>(null)
  const userMarkerRef = useRef<MapboxMarker | null>(null)
  const popupRef = useRef<MapboxPopup | null>(null)
  const mapInitializedRef = useRef<boolean>(false)
  const styleLoadedRef = useRef<boolean>(false)
  const eventsLoadedRef = useRef<boolean>(false)

  const [isLoading, setIsLoading] = useState(true)
  const [events, setEvents] = useState<EventDetail[]>(initialEvents)
  const [filteredEvents, setFilteredEvents] = useState<EventDetail[]>(initialEvents)
  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [mapboxLoaded, setMapboxLoaded] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [mapStyle, setMapStyle] = useState("dark-v11")
  const [show3DBuildings, setShow3DBuildings] = useState(true)
  const [showTerrain, setShowTerrain] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(initialLocation || null)
  const [searchRadius] = useState(25)
  const [showClusters, setShowClusters] = useState(true)
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<PermissionState | null>(null)
  const [locationPermissionRequested, setLocationPermissionRequested] = useState(false)
  const [isFirstLoad, setIsFirstLoad] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)
  const [searchQuery] = useState("")
  const [selectedCategory] = useState("all")
  const [priceRange] = useState([0, 100])
  const [showFreeOnly] = useState(false)
  const [sortBy] = useState("distance")
  const [defaultLocation, setDefaultLocation] = useState<{ name: string; lat: number; lng: number }>(() => {
    if (initialLocation) {
      return { name: initialLocationName || "Your Location", lat: initialLocation.lat, lng: initialLocation.lng }
    }
    return DEFAULT_LOCATIONS[0] || { name: "New York", lat: 40.7128, lng: -74.006 }
  })

  // Update events when initialEvents changes
  useEffect(() => {
    if (initialEvents.length > 0) {
      setEvents(initialEvents)
      setFilteredEvents(initialEvents)
    }
  }, [initialEvents])

  // Load Mapbox script
  useEffect(() => {
    // Skip if already loaded
    if (mapboxLoaded || typeof window === "undefined") return

    // Add Mapbox CSS
    const link = document.createElement("link")
    link.href = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css"
    link.rel = "stylesheet"
    document.head.appendChild(link)

    // Load Mapbox script
    const script = document.createElement("script")
    script.src = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"
    script.async = true

    script.onload = () => {
      setMapboxLoaded(true)
    }

    script.onerror = () => {
      logger.error("Failed to load Mapbox GL JS", {
        component: "EnhancedMapExplorer",
        action: "mapbox_script_load_error"
      })
      setMapError("Failed to load map library. Please try again later.")
      setIsLoading(false)
    }

    document.body.appendChild(script)

    return () => {
      // Clean up
      if (document.head.contains(link)) {
        document.head.removeChild(link)
      }
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [mapboxLoaded])

  // Check location permission status
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions) return

    navigator.permissions.query({ name: "geolocation" as PermissionName }).then((result) => {
      setLocationPermissionStatus(result.state)

      // Listen for changes to permission state
      result.onchange = () => {
        setLocationPermissionStatus(result.state)
      }
    })
  }, [])

  // Initialize map after Mapbox is loaded
  useEffect(() => {
    if (!mapboxLoaded || !mapContainerRef.current || typeof window === "undefined" || mapInitializedRef.current) return

    try {
      const mapboxgl = (window as any).mapboxgl
      if (!mapboxgl) {
        logger.error("Mapbox GL JS not loaded", {
          component: "EnhancedMapExplorer",
          action: "mapbox_not_loaded"
        })
        setMapError("Mapbox GL JS failed to load. Please refresh the page.")
        setIsLoading(false)
        return
      }

      // Set the access token directly
      mapboxgl.accessToken = env.MAPBOX_API_KEY
logger.info("Initializing map", {
  component: "EnhancedMapExplorer",
  action: "map_init_start",
  metadata: { hasToken: !!env.MAPBOX_API_KEY }
})


      // Initialize map
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: `mapbox://styles/mapbox/${mapStyle}`,
        center: [defaultLocation.lng, defaultLocation.lat],
        zoom: 10,
        pitch: 45,
        bearing: 0,
        antialias: true,
      }) as MapboxMap

      // Mark map as initialized
      mapInitializedRef.current = true

      // Add navigation controls
      mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right")
      mapRef.current.addControl(new mapboxgl.ScaleControl(), "bottom-right")
      mapRef.current.addControl(new mapboxgl.FullscreenControl(), "top-right")

      // Add geolocate control
      const geolocateControl = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserHeading: true,
      })
      mapRef.current.addControl(geolocateControl, "top-right")

      // Handle map load error - specifically handle 401 errors
      mapRef.current.on("error", (e: { error?: { status?: number } }) => {
        logger.error("Map error occurred", {
          component: "EnhancedMapExplorer",
          action: "map_error",
          metadata: { status: e.error?.status }
        })
        if (e.error && e.error.status === 401) {
          setMapError("Invalid Mapbox API key. Please check your configuration or contact support.")
        } else {
          setMapError("An error occurred with the map. Please refresh the page.")
        }
        setIsLoading(false)
      })

      // Handle style load errors
      mapRef.current.on("styleimagemissing", (e: { id: string }) => {
        logger.warn("Style image missing", {
          component: "EnhancedMapExplorer",
          action: "style_image_missing",
          metadata: { imageId: e.id }
        })
      })

      // Add event markers when map loads
      mapRef.current.on("load", () => {
        logger.info("Map loaded successfully", {
          component: "EnhancedMapExplorer",
          action: "map_load_success"
        })
        styleLoadedRef.current = true
        setIsLoading(false)

        // Initialize map layers and sources
        initializeMapLayers()

        // Load initial events for default location
        if (!eventsLoadedRef.current && events.length === 0) {
          loadEventsNearLocation(defaultLocation.lat, defaultLocation.lng, searchRadius)
          setUserLocation({ lat: defaultLocation.lat, lng: defaultLocation.lng })
          eventsLoadedRef.current = true
        } else if (events.length > 0) {
          // If we already have events, just update the GeoJSON source
          updateGeoJsonSource()
        }

        // If this is the first load, prompt for location
        if (isFirstLoad) {
          setIsFirstLoad(false)
          // Only prompt if permission is not denied
          if (locationPermissionStatus !== "denied" && !locationPermissionRequested) {
            promptForLocation()
          }
        }
      })

      // Handle style load event
      mapRef.current.on("style.load", () => {
        logger.info("Style loaded", {
          component: "EnhancedMapExplorer",
          action: "style_load_success"
        })
        styleLoadedRef.current = true

        // Re-initialize map layers when style changes
        initializeMapLayers()

        // Update GeoJSON data after style change
        if (geoJsonSourceRef.current && events.length > 0) {
          updateGeoJsonSource()
        }
      })
    } catch (err) {
      logger.error("Error initializing map", {
        component: "EnhancedMapExplorer",
        action: "map_init_error"
      }, err instanceof Error ? err : new Error(String(err)))
      const error = err as Error
      if (error.message && error.message.includes("401")) {
        setMapError("Invalid Mapbox API key. Please check your configuration.")
      } else {
        setMapError("Failed to initialize the map. Please refresh the page.")
      }
      setIsLoading(false)
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapInitializedRef.current = false
        styleLoadedRef.current = false
      }
    }
  }, [
    mapboxLoaded,
    mapStyle,
    locationPermissionStatus,
    isFirstLoad,
    locationPermissionRequested,
    defaultLocation,
    searchRadius,
    events.length,
  ])

  // Initialize map layers and sources
  const initializeMapLayers = useCallback(() => {
    if (!mapRef.current || !styleLoadedRef.current) {
      logger.debug("Map or style not loaded yet, skipping layer initialization", {
        component: "EnhancedMapExplorer",
        action: "layer_init_skip"
      })
      return
    }
try {
  logger.info("Initializing map layers", {
    component: "EnhancedMapExplorer",
    action: "layer_init_start"
  })


      // Add terrain if enabled
      if (showTerrain) {
        addTerrainToMap()
      }

      // Add 3D buildings if enabled
      if (show3DBuildings) {
        add3DBuildingsToMap()
      }

      // Check if events source already exists and remove it if it does
      if (mapRef.current.getSource("events")) {
        // Remove all layers that use this source first
        if (mapRef.current.getLayer("clusters")) mapRef.current.removeLayer("clusters")
        if (mapRef.current.getLayer("cluster-count")) mapRef.current.removeLayer("cluster-count")
        if (mapRef.current.getLayer("unclustered-point")) mapRef.current.removeLayer("unclustered-point")
        if (mapRef.current.getLayer("unclustered-point-pulse")) mapRef.current.removeLayer("unclustered-point-pulse")
        if (mapRef.current.getLayer("event-symbol")) mapRef.current.removeLayer("event-symbol")

        // Then remove the source
        mapRef.current.removeSource("events")
      }

      // Add empty GeoJSON source for events
      mapRef.current.addSource("events", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
        cluster: showClusters,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      })
      geoJsonSourceRef.current = mapRef.current.getSource("events")

      // Add cluster layers
      addClusterLayers()

      // Add unclustered point layer
      mapRef.current.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "events",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": [
            "match",
            ["get", "category"],
            "Music",
            "#8B5CF6",
            "Arts",
            "#3B82F6",
            "Sports",
            "#10B981",
            "Food",
            "#EC4899",
            "Business",
            "#F59E0B",
            "#6366F1",
          ],
          "circle-radius": 10,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 0.9,
        },
      })

      // Add pulse animation layer
      mapRef.current.addLayer({
        id: "unclustered-point-pulse",
        type: "circle",
        source: "events",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": [
            "match",
            ["get", "category"],
            "Music",
            "#8B5CF6",
            "Arts",
            "#3B82F6",
            "Sports",
            "#10B981",
            "Food",
            "#EC4899",
            "Business",
            "#F59E0B",
            "#6366F1",
          ],
          "circle-radius": ["interpolate", ["linear"], ["get", "pulse"], 0, 10, 1, 25],
          "circle-opacity": ["interpolate", ["linear"], ["get", "pulse"], 0, 0.9, 1, 0],
          "circle-stroke-width": 0,
        },
      })

      // Add event count labels
      mapRef.current.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "events",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 12,
        },
        paint: {
          "text-color": "#ffffff",
        },
      })

      // Add event symbol layer for category icons
      mapRef.current.addLayer({
        id: "event-symbol",
        type: "symbol",
        source: "events",
        filter: ["!", ["has", "point_count"]],
        layout: {
          "icon-image": [
            "match",
            ["get", "category"],
            "Music",
            "music",
            "Arts",
            "art",
            "Sports",
            "stadium",
            "Food",
            "restaurant",
            "Business",
            "office",
            "marker",
          ],
          "icon-size": 0.7,
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
          "text-field": ["get", "title"],
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 12,
          "text-offset": [0, 1.5],
          "text-anchor": "top",
          "text-optional": true,
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "rgba(0, 0, 0, 0.7)",
          "text-halo-width": 1,
        },
      })

      // Add click event for clusters
      mapRef.current.on("click", "clusters", (e: MapboxEvent) => {
        const features = mapRef.current!.queryRenderedFeatures(e.point, {
          layers: ["clusters"],
        })
        const clusterId = features[0].properties.cluster_id
        geoJsonSourceRef.current!.getClusterExpansionZoom(clusterId, (err: Error | null, zoom: number) => {
          if (err) return

          mapRef.current!.flyTo({
            center: features[0].geometry.coordinates as [number, number],
            zoom: zoom,
          })
        })
      })

      // Add click event for unclustered points
      mapRef.current.on("click", "unclustered-point", (e: MapboxEvent) => {
        const coordinates = e.features[0].geometry.coordinates.slice() as [number, number]
        const properties = e.features[0].properties
        const eventId = properties.id

        // Find the event in our state
        const event = events.find((event) => event.id === Number(eventId))
        if (event) {
          setSelectedEvent(event)
        }

        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360
        }

        // Create popup
        if (popupRef.current) {
          popupRef.current.remove()
        }

        popupRef.current = new (window as any).mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          className: "event-popup",
          maxWidth: "300px",
          offset: 15,
        }) as MapboxPopup
        
        popupRef.current
          .setLngLat(coordinates)
          .setHTML(
            `
            <div class="p-2">
              <div class="font-medium text-sm">${properties.title}</div>
              <div class="text-xs text-gray-400 mt-1">${properties.location}</div>
              <div class="text-xs text-purple-400 mt-1">${properties.date}</div>
            </div>
          `,
          )
          .addTo(mapRef.current!)
      })

      // Change cursor on hover
      mapRef.current.on("mouseenter", "clusters", () => {
        mapRef.current.getCanvas().style.cursor = "pointer"
      })
      mapRef.current.on("mouseleave", "clusters", () => {
        mapRef.current.getCanvas().style.cursor = ""
      })
      mapRef.current.on("mouseenter", "unclustered-point", () => {
        mapRef.current.getCanvas().style.cursor = "pointer"
      })
      mapRef.current.on("mouseleave", "unclustered-point", () => {
        mapRef.current.getCanvas().style.cursor = ""
      })

      // Update GeoJSON data
      updateGeoJsonSource()

      logger.info("Map layers initialized successfully", {
        component: "EnhancedMapExplorer",
        action: "layer_init_success"
      })
    } catch (error) {
      logger.error("Error initializing map layers", {
        component: "EnhancedMapExplorer",
        action: "layer_init_error"
      }, error instanceof Error ? error : new Error(String(error)))
      setMapError("Error setting up map features. Please refresh the page.")
    }
  }, [events, showClusters, showTerrain, show3DBuildings])

  // Add 3D buildings to map
  const add3DBuildingsToMap = useCallback(() => {
    if (!mapRef.current || !styleLoadedRef.current) return

    try {
      // Check if 3D buildings layer already exists
      if (mapRef.current.getLayer("3d-buildings")) {
        return
      }

      // Check if the source layer exists
      if (!mapRef.current.getSource("composite")) {
        logger.debug("Composite source not available, skipping 3D buildings", {
          component: "EnhancedMapExplorer",
          action: "3d_buildings_skip"
        })
        return
      }

      // Add 3D buildings layer
      mapRef.current.addLayer(
        {
          id: "3d-buildings",
          source: "composite",
          "source-layer": "building",
          filter: ["==", "extrude", "true"],
          type: "fill-extrusion",
          minzoom: 15,
          paint: {
            "fill-extrusion-color": "#aaa",
            "fill-extrusion-height": ["get", "height"],
            "fill-extrusion-base": ["get", "min_height"],
            "fill-extrusion-opacity": 0.6,
          },
        },
        "waterway-label",
      )
    } catch (error) {
      logger.error("Error adding 3D buildings", {
        component: "EnhancedMapExplorer",
        action: "3d_buildings_error"
      }, error instanceof Error ? error : new Error(String(error)))
    }
  }, [])

  // Remove 3D buildings from map
  const remove3DBuildingsFromMap = useCallback(() => {
    if (!mapRef.current || !styleLoadedRef.current) return

    try {
      if (mapRef.current.getLayer("3d-buildings")) {
        mapRef.current.removeLayer("3d-buildings")
      }
    } catch (error) {
      logger.error("Error removing 3D buildings", {
        component: "EnhancedMapExplorer",
        action: "3d_buildings_remove_error"
      }, error instanceof Error ? error : new Error(String(error)))
    }
  }, [])

  // Add terrain to map
  const addTerrainToMap = useCallback(() => {
    if (!mapRef.current || !styleLoadedRef.current) return

    try {
      // Check if terrain source already exists
      if (mapRef.current.getSource("mapbox-dem")) {
        return
      }

      // Add terrain source
      mapRef.current.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.mapbox-terrain-dem-v1",
        tileSize: 512,
        maxzoom: 14,
      })

      // Add terrain layer
      mapRef.current.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 })

      // Add sky layer
      mapRef.current.addLayer({
        id: "sky",
        type: "sky",
        paint: {
          "sky-type": "atmosphere",
          "sky-atmosphere-sun": [0.0, 0.0],
          "sky-atmosphere-sun-intensity": 15,
        },
      })
    } catch (error) {
      logger.error("Error adding terrain", {
        component: "EnhancedMapExplorer",
        action: "terrain_add_error"
      }, error instanceof Error ? error : new Error(String(error)))
    }
  }, [])

  // Remove terrain from map
  const removeTerrainFromMap = useCallback(() => {
    if (!mapRef.current || !styleLoadedRef.current) return

    try {
      // Remove sky layer
      if (mapRef.current.getLayer("sky")) {
        mapRef.current.removeLayer("sky")
      }

      // Remove terrain
      mapRef.current.setTerrain(null)

      // Remove terrain source
      if (mapRef.current.getSource("mapbox-dem")) {
        mapRef.current.removeSource("mapbox-dem")
      }
    } catch (error) {
      logger.error("Error removing terrain", {
        component: "EnhancedMapExplorer",
        action: "terrain_remove_error"
      }, error instanceof Error ? error : new Error(String(error)))
    }
  }, [])

  // Add cluster layers to map
  const addClusterLayers = useCallback(() => {
    if (!mapRef.current || !styleLoadedRef.current) return

    try {
      // Add clusters layer
      mapRef.current.addLayer({
        id: "clusters",
        type: "circle",
        source: "events",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#8B5CF6", // Purple for small clusters
            10,
            "#3B82F6", // Blue for medium clusters
            30,
            "#EC4899", // Pink for large clusters
          ],
          "circle-radius": ["step", ["get", "point_count"], 20, 10, 30, 30, 40],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      })

      clusterLayerRef.current = "clusters"
    } catch (error) {
      logger.error("Error adding cluster layers", {
        component: "EnhancedMapExplorer",
        action: "cluster_layers_error"
      }, error instanceof Error ? error : new Error(String(error)))
    }
  }, [])

  // Update map style
  useEffect(() => {
    if (!mapRef.current || !mapboxLoaded || !mapInitializedRef.current) return

    try {
      mapRef.current.setStyle(`mapbox://styles/mapbox/${mapStyle}`)
      styleLoadedRef.current = false // Reset style loaded flag
    } catch (error) {
      logger.error("Error updating map style", {
        component: "EnhancedMapExplorer",
        action: "style_update_error"
      }, error instanceof Error ? error : new Error(String(error)))
      setMapError("Error updating map style. Please refresh the page.")
    }
  }, [mapStyle, mapboxLoaded])

  // Toggle 3D buildings
  useEffect(() => {
    if (!mapRef.current || !mapboxLoaded || !styleLoadedRef.current) return

    try {
      if (show3DBuildings) {
        add3DBuildingsToMap()
      } else {
        remove3DBuildingsFromMap()
      }
    } catch (error) {
      logger.error("Error toggling 3D buildings", {
        component: "EnhancedMapExplorer",
        action: "3d_buildings_toggle_error"
      }, error instanceof Error ? error : new Error(String(error)))
    }
  }, [show3DBuildings, mapboxLoaded, add3DBuildingsToMap, remove3DBuildingsFromMap])

  // Toggle terrain
  useEffect(() => {
    if (!mapRef.current || !mapboxLoaded || !styleLoadedRef.current) return

    try {
      if (showTerrain) {
        addTerrainToMap()
      } else {
        removeTerrainFromMap()
      }
    } catch (error) {
      logger.error("Error toggling terrain", {
        component: "EnhancedMapExplorer",
        action: "terrain_toggle_error"
      }, error instanceof Error ? error : new Error(String(error)))
    }
  }, [showTerrain, mapboxLoaded, addTerrainToMap, removeTerrainFromMap])

  // Toggle clustering
  useEffect(() => {
    if (!mapRef.current || !mapboxLoaded || !geoJsonSourceRef.current || !styleLoadedRef.current) return

    try {
      // Update clustering setting
      mapRef.current.getSource("events").setClusterProperty("cluster", showClusters)

      // Force refresh by updating the data
      updateGeoJsonSource()
    } catch (error) {
      logger.error("Error toggling clustering", {
        component: "EnhancedMapExplorer",
        action: "clustering_toggle_error"
      }, error instanceof Error ? error : new Error(String(error)))
    }
  }, [showClusters, mapboxLoaded])

  // Update GeoJSON source with events data
  const updateGeoJsonSource = useCallback(() => {
    if (!mapRef.current || !geoJsonSourceRef.current || !styleLoadedRef.current) return
try {
  logger.info("Updating GeoJSON source", {
    component: "EnhancedMapExplorer",
    action: "geojson_update_start",
    metadata: { eventCount: filteredEvents.length }
  })


      // Convert events to GeoJSON features
      const features = filteredEvents
        .map((event) => {
          if (!event.coordinates) return null

          return {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [event.coordinates.lng, event.coordinates.lat],
            },
            properties: {
              id: event.id,
              title: event.title,
              category: event.category,
              date: event.date,
              location: event.location,
              price: event.price,
              image: event.image,
              attendees: event.attendees,
              isFavorite: event.isFavorite,
              pulse: Math.random(), // Random value for pulse animation
            },
          }
        })
        .filter(Boolean)
logger.info("Generated GeoJSON features", {
  component: "EnhancedMapExplorer",
  action: "geojson_features_generated",
  metadata: { featureCount: features.length }
})


      // Update GeoJSON source
      geoJsonSourceRef.current.setData({
        type: "FeatureCollection",
        features,
      })
    } catch (error) {
      logger.error("Error updating GeoJSON source", {
        component: "EnhancedMapExplorer",
        action: "geojson_update_error"
      }, error instanceof Error ? error : new Error(String(error)))
    }
  }, [filteredEvents])

  // Update markers when filtered events change
  useEffect(() => {
    if (mapboxLoaded && mapRef.current && geoJsonSourceRef.current && styleLoadedRef.current) {
      updateGeoJsonSource()
    }
  }, [filteredEvents, mapboxLoaded, updateGeoJsonSource])

  // Prompt for user location
  const promptForLocation = useCallback(() => {
    // Location request logic would go here
    setLocationPermissionRequested(true)

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation({ lat: latitude, lng: longitude })

          // Get location name
          try {
            const locationName = await reverseGeocode(latitude, longitude)
            setDefaultLocation({ name: locationName, lat: latitude, lng: longitude })
          } catch (error) {
            logger.error("Error getting location name", {
              component: "EnhancedMapExplorer",
              action: "location_name_error"
            }, error instanceof Error ? error : new Error(String(error)))
            setDefaultLocation({ name: "Your Location", lat: latitude, lng: longitude })
          }

          // Fly to user location
          if (mapRef.current && styleLoadedRef.current) {
            mapRef.current.flyTo({
              center: [longitude, latitude],
              zoom: 10,
              duration: 2000,
            })

            // Add user location marker
            if (userMarkerRef.current) {
              userMarkerRef.current.remove()
            }

            // Create a DOM element for the marker
            const el = document.createElement("div")
            el.className = "user-location-marker"
            el.style.width = "20px"
            el.style.height = "20px"
            el.style.borderRadius = "50%"
            el.style.backgroundColor = "#4F46E5"
            el.style.border = "3px solid white"
            el.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.5)"

            // Add pulse effect
            const pulse = document.createElement("div")
            pulse.style.position = "absolute"
            pulse.style.top = "0"
            pulse.style.left = "0"
            pulse.style.right = "0"
            pulse.style.bottom = "0"
            pulse.style.borderRadius = "50%"
            pulse.style.backgroundColor = "#4F46E5"
            pulse.style.opacity = "0.6"
            pulse.style.animation = "pulse 1.5s infinite"
            el.appendChild(pulse)

            userMarkerRef.current = new (window as any).mapboxgl.Marker({
              element: el,
              anchor: "center",
            }) as MapboxMarker
            userMarkerRef.current.setLngLat([longitude, latitude]).addTo(mapRef.current!)
          }

          // Load events near user location
          loadEventsNearLocation(latitude, longitude, searchRadius)

          // Location request completed
        },
        (error) => {
          logger.error("Error getting location", {
            component: "EnhancedMapExplorer",
            action: "geolocation_error"
          }, error instanceof Error ? error : new Error(String(error)))
          setMapError(
            error.code === 1
              ? "Location permission denied. Please enable location services to see events near you."
              : "Could not get your location. Please try again or search for a location.",
          )
          // Location request failed

          // Load events for default location as fallback
          loadEventsNearLocation(defaultLocation.lat, defaultLocation.lng, searchRadius)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      )
    } else {
      setMapError("Geolocation is not supported by your browser.")
      // Geolocation not supported

      // Load events for default location as fallback
      loadEventsNearLocation(defaultLocation.lat, defaultLocation.lng, searchRadius)
    }
  }, [searchRadius, defaultLocation])

  // Load events near a location
  const loadEventsNearLocation = useCallback(async (lat: number, lng: number, radius: number) => {
    setIsLoading(true)
try {
  logger.info("Loading events near location", {
    component: "EnhancedMapExplorer",
    action: "load_events_start",
    metadata: { lat, lng, radius }
  })


      // Call the server action to fetch events
      const result = await fetchEvents({
        location: `${lat},${lng}`,
        radius,
        size: 50,
      })
logger.info("Events fetched", {
  component: "EnhancedMapExplorer",
  action: "events_fetched",
  metadata: { eventCount: result.events?.length || 0 }
})


      // Add coordinates to events if they don't have them
      const eventsWithCoordinates = result.events.map((event) => {
        if (!event.coordinates) {
          // Generate coordinates near the specified location
          const randomAngle = Math.random() * Math.PI * 2
          const randomRadius = Math.sqrt(Math.random()) * radius * 0.01 // Convert km to degrees (approximate)
          const eventLat = lat + randomRadius * Math.cos(randomAngle)
          const eventLng = lng + randomRadius * Math.sin(randomAngle)
          return {
            ...event,
            coordinates: { lat: eventLat, lng: eventLng },
          }
        }
        return event
      })
logger.info("Events processed with coordinates", {
  component: "EnhancedMapExplorer",
  action: "events_processed",
  metadata: { eventCount: eventsWithCoordinates.length }
})


      setEvents(eventsWithCoordinates)
      setFilteredEvents(eventsWithCoordinates)
    } catch (error) {
      logger.error("Error loading events", {
        component: "EnhancedMapExplorer",
        action: "load_events_error",
        metadata: { lat, lng, radius }
      }, error instanceof Error ? error : new Error(String(error)))

      // Set empty events on error
      setEvents([])
      setFilteredEvents([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // This component now uses real events from the API


  // Filter events based on search, category, and other filters
  useEffect(() => {
    let filtered = [...events]

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          event.location.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.category.toLowerCase().includes(query),
      )
    }

    // Filter by category
    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter((event) => event.category.toLowerCase() === selectedCategory.toLowerCase())
    }

    // Filter by price
    if (showFreeOnly) {
      filtered = filtered.filter((event) => event.price.toLowerCase().includes("free"))
    } else if (priceRange && priceRange.length >= 2 && priceRange[0] !== undefined && priceRange[1] !== undefined && (priceRange[0] > 0 || priceRange[1] < 100)) {
      filtered = filtered.filter((event) => {
        // Extract numeric price value
        const priceMatch = event.price.match(/\d+/)
        if (!priceMatch) return false
        const price = Number.parseInt(priceMatch[0], 10)

        // Map price range from 0-100 to 0-1000
        const minPrice = (priceRange?.[0] ?? 0) / 100 * 1000
        const maxPrice = (priceRange?.[1] ?? 100) / 100 * 1000

        return price >= minPrice && price <= maxPrice
      })
    }

    // Sort events
    if (sortBy === "distance" && userLocation) {
      // Sort by distance from user location
      filtered.sort((a, b) => {
        if (!a.coordinates || !b.coordinates) return 0

        const distanceA = calculateDistance(userLocation.lat, userLocation.lng, a.coordinates.lat, a.coordinates.lng)

        const distanceB = calculateDistance(userLocation.lat, userLocation.lng, b.coordinates.lat, b.coordinates.lng)

        return distanceA - distanceB
      })
    } else if (sortBy === "date") {
      // Sort by date
      filtered.sort((a, b) => {
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        return dateA.getTime() - dateB.getTime()
      })
    } else if (sortBy === "popularity") {
      // Sort by attendees count
      filtered.sort((a, b) => b.attendees - a.attendees)
    }

    setFilteredEvents(filtered)
  }, [events, searchQuery, selectedCategory, priceRange, showFreeOnly, sortBy, userLocation])

  // Calculate distance between two coordinates in kilometers
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1)
    const dLon = deg2rad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const d = R * c // Distance in km
    return d
  }

  // Convert degrees to radians
  const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180)
  }

  // Toggle favorite status
  const handleToggleFavorite = (eventId: number) => {
    const updatedEvents = events.map((event) =>
      event.id === eventId ? { ...event, isFavorite: !event.isFavorite } : event,
    )
    setEvents(updatedEvents)
  }

  // View event details
  const handleViewDetails = (event: EventDetail) => {
    setSelectedEvent(event)
    setShowDetailModal(true)
  }

  // Change default location
  const handleChangeDefaultLocation = (index: number) => {
    const newLocation = DEFAULT_LOCATIONS[index]
    if (newLocation) {
      setDefaultLocation(newLocation)

      if (mapRef.current && styleLoadedRef.current) {
        mapRef.current.flyTo({
          center: [newLocation.lng, newLocation.lat],
          zoom: 10,
          duration: 2000,
        })
      }

      setUserLocation({ lat: newLocation.lat, lng: newLocation.lng })
      setDefaultLocation(newLocation)
      loadEventsNearLocation(newLocation.lat, newLocation.lng, searchRadius)
    }
  }

  // If there's a map error, show the fallback component
  if (mapError) {
    return (
      <SimpleMapFallback
        events={filteredEvents}
        onViewDetails={handleViewDetails}
        onToggleFavorite={handleToggleFavorite}
      />
    )
  }

  return (
    <div className="relative h-[calc(100vh-5rem)] w-full overflow-hidden">
      {/* Map container */}
      <div className="absolute inset-0">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1A1D25]/80 z-10">
            <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
          </div>
        )}

        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Map controls */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          <Button
            variant="secondary"
            size="icon"
            className="bg-[#1A1D25]/80 backdrop-blur-sm hover:bg-[#1A1D25] text-white shadow-md"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            {showSidebar ? <ChevronLeft /> : <ChevronRight />}
          </Button>
        </div>

        {/* Quick location selector */}
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-[#1A1D25]/80 backdrop-blur-sm p-2 rounded-lg shadow-md">
            <Select
              value={defaultLocation.name}
              onValueChange={(value) => {
                const index = DEFAULT_LOCATIONS.findIndex((loc) => loc.name === value)
                if (index !== -1) {
                  handleChangeDefaultLocation(index)
                }
              }}
            >
              <SelectTrigger className="w-[180px] h-9 text-sm bg-[#22252F]/50 border-gray-700">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent className="bg-[#22252F] border-gray-700">
                {DEFAULT_LOCATIONS.map((location, index) => (
                  <SelectItem key={index} value={location.name}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Map style controls */}
        <div className="absolute bottom-4 left-4 z-10">
          <TooltipProvider>
            <div className="bg-[#1A1D25]/80 backdrop-blur-sm p-2 rounded-lg shadow-md flex flex-col gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8",
                      mapStyle === "dark-v11" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white",
                    )}
                    onClick={() => setMapStyle("dark-v11")}
                  >
                    <span className="sr-only">Dark Mode</span>
                    <div className="h-4 w-4 rounded-full bg-gray-800 border border-gray-600"></div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Dark Mode</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8",
                      mapStyle === "light-v11" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white",
                    )}
                    onClick={() => setMapStyle("light-v11")}
                  >
                    <span className="sr-only">Light Mode</span>
                    <div className="h-4 w-4 rounded-full bg-gray-200 border border-gray-300"></div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Light Mode</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8",
                      mapStyle === "satellite-streets-v12"
                        ? "bg-purple-600 text-white"
                        : "text-gray-400 hover:text-white",
                    )}
                    onClick={() => setMapStyle("satellite-streets-v12")}
                  >
                    <span className="sr-only">Satellite Mode</span>
                    <div className="h-4 w-4 rounded-full bg-blue-900 border border-blue-700"></div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Satellite Mode</p>
                </TooltipContent>
              </Tooltip>

              <div className="border-t border-gray-700 my-1"></div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8",
                      show3DBuildings ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white",
                    )}
                    onClick={() => setShow3DBuildings(!show3DBuildings)}
                  >
                    <span className="sr-only">3D Buildings</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 22V7l10-5 10 5v15"></path>
                      <path d="M11 22V9"></path>
                      <path d="M21 7l-10 5-10-5"></path>
                    </svg>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>3D Buildings</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8",
                      showTerrain ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white",
                    )}
                    onClick={() => setShowTerrain(!showTerrain)}
                  >
                    <span className="sr-only">Terrain</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m2 22 10-10 10 10"></path>
                      <path d="m4 15 10-10 10 10"></path>
                      <path d="M7 8 12 3l5 5"></path>
                    </svg>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Terrain</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8",
                      showClusters ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white",
                    )}
                    onClick={() => setShowClusters(!showClusters)}
                  >
                    <span className="sr-only">Clusters</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="3"></circle>
                      <circle cx="19" cy="5" r="2"></circle>
                      <circle cx="5" cy="19" r="2"></circle>
                      <circle cx="5" cy="5" r="2"></circle>
                      <circle cx="19" cy="19" r="2"></circle>
                    </svg>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Clusters</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

        {/* Selected event popup */}
        <AnimatePresence>
          {selectedEvent && !showSidebar && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-[#1A1D25]/90 backdrop-blur-md rounded-xl overflow-hidden border border-gray-800 shadow-xl"
            >
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 z-10 bg-[#1A1D25]/60 hover:bg-[#1A1D25]/80 text-gray-400 hover:text-white"
                  onClick={() => setSelectedEvent(null)}
                >
                  <X size={16} />
                </Button>

                <div className="p-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 relative">
                      <Image
                        src={selectedEvent.image || "/community-event.png"}
                        alt={selectedEvent.title}
                        fill
                        style={{ objectFit: 'cover' }}
                        sizes="80px"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">{selectedEvent.title}</h3>
                      <div className="flex items-center text-sm text-gray-400 mb-1">
                        <MapPin size={14} className="mr-1 text-purple-400" />
                        {selectedEvent.location}
                      </div>
                      <div className="flex items-center text-sm text-gray-400">
                        <div className="bg-purple-500/20 text-purple-300 text-xs px-2 py-0.5 rounded-full">
                          {selectedEvent.category}
                        </div>
                        <div className="mx-2 text-gray-600">•</div>
                        <div className="text-gray-400">{selectedEvent.date}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-between items-center">
                    <div className="text-sm font-medium text-white">{selectedEvent.price}</div>
                    <Button
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1 h-8"
                      onClick={() => handleViewDetails(selectedEvent)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Event detail modal */}
      {showDetailModal && selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          onFavorite={handleToggleFavorite}
        />
      )}
    </div>
  )
}
