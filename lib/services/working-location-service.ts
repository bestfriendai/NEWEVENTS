import { logger } from "@/lib/utils/logger"

export interface UserLocation {
  lat: number
  lng: number
  address: string
  city: string
  state: string
  country: string
  displayName: string
}

export interface LocationError {
  code: string
  message: string
}

class WorkingLocationService {
  async getCurrentLocation(): Promise<UserLocation> {
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
              component: "WorkingLocationService",
              action: "getCurrentLocation",
              metadata: { lat: latitude, lng: longitude },
            })

            const location: UserLocation = {
              lat: latitude,
              lng: longitude,
              address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              city: "Current Location",
              state: "",
              country: "US",
              displayName: "Current Location",
            }

            resolve(location)
          } catch (error) {
            logger.error("Error processing current location", {
              component: "WorkingLocationService",
              action: "getCurrentLocation",
              error: error instanceof Error ? error.message : String(error),
            })

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
            component: "WorkingLocationService",
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

  async searchLocation(query: string): Promise<UserLocation> {
    try {
      if (!query.trim()) {
        throw new Error("Location query is required")
      }

      logger.info("Searching for location", {
        component: "WorkingLocationService",
        action: "searchLocation",
        metadata: { query },
      })

      // Predefined locations for demo
      const predefinedLocations: Record<string, UserLocation> = {
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
      }

      const normalizedQuery = query.toLowerCase()
      const matchedLocation = Object.entries(predefinedLocations).find(([key]) => normalizedQuery.includes(key))

      if (matchedLocation) {
        const location = matchedLocation[1]
        logger.info("Location search successful", {
          component: "WorkingLocationService",
          action: "searchLocation",
          metadata: { query, result: location },
        })
        return location
      }

      // Default to San Francisco if no match found
      const defaultLocation = predefinedLocations["san francisco"]
      logger.info("Using default location", {
        component: "WorkingLocationService",
        action: "searchLocation",
        metadata: { query, result: defaultLocation },
      })

      return defaultLocation
    } catch (error) {
      logger.error("Location search failed", {
        component: "WorkingLocationService",
        action: "searchLocation",
        error: error instanceof Error ? error.message : String(error),
        metadata: { query },
      })

      throw {
        code: "SEARCH_FAILED",
        message: error instanceof Error ? error.message : "Location search failed",
      }
    }
  }

  getPopularLocations(): Array<{ name: string; query: string }> {
    return [
      { name: "New York, NY", query: "New York, NY" },
      { name: "Los Angeles, CA", query: "Los Angeles, CA" },
      { name: "Chicago, IL", query: "Chicago, IL" },
      { name: "San Francisco, CA", query: "San Francisco, CA" },
      { name: "Houston, TX", query: "Houston, TX" },
      { name: "Phoenix, AZ", query: "Phoenix, AZ" },
      { name: "Philadelphia, PA", query: "Philadelphia, PA" },
      { name: "San Antonio, TX", query: "San Antonio, TX" },
    ]
  }
}

export const workingLocationService = new WorkingLocationService()
