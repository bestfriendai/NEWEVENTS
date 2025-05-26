import { logger } from "@/lib/utils/logger"
import { formatErrorMessage } from "@/lib/utils"

export interface SafeUserLocation {
  lat: number
  lng: number
  address: string
  city: string
  state: string
  country: string
  displayName: string
}

export interface SafeLocationError {
  code: string
  message: string
}

class SafeLocationService {
  async getCurrentLocation(): Promise<SafeUserLocation> {
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
        timeout: 15000, // Increased timeout
        maximumAge: 300000, // 5 minutes
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords

            logger.info("Current location obtained", {
              component: "SafeLocationService",
              action: "getCurrentLocation",
              metadata: { lat: latitude, lng: longitude, accuracy: position.coords.accuracy },
            })

            // Use a simple address format since reverse geocoding might fail
            const address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`

            const location: SafeUserLocation = {
              lat: latitude,
              lng: longitude,
              address: address,
              city: "Current Location",
              state: "",
              country: "US",
              displayName: "Current Location",
            }

            resolve(location)
          } catch (error) {
            logger.error("Error processing current location", {
              component: "SafeLocationService",
              action: "getCurrentLocation",
              error: error instanceof Error ? error.message : String(error),
            })

            // Still resolve with basic location data
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
            component: "SafeLocationService",
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

  async searchLocation(query: string): Promise<SafeUserLocation> {
    try {
      if (!query.trim()) {
        throw new Error("Location query is required")
      }

      logger.info("Searching for location", {
        component: "SafeLocationService",
        action: "searchLocation",
        metadata: { query },
      })

      // For demo purposes, we'll use some predefined locations
      const predefinedLocations: Record<string, SafeUserLocation> = {
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
          component: "SafeLocationService",
          action: "searchLocation",
          metadata: { query, result: location },
        })
        return location
      }

      // Default to San Francisco if no match found
      const defaultLocation = predefinedLocations["san francisco"]
      logger.info("Using default location", {
        component: "SafeLocationService",
        action: "searchLocation",
        metadata: { query, result: defaultLocation },
      })

      return defaultLocation
    } catch (error) {
      logger.error("Location search failed", {
        component: "SafeLocationService",
        action: "searchLocation",
        error: error instanceof Error ? error.message : String(error),
        metadata: { query },
      })

      throw {
        code: "SEARCH_FAILED",
        message: formatErrorMessage(error),
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

export const safeLocationService = new SafeLocationService()
