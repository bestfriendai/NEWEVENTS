/**
 * Consolidated geocoding utilities with multiple provider support
 */

import { logger } from '@/lib/utils/logger'
import { withRetry, formatErrorMessage } from '@/lib/utils'
import { getProviderConfig, checkRateLimit } from '@/lib/utils/api-config'

export interface LocationData {
  lat: number
  lng: number
  name: string
  address: string
  confidence?: number
  provider?: string
}

export interface GeocodingProvider {
  name: string
  geocode: (address: string) => Promise<LocationData | null>
  reverseGeocode: (lat: number, lng: number) => Promise<string | null>
  isAvailable: () => boolean
}

/**
 * Mapbox geocoding provider
 */
class MapboxProvider implements GeocodingProvider {
  name = 'Mapbox'

  isAvailable(): boolean {
    const config = getProviderConfig('maps')
    return Boolean(config?.apiKey)
  }

  async geocode(address: string): Promise<LocationData | null> {
    const config = getProviderConfig('maps')
    if (!config?.apiKey) {
      logger.warn('Mapbox API key not available')
      return null
    }

    const rateLimit = checkRateLimit('mapbox')
    if (!rateLimit.allowed) {
      logger.warn('Mapbox rate limit exceeded', {
        component: 'geocoding',
        action: 'rate_limit_exceeded',
        metadata: { provider: 'mapbox', resetTime: rateLimit.resetTime }
      })
      return null
    }

    try {
      const encodedAddress = encodeURIComponent(address.trim())
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${config.apiKey}`

      const response = await withRetry(
        () => fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }),
        { maxAttempts: 2, baseDelay: 1000 }
      )

      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.features || data.features.length === 0) {
        logger.warn('No geocoding results found', {
          component: 'geocoding',
          action: 'no_results',
          metadata: { address, provider: 'mapbox' }
        })
        return null
      }

      const feature = data.features[0]
      const [lng, lat] = feature.center

      return {
        lat,
        lng,
        name: feature.text || address,
        address: feature.place_name || address,
        confidence: feature.relevance || 0.8,
        provider: 'mapbox'
      }
    } catch (error) {
      logger.error('Mapbox geocoding failed', {
        component: 'geocoding',
        action: 'geocode_error',
        metadata: { address, provider: 'mapbox' }
      }, error instanceof Error ? error : new Error(formatErrorMessage(error)))
      return null
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    const config = getProviderConfig('maps')
    if (!config?.apiKey) return null

    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${config.apiKey}`

      const response = await withRetry(
        () => fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }),
        { maxAttempts: 2, baseDelay: 1000 }
      )

      if (!response.ok) {
        throw new Error(`Mapbox reverse geocoding error: ${response.status}`)
      }

      const data = await response.json()

      if (data.features && data.features.length > 0) {
        return data.features[0].place_name
      }

      return null
    } catch (error) {
      logger.error('Mapbox reverse geocoding failed', {
        component: 'geocoding',
        action: 'reverse_geocode_error',
        metadata: { lat, lng, provider: 'mapbox' }
      }, error instanceof Error ? error : new Error(formatErrorMessage(error)))
      return null
    }
  }
}

/**
 * TomTom geocoding provider
 */
class TomTomProvider implements GeocodingProvider {
  name = 'TomTom'

  isAvailable(): boolean {
    const config = getProviderConfig('maps')
    return Boolean(config?.name === 'TomTom' && config?.apiKey)
  }

  async geocode(address: string): Promise<LocationData | null> {
    const config = getProviderConfig('maps')
    if (!config?.apiKey || config.name !== 'TomTom') return null

    try {
      const queryParams = new URLSearchParams()
      queryParams.append('key', config.apiKey)
      queryParams.append('query', address)
      queryParams.append('limit', '1')

      const response = await withRetry(
        () => fetch(
          `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(address)}.json?${queryParams.toString()}`
        ),
        { maxAttempts: 2, baseDelay: 1000 }
      )

      if (!response.ok) {
        throw new Error(`TomTom API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.results && data.results.length > 0) {
        const result = data.results[0]
        return {
          lat: result.position.lat,
          lng: result.position.lon,
          name: result.address.freeformAddress || address,
          address: result.address.freeformAddress || address,
          confidence: result.score || 0.8,
          provider: 'tomtom'
        }
      }

      return null
    } catch (error) {
      logger.error('TomTom geocoding failed', {
        component: 'geocoding',
        action: 'geocode_error',
        metadata: { address, provider: 'tomtom' }
      }, error instanceof Error ? error : new Error(formatErrorMessage(error)))
      return null
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    const config = getProviderConfig('maps')
    if (!config?.apiKey || config.name !== 'TomTom') return null

    try {
      const queryParams = new URLSearchParams()
      queryParams.append('key', config.apiKey)

      const response = await withRetry(
        () => fetch(
          `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lng}.json?${queryParams.toString()}`
        ),
        { maxAttempts: 2, baseDelay: 1000 }
      )

      if (!response.ok) {
        throw new Error(`TomTom reverse geocoding error: ${response.status}`)
      }

      const data = await response.json()

      if (data.addresses && data.addresses.length > 0) {
        return data.addresses[0].address.freeformAddress
      }

      return null
    } catch (error) {
      logger.error('TomTom reverse geocoding failed', {
        component: 'geocoding',
        action: 'reverse_geocode_error',
        metadata: { lat, lng, provider: 'tomtom' }
      }, error instanceof Error ? error : new Error(formatErrorMessage(error)))
      return null
    }
  }
}

/**
 * Fallback geocoding using a simple coordinate lookup
 */
class FallbackProvider implements GeocodingProvider {
  name = 'Fallback'

  isAvailable(): boolean {
    return true
  }

  async geocode(address: string): Promise<LocationData | null> {
    // Simple fallback for common cities
    const cityCoordinates: Record<string, { lat: number; lng: number }> = {
      'new york': { lat: 40.7128, lng: -74.0060 },
      'los angeles': { lat: 34.0522, lng: -118.2437 },
      'chicago': { lat: 41.8781, lng: -87.6298 },
      'houston': { lat: 29.7604, lng: -95.3698 },
      'phoenix': { lat: 33.4484, lng: -112.0740 },
      'philadelphia': { lat: 39.9526, lng: -75.1652 },
      'san antonio': { lat: 29.4241, lng: -98.4936 },
      'san diego': { lat: 32.7157, lng: -117.1611 },
      'dallas': { lat: 32.7767, lng: -96.7970 },
      'san jose': { lat: 37.3382, lng: -121.8863 },
    }

    const normalizedAddress = address.toLowerCase().trim()
    const coords = cityCoordinates[normalizedAddress]

    if (coords) {
      return {
        ...coords,
        name: address,
        address: address,
        confidence: 0.5,
        provider: 'fallback'
      }
    }

    return null
  }

  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }
}

/**
 * Geocoding manager that tries multiple providers
 */
class GeocodingManager {
  private providers: GeocodingProvider[]

  constructor() {
    this.providers = [
      new MapboxProvider(),
      new TomTomProvider(),
      new FallbackProvider()
    ]
  }

  async geocode(address: string): Promise<LocationData | null> {
    if (!address || address.trim() === '') {
      logger.warn('Empty address provided for geocoding')
      return null
    }

    logger.info('Starting geocoding', {
      component: 'geocoding',
      action: 'geocode_start',
      metadata: { address }
    })

    for (const provider of this.providers) {
      if (!provider.isAvailable()) continue

      try {
        const result = await provider.geocode(address)
        if (result) {
          logger.info('Geocoding successful', {
            component: 'geocoding',
            action: 'geocode_success',
            metadata: { address, provider: provider.name, confidence: result.confidence }
          })
          return result
        }
      } catch (error) {
        logger.warn(`Geocoding failed with ${provider.name}`, {
          component: 'geocoding',
          action: 'provider_failed',
          metadata: { address, provider: provider.name }
        }, error instanceof Error ? error : new Error(formatErrorMessage(error)))
      }
    }

    logger.error('All geocoding providers failed', {
      component: 'geocoding',
      action: 'all_providers_failed',
      metadata: { address }
    })
    return null
  }

  async reverseGeocode(lat: number, lng: number): Promise<string> {
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
      logger.warn('Invalid coordinates for reverse geocoding', {
        component: 'geocoding',
        action: 'invalid_coordinates',
        metadata: { lat, lng }
      })
      return 'Unknown location'
    }

    for (const provider of this.providers) {
      if (!provider.isAvailable()) continue

      try {
        const result = await provider.reverseGeocode(lat, lng)
        if (result) {
          logger.info('Reverse geocoding successful', {
            component: 'geocoding',
            action: 'reverse_geocode_success',
            metadata: { lat, lng, provider: provider.name }
          })
          return result
        }
      } catch (error) {
        logger.warn(`Reverse geocoding failed with ${provider.name}`, {
          component: 'geocoding',
          action: 'reverse_provider_failed',
          metadata: { lat, lng, provider: provider.name }
        }, error instanceof Error ? error : new Error(formatErrorMessage(error)))
      }
    }

    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }

  /**
   * Calculate distance between two coordinates in kilometers
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1)
    const dLon = this.deg2rad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const d = R * c // Distance in km
    return d
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180)
  }
}

// Create singleton instance
export const geocodingManager = new GeocodingManager()

// Convenience functions
export const geocodeAddress = (address: string) => geocodingManager.geocode(address)
export const reverseGeocode = (lat: number, lng: number) => geocodingManager.reverseGeocode(lat, lng)
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => 
  geocodingManager.calculateDistance(lat1, lon1, lat2, lon2)
