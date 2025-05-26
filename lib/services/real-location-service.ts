import { logger } from "@/lib/utils/logger"

export interface RealUserLocation {
  lat: number
  lng: number
  address: string
  city: string
  state: string
  country: string
  displayName: string
}

export interface RealLocationError {
  code: string
  message: string
}

class RealLocationService {
  private readonly mapboxApiKey = process.env.NEXT_PUBLIC_MAPBOX_API_KEY

  async getCurrentLocation(): Promise<RealUserLocation> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject({
          code: "GEOLOCATION_NOT_SUPPORTED",
          message: "Geolocation is not supported by this browser",
        })
        return
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords

            logger.info("Current location obtained", {
              component: "RealLocationService",
              action: "getCurrentLocation",
              metadata: { lat: latitude, lng: longitude },
            })

            // Try to reverse geocode the location
            const location = await this.reverseGeocode(latitude, longitude)
            resolve(location)
          } catch (error) {
            logger.error("Error processing current location", {
              component: "RealLocationService",
              action: "getCurrentLocation",
              error: error instanceof Error ? error.message : String(error),
            })

            // Fallback to basic location
            const { latitude, longitude } = position.coords
            resolve({
              lat: latitude,
              lng: longitude,
              address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              city: "Current Location",
              state: "",
              country: "US",
              displayName: "Current Location",
            })
          }
        },
        (error) => {
          logger.error("Geolocation error", {
            component: "RealLocationService",
            action: "getCurrentLocation",
            error: error.message,
          })

          let errorMessage = "Failed to get current location"
          let errorCode = "LOCATION_ERROR"

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied. Please enable location permissions."
              errorCode = "PERMISSION_DENIED"
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable."
              errorCode = "POSITION_UNAVAILABLE"
              break
            case error.TIMEOUT:
              errorMessage = "Location request timed out."
              errorCode = "TIMEOUT"
              break
          }

          reject({ code: errorCode, message: errorMessage })
        },
        options,
      )
    })
  }

  async searchLocation(query: string): Promise<RealUserLocation> {
    try {
      if (!query.trim()) {
        throw new Error("Location query is required")
      }

      logger.info("Searching for location", {
        component: "RealLocationService",
        action: "searchLocation",
        metadata: { query },
      })

      if (!this.mapboxApiKey) {
        logger.warn("Mapbox API key not found, using fallback")
        return this.getFallbackLocation(query)
      }

      const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`)
      url.searchParams.set("access_token", this.mapboxApiKey)
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

        const location: RealUserLocation = {
          lat,
          lng,
          address: place,
          city,
          state,
          country,
          displayName: `${city}${state ? `, ${state}` : ""}`,
        }

        logger.info("Location search successful", {
          component: "RealLocationService",
          action: "searchLocation",
          metadata: { query, result: location },
        })

        return location
      }

      // No results found, use fallback
      return this.getFallbackLocation(query)
    } catch (error) {
      logger.error("Location search failed", {
        component: "RealLocationService",
        action: "searchLocation",
        error: error instanceof Error ? error.message : String(error),
        metadata: { query },
      })

      // Use fallback location
      return this.getFallbackLocation(query)
    }
  }

  private async reverseGeocode(lat: number, lng: number): Promise<RealUserLocation> {
    if (!this.mapboxApiKey) {
      return {
        lat,
        lng,
        address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        city: "Current Location",
        state: "",
        country: "US",
        displayName: "Current Location",
      }
    }

    try {
      const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`)
      url.searchParams.set("access_token", this.mapboxApiKey)
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
          lat,
          lng,
          address: place,
          city,
          state,
          country,
          displayName: `${city}${state ? `, ${state}` : ""}`,
        }
      }
    } catch (error) {
      logger.error("Reverse geocoding failed", {
        component: "RealLocationService",
        action: "reverseGeocode",
        error: error instanceof Error ? error.message : String(error),
      })
    }

    // Fallback
    return {
      lat,
      lng,
      address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      city: "Current Location",
      state: "",
      country: "US",
      displayName: "Current Location",
    }
  }

  private getFallbackLocation(query: string): RealUserLocation {
    // Predefined locations for fallback
    const predefinedLocations: Record<string, RealUserLocation> = {
      "new york": {
        lat: 40.7128,
        lng: -74.006,
        address: "New York, NY, USA",
        city: "New York",
        state: "NY",
        country: "US",
        displayName: "New York, NY",
      },
      "los angeles": {
        lat: 34.0522,
        lng: -118.2437,
        address: "Los Angeles, CA, USA",
        city: "Los Angeles",
        state: "CA",
        country: "US",
        displayName: "Los Angeles, CA",
      },
      chicago: {
        lat: 41.8781,
        lng: -87.6298,
        address: "Chicago, IL, USA",
        city: "Chicago",
        state: "IL",
        country: "US",
        displayName: "Chicago, IL",
      },
      "san francisco": {
        lat: 37.7749,
        lng: -122.4194,
        address: "San Francisco, CA, USA",
        city: "San Francisco",
        state: "CA",
        country: "US",
        displayName: "San Francisco, CA",
      },
      miami: {
        lat: 25.7617,
        lng: -80.1918,
        address: "Miami, FL, USA",
        city: "Miami",
        state: "FL",
        country: "US",
        displayName: "Miami, FL",
      },
      seattle: {
        lat: 47.6062,
        lng: -122.3321,
        address: "Seattle, WA, USA",
        city: "Seattle",
        state: "WA",
        country: "US",
        displayName: "Seattle, WA",
      },
      austin: {
        lat: 30.2672,
        lng: -97.7431,
        address: "Austin, TX, USA",
        city: "Austin",
        state: "TX",
        country: "US",
        displayName: "Austin, TX",
      },
      denver: {
        lat: 39.7392,
        lng: -104.9903,
        address: "Denver, CO, USA",
        city: "Denver",
        state: "CO",
        country: "US",
        displayName: "Denver, CO",
      },
    }

    const normalizedQuery = query.toLowerCase()
    const matchedLocation = Object.entries(predefinedLocations).find(([key]) => normalizedQuery.includes(key))

    if (matchedLocation) {
      return matchedLocation[1]
    }

    // Default to San Francisco if no match found
    return predefinedLocations["san francisco"]
  }

  getPopularLocations(): Array<{ name: string; query: string }> {
    return [
      { name: "New York, NY", query: "New York, NY" },
      { name: "Los Angeles, CA", query: "Los Angeles, CA" },
      { name: "Chicago, IL", query: "Chicago, IL" },
      { name: "San Francisco, CA", query: "San Francisco, CA" },
      { name: "Miami, FL", query: "Miami, FL" },
      { name: "Seattle, WA", query: "Seattle, WA" },
      { name: "Austin, TX", query: "Austin, TX" },
      { name: "Denver, CO", query: "Denver, CO" },
    ]
  }
}

export const realLocationService = new RealLocationService()
