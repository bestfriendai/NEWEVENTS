"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { geocodeAddress } from "@/lib/api/map-api"
import { API_CONFIG } from "@/lib/env"
import { Loader2 } from "lucide-react"

interface EventMapProps {
  address: string
  className?: string
  height?: string
}

export function EventMap({ address, className = "", height = "300px" }: EventMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

    script.onload = async () => {
      if (!mapRef.current) return

      try {
        // Geocode the address
        const location = await geocodeAddress(address)

        if (!location) {
          setError("Could not find location on map")
          setIsLoading(false)
          return
        }

        // Initialize the map
        const mapboxgl = (window as any).mapboxgl
        mapboxgl.accessToken = API_CONFIG.maps.mapbox.apiKey

        const map = new mapboxgl.Map({
          container: mapRef.current,
          style: "mapbox://styles/mapbox/dark-v11",
          center: [location.lng, location.lat],
          zoom: 14,
        })

        // Add marker
        new mapboxgl.Marker({ color: "#8B5CF6" }).setLngLat([location.lng, location.lat]).addTo(map)

        // Add navigation controls
        map.addControl(new mapboxgl.NavigationControl())

        setIsLoading(false)
      } catch (err) {
        console.error("Error initializing map:", err)
        setError("Failed to load map")
        setIsLoading(false)
      }
    }

    script.onerror = () => {
      setError("Failed to load map")
      setIsLoading(false)
    }

    return () => {
      document.body.removeChild(script)
      if (link.parentNode) {
        document.head.removeChild(link)
      }
    }
  }, [address])

  return (
    <Card className={`overflow-hidden rounded-xl border-gray-800/50 ${className}`} style={{ height }}>
      {isLoading && (
        <div className="flex items-center justify-center h-full bg-gray-900/50">
          <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
        </div>
      )}
      {error && (
        <div className="flex items-center justify-center h-full bg-gray-900/50 text-gray-400">
          <p>{error}</p>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" style={{ display: isLoading || error ? "none" : "block" }} />
    </Card>
  )
}
