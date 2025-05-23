"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MapPin,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  Compass,
  Layers,
  Zap,
  Clock,
  Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { EventDetailModal } from "@/components/event-detail-modal"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MAPBOX_API_KEY } from "@/lib/env"
import { cn } from "@/lib/utils"
import { fetchEvents } from "@/app/actions/event-actions"
import { geocodeAddress, reverseGeocode } from "@/lib/api/map-api"
import type { EventDetailProps } from "@/components/event-detail-modal"
import { SimpleMapFallback } from "@/components/simple-map-fallback"

// Categories for filtering
const CATEGORIES = [
  { id: "all", label: "All", icon: Zap },
  { id: "music", label: "Music", icon: Layers },
  { id: "arts", label: "Arts", icon: Star },
  { id: "sports", label: "Sports", icon: Compass },
  { id: "food", label: "Food", icon: Clock },
  { id: "business", label: "Business", icon: Users },
]

// Default locations for initial events
const DEFAULT_LOCATIONS = [
  { name: "New York", lat: 40.7128, lng: -74.006 },
  { name: "Los Angeles", lat: 34.0522, lng: -118.2437 },
  { name: "Chicago", lat: 41.8781, lng: -87.6298 },
  { name: "Miami", lat: 25.7617, lng: -80.1918 },
  { name: "Austin", lat: 30.2672, lng: -97.7431 },
]

interface EnhancedMapExplorerProps {
  events?: EventDetailProps[]
  initialLocation?: { lat: number; lng: number }
  initialLocationName?: string
}

export function EnhancedMapExplorer({
  events: initialEvents = [],
  initialLocation,
  initialLocationName,
}: EnhancedMapExplorerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const clusterLayerRef = useRef<string | null>(null)
  const clusterSourceRef = useRef<string | null>(null)
  const geoJsonSourceRef = useRef<any>(null)
  const userMarkerRef = useRef<any>(null)
  const popupRef = useRef<any>(null)
  const mapInitializedRef = useRef<boolean>(false)
  const styleLoadedRef = useRef<boolean>(false)
  const eventsLoadedRef = useRef<boolean>(false)

  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)
  const [events, setEvents] = useState<EventDetailProps[]>(initialEvents)
  const [filteredEvents, setFilteredEvents] = useState<EventDetailProps[]>(initialEvents)
  const [selectedEvent, setSelectedEvent] = useState<EventDetailProps | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [mapboxLoaded, setMapboxLoaded] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [mapStyle, setMapStyle] = useState("dark-v11")
  const [show3DBuildings, setShow3DBuildings] = useState(true)
  const [showTerrain, setShowTerrain] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(initialLocation || null)
  const [userLocationName, setUserLocationName] = useState<string>(initialLocationName || "")
  const [isRequestingLocation, setIsRequestingLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [searchRadius, setSearchRadius] = useState(25)
  const [priceRange, setPriceRange] = useState([0, 100])
  const [showFreeOnly, setShowFreeOnly] = useState(false)
  const [sortBy, setSortBy] = useState("distance")
  const [showClusters, setShowClusters] = useState(true)
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<PermissionState | null>(null)
  const [locationPermissionRequested, setLocationPermissionRequested] = useState(false)
  const [isFirstLoad, setIsFirstLoad] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)
  const [defaultLocation, setDefaultLocation] = useState<{ name: string; lat: number; lng: number }>(
    initialLocation
      ? { name: initialLocationName || "Your Location", lat: initialLocation.lat, lng: initialLocation.lng }
      : DEFAULT_LOCATIONS[0],
  )

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
      console.error("Failed to load Mapbox GL JS")
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
        console.error("Mapbox GL JS not loaded")
        setMapError("Mapbox GL JS failed to load. Please refresh the page.")
        setIsLoading(false)
        return
      }

      // Set the access token directly
      mapboxgl.accessToken = MAPBOX_API_KEY

      console.log("Initializing map with token:", MAPBOX_API_KEY)

      // Initialize map
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: `mapbox://styles/mapbox/${mapStyle}`,
        center: [defaultLocation.lng, defaultLocation.lat],
        zoom: 10,
        pitch: 45,
        bearing: 0,
        antialias: true,
      })

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
      mapRef.current.on("error", (e: any) => {
        console.error("Map error:", e)
        if (e.error && e.error.status === 401) {
          setMapError("Invalid Mapbox API key. Please check your configuration or contact support.")
        } else {
          setMapError("An error occurred with the map. Please refresh the page.")
        }
        setIsLoading(false)
      })

      // Handle style load errors
      mapRef.current.on("styleimagemissing", (e: any) => {
        console.warn("Style image missing:", e.id)
      })

      // Add event markers when map loads
      mapRef.current.on("load", () => {
        console.log("Map loaded successfully")
        styleLoadedRef.current = true
        setIsLoading(false)

        // Initialize map layers and sources
        initializeMapLayers()

        // Load initial events for default location
        if (!eventsLoadedRef.current && events.length === 0) {
          loadEventsNearLocation(defaultLocation.lat, defaultLocation.lng, searchRadius)
          setUserLocation({ lat: defaultLocation.lat, lng: defaultLocation.lng })
          setUserLocationName(defaultLocation.name)
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
        console.log("Style loaded")
        styleLoadedRef.current = true

        // Re-initialize map layers when style changes
        initializeMapLayers()

        // Update GeoJSON data after style change
        if (geoJsonSourceRef.current && events.length > 0) {
          updateGeoJsonSource()
        }
      })
    } catch (err) {
      console.error("Error initializing map:", err)
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
      console.log("Map or style not loaded yet, skipping layer initialization")
      return
    }

    try {
      console.log("Initializing map layers")

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
      mapRef.current.on("click", "clusters", (e: any) => {
        const features = mapRef.current.queryRenderedFeatures(e.point, {
          layers: ["clusters"],
        })
        const clusterId = features[0].properties.cluster_id
        geoJsonSourceRef.current.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
          if (err) return

          mapRef.current.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom,
          })
        })
      })

      // Add click event for unclustered points
      mapRef.current.on("click", "unclustered-point", (e: any) => {
        const coordinates = e.features[0].geometry.coordinates.slice()
        const properties = e.features[0].properties
        const eventId = properties.id

        // Find the event in our state
        const event = events.find((e) => e.id === Number(eventId))
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
        })
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
          .addTo(mapRef.current)
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

      console.log("Map layers initialized successfully")
    } catch (error) {
      console.error("Error initializing map layers:", error)
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
        console.log("Composite source not available, skipping 3D buildings")
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
      console.error("Error adding 3D buildings:", error)
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
      console.error("Error removing 3D buildings:", error)
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
      console.error("Error adding terrain:", error)
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
      console.error("Error removing terrain:", error)
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
      console.error("Error adding cluster layers:", error)
    }
  }, [])

  // Update map style
  useEffect(() => {
    if (!mapRef.current || !mapboxLoaded || !mapInitializedRef.current) return

    try {
      mapRef.current.setStyle(`mapbox://styles/mapbox/${mapStyle}`)
      styleLoadedRef.current = false // Reset style loaded flag
    } catch (error) {
      console.error("Error updating map style:", error)
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
      console.error("Error toggling 3D buildings:", error)
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
      console.error("Error toggling terrain:", error)
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
      console.error("Error toggling clustering:", error)
    }
  }, [showClusters, mapboxLoaded])

  // Update GeoJSON source with events data
  const updateGeoJsonSource = useCallback(() => {
    if (!mapRef.current || !geoJsonSourceRef.current || !styleLoadedRef.current) return

    try {
      console.log("Updating GeoJSON source with", filteredEvents.length, "events")

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

      console.log("Generated", features.length, "GeoJSON features")

      // Update GeoJSON source
      geoJsonSourceRef.current.setData({
        type: "FeatureCollection",
        features,
      })
    } catch (error) {
      console.error("Error updating GeoJSON source:", error)
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
    setIsRequestingLocation(true)
    setLocationError(null)
    setLocationPermissionRequested(true)

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation({ lat: latitude, lng: longitude })

          // Get location name
          try {
            const locationName = await reverseGeocode(latitude, longitude)
            setUserLocationName(locationName)
          } catch (error) {
            console.error("Error getting location name:", error)
            setUserLocationName("Your Location")
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
            })
              .setLngLat([longitude, latitude])
              .addTo(mapRef.current)
          }

          // Load events near user location
          loadEventsNearLocation(latitude, longitude, searchRadius)

          setIsRequestingLocation(false)
        },
        (error) => {
          console.error("Error getting location:", error)
          setLocationError(
            error.code === 1
              ? "Location permission denied. Please enable location services to see events near you."
              : "Could not get your location. Please try again or search for a location.",
          )
          setIsRequestingLocation(false)

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
      setLocationError("Geolocation is not supported by your browser.")
      setIsRequestingLocation(false)

      // Load events for default location as fallback
      loadEventsNearLocation(defaultLocation.lat, defaultLocation.lng, searchRadius)
    }
  }, [searchRadius, defaultLocation])

  // Load events near a location
  const loadEventsNearLocation = useCallback(async (lat: number, lng: number, radius: number) => {
    setIsLoadingEvents(true)

    try {
      console.log("Loading events near", lat, lng, "with radius", radius)

      // Call the server action to fetch events
      const result = await fetchEvents({
        location: `${lat},${lng}`,
        radius,
        size: 50,
      })

      console.log("Fetched events:", result)

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

      console.log("Events with coordinates:", eventsWithCoordinates)

      if (eventsWithCoordinates.length === 0) {
        // If no events were returned, generate mock events
        console.log("No events returned, generating mock events")
        const mockEvents = generateMockEventsAroundLocation(lat, lng, radius, 20)
        setEvents(mockEvents)
        setFilteredEvents(mockEvents)
      } else {
        setEvents(eventsWithCoordinates)
        setFilteredEvents(eventsWithCoordinates)
      }
    } catch (error) {
      console.error("Error loading events:", error)
      // Generate mock events around the location
      console.log("Error loading events, generating mock events")
      const mockEvents = generateMockEventsAroundLocation(lat, lng, radius, 20)
      setEvents(mockEvents)
      setFilteredEvents(mockEvents)
    } finally {
      setIsLoadingEvents(false)
    }
  }, [])

  // Generate mock events around a location
  const generateMockEventsAroundLocation = (
    lat: number,
    lng: number,
    radius: number,
    count: number,
  ): EventDetailProps[] => {
    const events: EventDetailProps[] = []
    const categories = ["Music", "Arts", "Sports", "Food", "Business"]
    const locations = [
      "Park",
      "Arena",
      "Theater",
      "Stadium",
      "Hall",
      "Center",
      "Venue",
      "Club",
      "Gallery",
      "Restaurant",
    ]

    for (let i = 0; i < count; i++) {
      // Generate random coordinates within the radius
      const randomAngle = Math.random() * Math.PI * 2
      const randomRadius = Math.sqrt(Math.random()) * radius * 0.01 // Convert km to degrees (approximate)
      const eventLat = lat + randomRadius * Math.cos(randomAngle)
      const eventLng = lng + randomRadius * Math.sin(randomAngle)

      // Generate random date within next 30 days
      const today = new Date()
      const futureDate = new Date(today)
      futureDate.setDate(today.getDate() + Math.floor(Math.random() * 30))
      const formattedDate = futureDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })

      // Generate random time
      const hours = Math.floor(Math.random() * 12) + 1
      const minutes = Math.floor(Math.random() * 4) * 15
      const period = Math.random() > 0.5 ? "PM" : "AM"
      const formattedTime = `${hours}:${minutes.toString().padStart(2, "0")} ${period}`

      // Generate random category
      const category = categories[Math.floor(Math.random() * categories.length)]

      // Generate random location
      const location = locations[Math.floor(Math.random() * locations.length)]

      // Generate random price
      const price = Math.random() > 0.3 ? `$${Math.floor(Math.random() * 100) + 10}` : "Free"

      // Generate random attendees
      const attendees = Math.floor(Math.random() * 1000) + 50

      // Create event
      events.push({
        id: 1000 + i,
        title: `${category} Event ${i + 1}`,
        description: `This is a mock ${category.toLowerCase()} event near your location.`,
        category,
        date: formattedDate,
        time: formattedTime,
        location: `${location} ${i + 1}`,
        address: `Near your location`,
        price,
        image: "/community-event.png",
        organizer: {
          name: "Local Organizer",
          avatar: "/avatar-1.png",
        },
        attendees,
        isFavorite: Math.random() > 0.8,
        coordinates: { lat: eventLat, lng: eventLng },
      })
    }

    return events
  }

  // Search for a location
  const searchLocation = async (query: string) => {
    if (!query) return

    setIsLoadingEvents(true)
    setLocationError(null)

    try {
      // Geocode the address
      const location = await geocodeAddress(query)

      if (location) {
        setUserLocation({ lat: location.lat, lng: location.lng })
        setUserLocationName(location.address)

        // Fly to location
        if (mapRef.current && styleLoadedRef.current) {
          mapRef.current.flyTo({
            center: [location.lng, location.lat],
            zoom: 10,
            duration: 2000,
          })

          // Add location marker
          if (userMarkerRef.current) {
            userMarkerRef.current.remove()
          }

          // Create a DOM element for the marker
          const el = document.createElement("div")
          el.className = "search-location-marker"
          el.style.width = "20px"
          el.style.height = "20px"
          el.style.borderRadius = "50%"
          el.style.backgroundColor = "#EC4899"
          el.style.border = "3px solid white"
          el.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.5)"

          userMarkerRef.current = new (window as any).mapboxgl.Marker({
            element: el,
            anchor: "center",
          })
            .setLngLat([location.lng, location.lat])
            .addTo(mapRef.current)
        }

        // Load events near location
        loadEventsNearLocation(location.lat, location.lng, searchRadius)
      } else {
        setLocationError("Could not find that location. Please try a different search.")

        // Load events for default location as fallback
        loadEventsNearLocation(defaultLocation.lat, defaultLocation.lng, searchRadius)
      }
    } catch (error) {
      console.error("Error searching location:", error)
      setLocationError("Error searching for location. Please try again.")

      // Load events for default location as fallback
      loadEventsNearLocation(defaultLocation.lat, defaultLocation.lng, searchRadius)
    } finally {
      setIsLoadingEvents(false)
    }
  }

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
    } else if (priceRange[0] > 0 || priceRange[1] < 100) {
      filtered = filtered.filter((event) => {
        // Extract numeric price value
        const priceMatch = event.price.match(/\d+/)
        if (!priceMatch) return false
        const price = Number.parseInt(priceMatch[0], 10)

        // Map price range from 0-100 to 0-1000
        const minPrice = (priceRange[0] / 100) * 1000
        const maxPrice = (priceRange[1] / 100) * 1000

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

  // Get color based on event category
  const getCategoryColor = (category: string): string => {
    switch (category.toLowerCase()) {
      case "music":
        return "#8B5CF6" // Purple
      case "arts":
        return "#3B82F6" // Blue
      case "sports":
        return "#10B981" // Green
      case "food":
        return "#EC4899" // Pink
      case "business":
        return "#F59E0B" // Yellow
      default:
        return "#6366F1" // Indigo
    }
  }

  // Toggle favorite status
  const handleToggleFavorite = (eventId: number) => {
    const updatedEvents = events.map((event) =>
      event.id === eventId ? { ...event, isFavorite: !event.isFavorite } : event,
    )
    setEvents(updatedEvents)
  }

  // View event details
  const handleViewDetails = (event: EventDetailProps) => {
    setSelectedEvent(event)
    setShowDetailModal(true)
  }

  // Handle event selection
  const handleEventSelect = (event: EventDetailProps) => {
    setSelectedEvent(event)

    // Fly to the event location
    if (mapRef.current && event.coordinates && styleLoadedRef.current) {
      mapRef.current.flyTo({
        center: [event.coordinates.lng, event.coordinates.lat],
        zoom: 14,
        duration: 1500,
      })

      // Close any open popups
      if (popupRef.current) {
        popupRef.current.remove()
      }

      // Create popup
      popupRef.current = new (window as any).mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: "event-popup",
        maxWidth: "300px",
        offset: 15,
      })
        .setLngLat([event.coordinates.lng, event.coordinates.lat])
        .setHTML(
          `
          <div class="p-2">
            <div class="font-medium text-sm">${event.title}</div>
            <div class="text-xs text-gray-400 mt-1">${event.location}</div>
            <div class="text-xs text-purple-400 mt-1">${event.date}</div>
          </div>
        `,
        )
        .addTo(mapRef.current)
    }
  }

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    searchLocation(searchQuery)
  }

  // Handle radius change
  const handleRadiusChange = (value: number[]) => {
    setSearchRadius(value[0])

    // If we have a user location, update the events
    if (userLocation) {
      loadEventsNearLocation(userLocation.lat, userLocation.lng, value[0])
    }
  }

  // Change default location
  const handleChangeDefaultLocation = (index: number) => {
    const newLocation = DEFAULT_LOCATIONS[index]
    setDefaultLocation(newLocation)

    if (mapRef.current && styleLoadedRef.current) {
      mapRef.current.flyTo({
        center: [newLocation.lng, newLocation.lat],
        zoom: 10,
        duration: 2000,
      })
    }

    setUserLocation({ lat: newLocation.lat, lng: newLocation.lng })
    setUserLocationName(newLocation.name)
    loadEventsNearLocation(newLocation.lat, newLocation.lng, searchRadius)
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
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={selectedEvent.image || "/community-event.png"}
                        alt={selectedEvent.title}
                        className="w-full h-full object-cover"
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

// Event list item component
interface EventListItemProps {
  event: EventDetailProps
  isSelected: boolean
  onSelect: () => void
  onViewDetails: () => void
  onToggleFavorite: () => void
}

function EventListItem({ event, isSelected, onSelect, onViewDetails, onToggleFavorite }: EventListItemProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        "cursor-pointer rounded-xl overflow-hidden border transition-all duration-200",
        isSelected
          ? "border-purple-500 bg-[#22252F]/80 shadow-glow-sm"
          : "border-gray-800 bg-[#22252F]/50 hover:border-gray-700",
      )}
      onClick={onSelect}
    >
      <div className="p-3">
        <div className="flex gap-3">
          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
            <img src={event.image || "/community-event.png"} alt={event.title} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <Badge
                className={cn(
                  "text-xs font-medium border-0 px-2 py-0.5",
                  event.category === "Music"
                    ? "bg-purple-500/20 text-purple-300"
                    : event.category === "Arts"
                      ? "bg-blue-500/20 text-blue-300"
                      : event.category === "Sports"
                        ? "bg-green-500/20 text-green-300"
                        : event.category === "Food"
                          ? "bg-pink-500/20 text-pink-300"
                          : "bg-yellow-500/20 text-yellow-300",
                )}
              >
                {event.category}
              </Badge>
              <motion.button
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleFavorite()
                }}
                className="text-gray-400 hover:text-purple-400 transition-colors duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill={event.isFavorite ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={event.isFavorite ? "text-purple-500" : "text-gray-400"}
                >
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
              </motion.button>
            </div>
            <h3 className="font-medium text-gray-200 text-sm truncate">{event.title}</h3>
            <div className="flex items-center text-xs text-gray-400 mt-1">
              <Calendar size={10} className="mr-1 text-purple-400 flex-shrink-0" />
              <span className="truncate">{event.date}</span>
            </div>
            <div className="flex items-center text-xs text-gray-400 mt-1">
              <MapPin size={10} className="mr-1 text-purple-400 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-800/50">
          <div className="flex items-center text-xs text-gray-400">
            <Users size={10} className="mr-1" />
            <span className="text-purple-400 font-medium">{event.attendees}</span> attending
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-900/20"
            onClick={(e) => {
              e.stopPropagation()
              onViewDetails()
            }}
          >
            Details
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
