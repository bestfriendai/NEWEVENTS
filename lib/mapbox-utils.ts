"use client"

// Track if Mapbox has been loaded
let mapboxLoaded = false
let mapboxLoadPromise: Promise<any> | null = null

/**
 * Safely load Mapbox GL JS
 */
export function loadMapbox(): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Mapbox can only be loaded in the browser"))
  }

  // Return existing promise if already loading
  if (mapboxLoadPromise) {
    return mapboxLoadPromise
  }

  // Return mapbox if already loaded
  if (mapboxLoaded && window.mapboxgl) {
    return Promise.resolve(window.mapboxgl)
  }

  mapboxLoadPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.mapboxgl) {
      mapboxLoaded = true
      resolve(window.mapboxgl)
      return
    }

    // Load Mapbox CSS
    const cssLink = document.createElement("link")
    cssLink.href = "https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css"
    cssLink.rel = "stylesheet"
    document.head.appendChild(cssLink)

    // Load Mapbox JS
    const script = document.createElement("script")
    script.src = "https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js"
    script.async = true

    script.onload = () => {
      if ((window as any).mapboxgl) {
        // Set the access token immediately after loading
        const mapboxApiKey = process.env.NEXT_PUBLIC_MAPBOX_API_KEY
        if (mapboxApiKey) {
          ;(window as any).mapboxgl.accessToken = mapboxApiKey
        }
        mapboxLoaded = true
        resolve((window as any).mapboxgl)
      } else {
        reject(new Error("Mapbox GL JS failed to load"))
      }
    }

    script.onerror = () => {
      reject(new Error("Failed to load Mapbox GL JS script"))
    }

    document.head.appendChild(script)
  })

  return mapboxLoadPromise
}

/**
 * Check if Mapbox is available
 */
export function isMapboxAvailable(): boolean {
  return typeof window !== "undefined" && mapboxLoaded && !!window.mapboxgl
}

/**
 * Get Mapbox instance safely
 */
export function getMapbox(): any | null {
  if (typeof window === "undefined" || !mapboxLoaded) {
    return null
  }
  return window.mapboxgl || null
}

/**
 * Create a map safely with error handling
 */
export async function createMap(container: HTMLElement | string, options: any = {}): Promise<any> {
  try {
    const mapboxgl = await loadMapbox()

    // Check if access token is set, if not try to set it
    if (!(mapboxgl as any).accessToken) {
      const mapboxApiKey = process.env.NEXT_PUBLIC_MAPBOX_API_KEY
      if (mapboxApiKey) {
        ;(mapboxgl as any).accessToken = mapboxApiKey
      } else {
        throw new Error(
          "Mapbox access token is not configured. Please set NEXT_PUBLIC_MAPBOX_API_KEY environment variable.",
        )
      }
    }

    const defaultOptions = {
      style: "mapbox://styles/mapbox/dark-v11",
      center: [0, 20],
      zoom: 2,
      ...options,
    }

    return new mapboxgl.Map({
      container,
      ...defaultOptions,
    })
  } catch (error) {
    console.error("Error creating map:", error)
    throw error
  }
}

/**
 * Create a marker safely
 */
export async function createMarker(options: any = {}): Promise<any> {
  try {
    const mapboxgl = await loadMapbox()
    return new mapboxgl.Marker(options)
  } catch (error) {
    console.error("Error creating marker:", error)
    throw error
  }
}

/**
 * Create a popup safely
 */
export async function createPopup(options: any = {}): Promise<any> {
  try {
    const mapboxgl = await loadMapbox()
    return new mapboxgl.Popup(options)
  } catch (error) {
    console.error("Error creating popup:", error)
    throw error
  }
}

/**
 * Hook for using Mapbox in React components
 */
export function useMapbox() {
  return {
    loadMapbox,
    isMapboxAvailable,
    getMapbox,
    createMap,
    createMarker,
    createPopup,
  }
}

/**
 * Cleanup function for maps
 */
export function cleanupMap(map: any) {
  if (map && typeof map.remove === "function") {
    try {
      map.remove()
    } catch (error) {
      console.warn("Error removing map:", error)
    }
  }
}

/**
 * Reset Mapbox state (useful for testing)
 */
export function resetMapbox() {
  mapboxLoaded = false
  mapboxLoadPromise = null
}
