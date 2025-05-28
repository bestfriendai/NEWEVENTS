import { logger } from "@/lib/utils/logger"
import { geocodeLocation, reverseGeocode } from "@/app/actions/location-actions"

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

            // Try to reverse geocode the location using server action
            const result = await reverseGeocode(latitude, longitude)

            if (result.success && result.data) {
              resolve({
                lat: result.data.lat,
                lng: result.data.lng,
                address: result.data.address || result.data.name,
                city: result.data.city || "Current Location",
                state: result.data.state || "",
                country: result.data.country || "US",
                displayName: result.data.name,
              })
            } else {
              // Fallback to basic location
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

      // Use server action for geocoding
      const result = await geocodeLocation(query)

      if (result.success && result.data) {
        const location: RealUserLocation = {
          lat: result.data.lat,
          lng: result.data.lng,
          address: result.data.address || result.data.name,
          city: result.data.city || query,
          state: result.data.state || "",
          country: result.data.country || "US",
          displayName: result.data.name,
        }

        logger.info("Location search successful", {
          component: "RealLocationService",
          action: "searchLocation",
          metadata: { query, result: location },
        })

        return location
      }

      // Use fallback location
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
