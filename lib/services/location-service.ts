import { geocodeAddress, reverseGeocode } from "@/lib/api/map-api"
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

class LocationService {
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
        maximumAge: 300000, // 5 minutes
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords

            logger.info("Current location obtained", {
              component: "LocationService",
              action: "getCurrentLocation",
              metadata: { lat: latitude, lng: longitude, accuracy: position.coords.accuracy },
            })

            // Get address from coordinates
            const address = await reverseGeocode(latitude, longitude)

            const location: UserLocation = {
              lat: latitude,
              lng: longitude,
              address: address,
              city: this.extractCityFromAddress(address),
              state: this.extractStateFromAddress(address),
              country: "US",
              displayName: address,
            }

            resolve(location)
          } catch (error) {
            logger.error("Error processing current location", {
              component: "LocationService",
              action: "getCurrentLocation",
              error: error instanceof Error ? error.message : String(error),
            })

            reject({
              code: "LOCATION_PROCESSING_ERROR",
              message: "Failed to process location data",
            })
          }
        },
        (error) => {
          logger.error("Geolocation error", {
            component: "LocationService",
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
        component: "LocationService",
        action: "searchLocation",
        metadata: { query },
      })

      const result = await geocodeAddress(query)

      if (!result) {
        throw new Error("Location not found")
      }

      const location: UserLocation = {
        lat: result.lat,
        lng: result.lng,
        address: result.address,
        city: this.extractCityFromAddress(result.address),
        state: this.extractStateFromAddress(result.address),
        country: "US",
        displayName: result.name || result.address,
      }

      logger.info("Location search successful", {
        component: "LocationService",
        action: "searchLocation",
        metadata: { query, result: location },
      })

      return location
    } catch (error) {
      logger.error("Location search failed", {
        component: "LocationService",
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

  private extractCityFromAddress(address: string): string {
    // Simple extraction - in a real app, you'd use more sophisticated parsing
    const parts = address.split(",")
    if (parts.length >= 2) {
      return parts[0].trim()
    }
    return address
  }

  private extractStateFromAddress(address: string): string {
    // Simple extraction - in a real app, you'd use more sophisticated parsing
    const parts = address.split(",")
    if (parts.length >= 3) {
      const statePart = parts[parts.length - 2].trim()
      return statePart.split(" ")[0] // Get state code
    }
    return ""
  }

  // Popular locations for quick selection
  getPopularLocations(): Array<{ name: string; query: string }> {
    return [
      { name: "New York, NY", query: "New York, NY" },
      { name: "Los Angeles, CA", query: "Los Angeles, CA" },
      { name: "Chicago, IL", query: "Chicago, IL" },
      { name: "Houston, TX", query: "Houston, TX" },
      { name: "Phoenix, AZ", query: "Phoenix, AZ" },
      { name: "Philadelphia, PA", query: "Philadelphia, PA" },
      { name: "San Antonio, TX", query: "San Antonio, TX" },
      { name: "San Diego, CA", query: "San Diego, CA" },
      { name: "Dallas, TX", query: "Dallas, TX" },
      { name: "San Jose, CA", query: "San Jose, CA" },
      { name: "Austin, TX", query: "Austin, TX" },
      { name: "Jacksonville, FL", query: "Jacksonville, FL" },
      { name: "San Francisco, CA", query: "San Francisco, CA" },
      { name: "Columbus, OH", query: "Columbus, OH" },
      { name: "Charlotte, NC", query: "Charlotte, NC" },
      { name: "Fort Worth, TX", query: "Fort Worth, TX" },
      { name: "Indianapolis, IN", query: "Indianapolis, IN" },
      { name: "Seattle, WA", query: "Seattle, WA" },
      { name: "Denver, CO", query: "Denver, CO" },
      { name: "Washington, DC", query: "Washington, DC" },
    ]
  }
}

export const locationService = new LocationService()
