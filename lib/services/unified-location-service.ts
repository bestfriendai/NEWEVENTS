import { geocodeAddress, reverseGeocode } from "@/lib/api/map-api"
import { fallbackLocationService, type FallbackLocation } from "./fallback-location-service"
import { logger } from "@/lib/utils/logger"
import { API_CONFIG } from "@/lib/env"

export interface UnifiedLocation {
  lat: number
  lng: number
  address: string
  city: string
  state: string
  country: string
  displayName: string
  source?: "mapbox" | "tomtom" | "fallback" | "browser"
}

class UnifiedLocationService {
  private hasMapboxKey(): boolean {
    const key = API_CONFIG.maps.mapbox.clientApiKey
    return !!(key && key.length > 10 && !key.includes('your-'))
  }

  private hasTomTomKey(): boolean {
    const key = API_CONFIG.tomtom.apiKey
    return !!(key && key.length > 10 && !key.includes('your-'))
  }

  /**
   * Geocode an address using available services
   */
  async geocodeAddress(address: string): Promise<UnifiedLocation | null> {
    try {
      // Try Mapbox/TomTom first if keys are available
      if (this.hasMapboxKey() || this.hasTomTomKey()) {
        const result = await geocodeAddress(address)
        if (result) {
          logger.info("Successfully geocoded address using API", {
            component: "UnifiedLocationService",
            action: "geocodeAddress",
            metadata: { address, source: "api" }
          })
          
          return {
            lat: result.lat,
            lng: result.lng,
            address: result.address,
            city: result.city || result.name,
            state: "", // Would need to parse from address
            country: result.country || "US",
            displayName: result.address,
            source: this.hasMapboxKey() ? "mapbox" : "tomtom"
          }
        }
      }

      // Fallback to local geocoding
      logger.info("Using fallback geocoding", {
        component: "UnifiedLocationService",
        action: "geocodeAddress",
        metadata: { address, reason: "No API keys or API failed" }
      })
      
      const fallbackResult = await fallbackLocationService.geocodeCity(address)
      if (fallbackResult) {
        return {
          ...fallbackResult,
          source: "fallback"
        }
      }

      return null
    } catch (error) {
      logger.error("Error geocoding address", {
        component: "UnifiedLocationService",
        action: "geocodeAddress",
        error: error instanceof Error ? error.message : String(error),
        metadata: { address }
      })
      
      // Try fallback as last resort
      const fallbackResult = await fallbackLocationService.geocodeCity(address)
      return fallbackResult ? { ...fallbackResult, source: "fallback" } : null
    }
  }

  /**
   * Reverse geocode coordinates
   */
  async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      // Try API-based reverse geocoding first
      if (this.hasMapboxKey() || this.hasTomTomKey()) {
        const result = await reverseGeocode(lat, lng)
        if (result && result !== "Unknown location") {
          return result
        }
      }

      // Fallback to local reverse geocoding
      return await fallbackLocationService.reverseGeocode(lat, lng)
    } catch (error) {
      logger.error("Error reverse geocoding", {
        component: "UnifiedLocationService",
        action: "reverseGeocode",
        error: error instanceof Error ? error.message : String(error),
        metadata: { lat, lng }
      })
      
      return await fallbackLocationService.reverseGeocode(lat, lng)
    }
  }

  /**
   * Get current location from browser
   */
  async getCurrentLocation(): Promise<UnifiedLocation> {
    try {
      // Get coordinates from browser
      const fallbackLocation = await fallbackLocationService.getCurrentLocation()
      
      // Try to get more accurate address if API keys are available
      if (this.hasMapboxKey() || this.hasTomTomKey()) {
        const address = await this.reverseGeocode(fallbackLocation.lat, fallbackLocation.lng)
        if (address && address !== "Unknown location") {
          return {
            ...fallbackLocation,
            address,
            displayName: address,
            source: "browser"
          }
        }
      }

      return {
        ...fallbackLocation,
        source: "browser"
      }
    } catch (error) {
      logger.error("Error getting current location", {
        component: "UnifiedLocationService",
        action: "getCurrentLocation",
        error: error instanceof Error ? error.message : String(error)
      })
      
      // Default to New York
      const nyLocation = await fallbackLocationService.geocodeCity("New York")
      return {
        ...nyLocation!,
        source: "fallback"
      }
    }
  }

  /**
   * Search for a location by query
   */
  async searchLocation(query: string): Promise<UnifiedLocation | null> {
    // Same as geocodeAddress but with better error messages
    return this.geocodeAddress(query)
  }

  /**
   * Get popular locations for quick selection
   */
  getPopularLocations(): Array<{ name: string; displayName: string; coordinates: { lat: number; lng: number } }> {
    return fallbackLocationService.getAvailableCities()
  }

  /**
   * Check which location services are available
   */
  getAvailableServices(): { mapbox: boolean; tomtom: boolean; fallback: boolean } {
    return {
      mapbox: this.hasMapboxKey(),
      tomtom: this.hasTomTomKey(),
      fallback: true // Always available
    }
  }
}

export const unifiedLocationService = new UnifiedLocationService()