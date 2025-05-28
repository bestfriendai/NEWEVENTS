"use client"

// Mapbox configuration for client-side usage
export const MAPBOX_CONFIG = {
  accessToken: process.env.NEXT_PUBLIC_MAPBOX_API_KEY || "",
  style: "mapbox://styles/mapbox/dark-v11",
  defaultCenter: [-98.5795, 39.8283] as [number, number], // Center of US
  defaultZoom: 4,
  maxZoom: 18,
  minZoom: 2,
}

// Check if Mapbox is properly configured
export function isMapboxConfigured(): boolean {
  return !!MAPBOX_CONFIG.accessToken && MAPBOX_CONFIG.accessToken.startsWith("pk.")
}

// Get Mapbox access token safely
export function getMapboxToken(): string | null {
  if (!isMapboxConfigured()) {
    console.warn("Mapbox API key is not configured or invalid")
    return null
  }
  return MAPBOX_CONFIG.accessToken
}

// Initialize Mapbox with proper error handling
export function initializeMapbox(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Mapbox can only be initialized in the browser"))
      return
    }

    // Check if already loaded
    if ((window as any).mapboxgl) {
      const mapboxgl = (window as any).mapboxgl
      const token = getMapboxToken()
      if (token) {
        mapboxgl.accessToken = token
        resolve(mapboxgl)
      } else {
        reject(new Error("Invalid Mapbox API key"))
      }
      return
    }

    // Load Mapbox dynamically
    import("mapbox-gl")
      .then((mapboxgl) => {
        const token = getMapboxToken()
        if (!token) {
          reject(new Error("Mapbox API key not configured"))
          return
        }

        mapboxgl.default.accessToken = token
        ;(window as any).mapboxgl = mapboxgl.default
        resolve(mapboxgl.default)
      })
      .catch((error) => {
        reject(new Error(`Failed to load Mapbox: ${error.message}`))
      })
  })
}
