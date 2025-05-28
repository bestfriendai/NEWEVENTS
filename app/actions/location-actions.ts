"use server"

import { logger } from "@/lib/utils/logger"

export interface LocationResult {
  lat: number
  lng: number
  name: string
  address?: string
  city?: string
  state?: string
  country?: string
}

export interface LocationError {
  code: string
  message: string
}

export interface LocationResponse {
  success: boolean
  data?: LocationResult
  error?: LocationError
}

/**
 * Server action to geocode a location query
 */
export async function geocodeLocation(query: string): Promise<LocationResponse> {
  try {
    if (!query.trim()) {
      return {
        success: false,
        error: {
          code: "INVALID_QUERY",
          message: "Location query is required",
        },
      }
    }

    const mapboxApiKey = process.env.MAPBOX_API_KEY
    if (!mapboxApiKey) {
      logger.warn("Mapbox API key not configured, using fallback")
      return getFallbackLocation(query)
    }

    logger.info("Geocoding location", {
      component: "LocationActions",
      action: "geocodeLocation",
      query,
    })

    const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`)
    url.searchParams.set("access_token", mapboxApiKey)
    url.searchParams.set("limit", "1")
    url.searchParams.set("types", "place,locality,neighborhood,address")

    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.features && data.features.length > 0) {
      const feature = data.features[0]
      const [lng, lat] = feature.center

      // Extract location components
      const context = feature.context || []
      const place = feature.place_name
      const city = feature.text
      const state = context.find((c: any) => c.id.startsWith("region"))?.text || ""
      const country = context.find((c: any) => c.id.startsWith("country"))?.short_code?.toUpperCase() || "US"

      const result: LocationResult = {
        lat,
        lng,
        name: place,
        address: place,
        city,
        state,
        country,
      }

      logger.info("Geocoding successful", {
        component: "LocationActions",
        action: "geocodeLocation",
        query,
        result: { lat, lng, city, state },
      })

      return {
        success: true,
        data: result,
      }
    }

    // No results found, use fallback
    return getFallbackLocation(query)
  } catch (error) {
    logger.error("Geocoding failed", {
      component: "LocationActions",
      action: "geocodeLocation",
      error: error instanceof Error ? error.message : String(error),
      query,
    })

    // Use fallback location
    return getFallbackLocation(query)
  }
}

/**
 * Server action to reverse geocode coordinates
 */
export async function reverseGeocode(lat: number, lng: number): Promise<LocationResponse> {
  try {
    const mapboxApiKey = process.env.MAPBOX_API_KEY
    if (!mapboxApiKey) {
      return {
        success: true,
        data: {
          lat,
          lng,
          name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          city: "Current Location",
          state: "",
          country: "US",
        },
      }
    }

    logger.info("Reverse geocoding", {
      component: "LocationActions",
      action: "reverseGeocode",
      coordinates: { lat, lng },
    })

    const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`)
    url.searchParams.set("access_token", mapboxApiKey)
    url.searchParams.set("limit", "1")

    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`Mapbox reverse geocoding error: ${response.status}`)
    }

    const data = await response.json()

    if (data.features && data.features.length > 0) {
      const feature = data.features[0]
      const context = feature.context || []
      const place = feature.place_name
      const city = context.find((c: any) => c.id.startsWith("place"))?.text || "Current Location"
      const state = context.find((c: any) => c.id.startsWith("region"))?.short_code || ""
      const country = context.find((c: any) => c.id.startsWith("country"))?.short_code?.toUpperCase() || "US"

      return {
        success: true,
        data: {
          lat,
          lng,
          name: place,
          address: place,
          city,
          state,
          country,
        },
      }
    }

    // Fallback
    return {
      success: true,
      data: {
        lat,
        lng,
        name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        city: "Current Location",
        state: "",
        country: "US",
      },
    }
  } catch (error) {
    logger.error("Reverse geocoding failed", {
      component: "LocationActions",
      action: "reverseGeocode",
      error: error instanceof Error ? error.message : String(error),
      coordinates: { lat, lng },
    })

    // Fallback
    return {
      success: true,
      data: {
        lat,
        lng,
        name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        city: "Current Location",
        state: "",
        country: "US",
      },
    }
  }
}

/**
 * Get popular locations for quick selection
 */
export async function getPopularLocations(): Promise<LocationResult[]> {
  return [
    {
      lat: 40.7128,
      lng: -74.006,
      name: "New York, NY, USA",
      address: "New York, NY, USA",
      city: "New York",
      state: "NY",
      country: "US",
    },
    {
      lat: 34.0522,
      lng: -118.2437,
      name: "Los Angeles, CA, USA",
      address: "Los Angeles, CA, USA",
      city: "Los Angeles",
      state: "CA",
      country: "US",
    },
    {
      lat: 41.8781,
      lng: -87.6298,
      name: "Chicago, IL, USA",
      address: "Chicago, IL, USA",
      city: "Chicago",
      state: "IL",
      country: "US",
    },
    {
      lat: 37.7749,
      lng: -122.4194,
      name: "San Francisco, CA, USA",
      address: "San Francisco, CA, USA",
      city: "San Francisco",
      state: "CA",
      country: "US",
    },
    {
      lat: 25.7617,
      lng: -80.1918,
      name: "Miami, FL, USA",
      address: "Miami, FL, USA",
      city: "Miami",
      state: "FL",
      country: "US",
    },
    {
      lat: 47.6062,
      lng: -122.3321,
      name: "Seattle, WA, USA",
      address: "Seattle, WA, USA",
      city: "Seattle",
      state: "WA",
      country: "US",
    },
    {
      lat: 30.2672,
      lng: -97.7431,
      name: "Austin, TX, USA",
      address: "Austin, TX, USA",
      city: "Austin",
      state: "TX",
      country: "US",
    },
    {
      lat: 39.7392,
      lng: -104.9903,
      name: "Denver, CO, USA",
      address: "Denver, CO, USA",
      city: "Denver",
      state: "CO",
      country: "US",
    },
  ]
}

/**
 * Fallback location lookup for when Mapbox is not available
 */
function getFallbackLocation(query: string): LocationResponse {
  const predefinedLocations: Record<string, LocationResult> = {
    "new york": {
      lat: 40.7128,
      lng: -74.006,
      name: "New York, NY, USA",
      address: "New York, NY, USA",
      city: "New York",
      state: "NY",
      country: "US",
    },
    "los angeles": {
      lat: 34.0522,
      lng: -118.2437,
      name: "Los Angeles, CA, USA",
      address: "Los Angeles, CA, USA",
      city: "Los Angeles",
      state: "CA",
      country: "US",
    },
    chicago: {
      lat: 41.8781,
      lng: -87.6298,
      name: "Chicago, IL, USA",
      address: "Chicago, IL, USA",
      city: "Chicago",
      state: "IL",
      country: "US",
    },
    "san francisco": {
      lat: 37.7749,
      lng: -122.4194,
      name: "San Francisco, CA, USA",
      address: "San Francisco, CA, USA",
      city: "San Francisco",
      state: "CA",
      country: "US",
    },
    miami: {
      lat: 25.7617,
      lng: -80.1918,
      name: "Miami, FL, USA",
      address: "Miami, FL, USA",
      city: "Miami",
      state: "FL",
      country: "US",
    },
    seattle: {
      lat: 47.6062,
      lng: -122.3321,
      name: "Seattle, WA, USA",
      address: "Seattle, WA, USA",
      city: "Seattle",
      state: "WA",
      country: "US",
    },
    austin: {
      lat: 30.2672,
      lng: -97.7431,
      name: "Austin, TX, USA",
      address: "Austin, TX, USA",
      city: "Austin",
      state: "TX",
      country: "US",
    },
    denver: {
      lat: 39.7392,
      lng: -104.9903,
      name: "Denver, CO, USA",
      address: "Denver, CO, USA",
      city: "Denver",
      state: "CO",
      country: "US",
    },
  }

  const normalizedQuery = query.toLowerCase()
  const matchedLocation = Object.entries(predefinedLocations).find(([key]) => normalizedQuery.includes(key))

  if (matchedLocation) {
    return {
      success: true,
      data: matchedLocation[1],
    }
  }

  // Default to San Francisco if no match found
  return {
    success: true,
    data: predefinedLocations["san francisco"],
  }
}
