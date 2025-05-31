import { logger } from "@/lib/utils/logger"
import { serverEnv } from "@/lib/env"

interface Coordinates {
  lat: number
  lng: number
}

interface GeocodingResult {
  coordinates: Coordinates | null
  address: string
  success: boolean
  error?: string
}

class GeocodingService {
  private cache = new Map<string, GeocodingResult>()
  private readonly cacheExpiry = 24 * 60 * 60 * 1000 // 24 hours

  /**
   * Geocode an address to get coordinates
   */
  async geocodeAddress(address: string, venueName?: string): Promise<GeocodingResult> {
    if (!address || address === "Address TBA" || address === "Venue TBA") {
      return {
        coordinates: null,
        address: address || "Address TBA",
        success: false,
        error: "No valid address provided",
      }
    }

    // Create cache key
    const cacheKey = `${address}_${venueName || ""}`.toLowerCase()

    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached) {
      logger.debug("Geocoding cache hit", {
        component: "geocoding-service",
        address,
        venueName,
      })
      return cached
    }

    try {
      // Try multiple geocoding strategies
      let result = await this.tryMapboxGeocoding(address, venueName)
      
      if (!result.success && serverEnv.TOMTOM_API_KEY) {
        result = await this.tryTomTomGeocoding(address, venueName)
      }

      if (!result.success) {
        result = await this.tryOpenStreetMapGeocoding(address, venueName)
      }

      // Cache the result
      this.cache.set(cacheKey, result)

      logger.debug("Geocoding completed", {
        component: "geocoding-service",
        address,
        venueName,
        success: result.success,
        coordinates: result.coordinates,
      })

      return result
    } catch (error) {
      const errorResult: GeocodingResult = {
        coordinates: null,
        address,
        success: false,
        error: error instanceof Error ? error.message : "Unknown geocoding error",
      }

      // Cache failed results for a shorter time
      this.cache.set(cacheKey, errorResult)

      logger.warn("Geocoding failed", {
        component: "geocoding-service",
        address,
        venueName,
        error: errorResult.error,
      })

      return errorResult
    }
  }

  /**
   * Try Mapbox geocoding
   */
  private async tryMapboxGeocoding(address: string, venueName?: string): Promise<GeocodingResult> {
    try {
      const mapboxToken = serverEnv.MAPBOX_API_KEY || process.env.NEXT_PUBLIC_MAPBOX_API_KEY
      
      if (!mapboxToken) {
        return {
          coordinates: null,
          address,
          success: false,
          error: "Mapbox API key not configured",
        }
      }

      // Combine venue name and address for better results
      const searchQuery = venueName ? `${venueName}, ${address}` : address
      const encodedQuery = encodeURIComponent(searchQuery)

      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${mapboxToken}&limit=1&types=poi,address`

      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.features && data.features.length > 0) {
        const feature = data.features[0]
        const [lng, lat] = feature.center

        return {
          coordinates: { lat, lng },
          address: feature.place_name || address,
          success: true,
        }
      }

      return {
        coordinates: null,
        address,
        success: false,
        error: "No results found",
      }
    } catch (error) {
      return {
        coordinates: null,
        address,
        success: false,
        error: error instanceof Error ? error.message : "Mapbox geocoding failed",
      }
    }
  }

  /**
   * Try TomTom geocoding
   */
  private async tryTomTomGeocoding(address: string, venueName?: string): Promise<GeocodingResult> {
    try {
      if (!serverEnv.TOMTOM_API_KEY) {
        return {
          coordinates: null,
          address,
          success: false,
          error: "TomTom API key not configured",
        }
      }

      const searchQuery = venueName ? `${venueName}, ${address}` : address
      const encodedQuery = encodeURIComponent(searchQuery)

      const url = `https://api.tomtom.com/search/2/geocode/${encodedQuery}.json?key=${serverEnv.TOMTOM_API_KEY}&limit=1`

      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`TomTom API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.results && data.results.length > 0) {
        const result = data.results[0]
        const { lat, lon } = result.position

        return {
          coordinates: { lat, lng: lon },
          address: result.address?.freeformAddress || address,
          success: true,
        }
      }

      return {
        coordinates: null,
        address,
        success: false,
        error: "No results found",
      }
    } catch (error) {
      return {
        coordinates: null,
        address,
        success: false,
        error: error instanceof Error ? error.message : "TomTom geocoding failed",
      }
    }
  }

  /**
   * Try OpenStreetMap geocoding (free fallback)
   */
  private async tryOpenStreetMapGeocoding(address: string, venueName?: string): Promise<GeocodingResult> {
    try {
      const searchQuery = venueName ? `${venueName}, ${address}` : address
      const encodedQuery = encodeURIComponent(searchQuery)

      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=1&addressdetails=1`

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'EventsApp/1.0 (contact@example.com)', // Required by Nominatim
        },
      })
      
      if (!response.ok) {
        throw new Error(`OpenStreetMap API error: ${response.status}`)
      }

      const data = await response.json()

      if (data && data.length > 0) {
        const result = data[0]
        const lat = parseFloat(result.lat)
        const lng = parseFloat(result.lon)

        if (!isNaN(lat) && !isNaN(lng)) {
          return {
            coordinates: { lat, lng },
            address: result.display_name || address,
            success: true,
          }
        }
      }

      return {
        coordinates: null,
        address,
        success: false,
        error: "No results found",
      }
    } catch (error) {
      return {
        coordinates: null,
        address,
        success: false,
        error: error instanceof Error ? error.message : "OpenStreetMap geocoding failed",
      }
    }
  }

  /**
   * Clear expired cache entries
   */
  private clearExpiredCache(): void {
    // This is a simplified implementation
    // In a real app, you'd want to track timestamps
    if (this.cache.size > 1000) {
      this.cache.clear()
    }
  }

  /**
   * Validate coordinates
   */
  private isValidCoordinates(coordinates: Coordinates): boolean {
    return (
      typeof coordinates.lat === "number" &&
      typeof coordinates.lng === "number" &&
      coordinates.lat >= -90 &&
      coordinates.lat <= 90 &&
      coordinates.lng >= -180 &&
      coordinates.lng <= 180 &&
      !isNaN(coordinates.lat) &&
      !isNaN(coordinates.lng)
    )
  }
}

// Export singleton instance
export const geocodingService = new GeocodingService()
export default geocodingService
