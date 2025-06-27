import { logger } from "@/lib/utils/logger"

export interface FallbackLocation {
  lat: number
  lng: number
  address: string
  city: string
  state: string
  country: string
  displayName: string
}

// Major US cities with their coordinates
const CITY_COORDINATES: Record<string, FallbackLocation> = {
  "new york": {
    lat: 40.7128,
    lng: -74.006,
    address: "New York, NY, USA",
    city: "New York",
    state: "NY",
    country: "US",
    displayName: "New York, NY"
  },
  "los angeles": {
    lat: 34.0522,
    lng: -118.2437,
    address: "Los Angeles, CA, USA",
    city: "Los Angeles",
    state: "CA",
    country: "US",
    displayName: "Los Angeles, CA"
  },
  "chicago": {
    lat: 41.8781,
    lng: -87.6298,
    address: "Chicago, IL, USA",
    city: "Chicago",
    state: "IL",
    country: "US",
    displayName: "Chicago, IL"
  },
  "houston": {
    lat: 29.7604,
    lng: -95.3698,
    address: "Houston, TX, USA",
    city: "Houston",
    state: "TX",
    country: "US",
    displayName: "Houston, TX"
  },
  "phoenix": {
    lat: 33.4484,
    lng: -112.074,
    address: "Phoenix, AZ, USA",
    city: "Phoenix",
    state: "AZ",
    country: "US",
    displayName: "Phoenix, AZ"
  },
  "philadelphia": {
    lat: 39.9526,
    lng: -75.1652,
    address: "Philadelphia, PA, USA",
    city: "Philadelphia",
    state: "PA",
    country: "US",
    displayName: "Philadelphia, PA"
  },
  "san antonio": {
    lat: 29.4241,
    lng: -98.4936,
    address: "San Antonio, TX, USA",
    city: "San Antonio",
    state: "TX",
    country: "US",
    displayName: "San Antonio, TX"
  },
  "san diego": {
    lat: 32.7157,
    lng: -117.1611,
    address: "San Diego, CA, USA",
    city: "San Diego",
    state: "CA",
    country: "US",
    displayName: "San Diego, CA"
  },
  "dallas": {
    lat: 32.7767,
    lng: -96.797,
    address: "Dallas, TX, USA",
    city: "Dallas",
    state: "TX",
    country: "US",
    displayName: "Dallas, TX"
  },
  "san jose": {
    lat: 37.3382,
    lng: -121.8863,
    address: "San Jose, CA, USA",
    city: "San Jose",
    state: "CA",
    country: "US",
    displayName: "San Jose, CA"
  },
  "austin": {
    lat: 30.2672,
    lng: -97.7431,
    address: "Austin, TX, USA",
    city: "Austin",
    state: "TX",
    country: "US",
    displayName: "Austin, TX"
  },
  "jacksonville": {
    lat: 30.3322,
    lng: -81.6557,
    address: "Jacksonville, FL, USA",
    city: "Jacksonville",
    state: "FL",
    country: "US",
    displayName: "Jacksonville, FL"
  },
  "san francisco": {
    lat: 37.7749,
    lng: -122.4194,
    address: "San Francisco, CA, USA",
    city: "San Francisco",
    state: "CA",
    country: "US",
    displayName: "San Francisco, CA"
  },
  "columbus": {
    lat: 39.9612,
    lng: -82.9988,
    address: "Columbus, OH, USA",
    city: "Columbus",
    state: "OH",
    country: "US",
    displayName: "Columbus, OH"
  },
  "charlotte": {
    lat: 35.2271,
    lng: -80.8431,
    address: "Charlotte, NC, USA",
    city: "Charlotte",
    state: "NC",
    country: "US",
    displayName: "Charlotte, NC"
  },
  "fort worth": {
    lat: 32.7555,
    lng: -97.3308,
    address: "Fort Worth, TX, USA",
    city: "Fort Worth",
    state: "TX",
    country: "US",
    displayName: "Fort Worth, TX"
  },
  "indianapolis": {
    lat: 39.7684,
    lng: -86.1581,
    address: "Indianapolis, IN, USA",
    city: "Indianapolis",
    state: "IN",
    country: "US",
    displayName: "Indianapolis, IN"
  },
  "seattle": {
    lat: 47.6062,
    lng: -122.3321,
    address: "Seattle, WA, USA",
    city: "Seattle",
    state: "WA",
    country: "US",
    displayName: "Seattle, WA"
  },
  "denver": {
    lat: 39.7392,
    lng: -104.9903,
    address: "Denver, CO, USA",
    city: "Denver",
    state: "CO",
    country: "US",
    displayName: "Denver, CO"
  },
  "washington": {
    lat: 38.9072,
    lng: -77.0369,
    address: "Washington, DC, USA",
    city: "Washington",
    state: "DC",
    country: "US",
    displayName: "Washington, DC"
  },
  "boston": {
    lat: 42.3601,
    lng: -71.0589,
    address: "Boston, MA, USA",
    city: "Boston",
    state: "MA",
    country: "US",
    displayName: "Boston, MA"
  },
  "miami": {
    lat: 25.7617,
    lng: -80.1918,
    address: "Miami, FL, USA",
    city: "Miami",
    state: "FL",
    country: "US",
    displayName: "Miami, FL"
  },
  "atlanta": {
    lat: 33.749,
    lng: -84.388,
    address: "Atlanta, GA, USA",
    city: "Atlanta",
    state: "GA",
    country: "US",
    displayName: "Atlanta, GA"
  },
  "las vegas": {
    lat: 36.1699,
    lng: -115.1398,
    address: "Las Vegas, NV, USA",
    city: "Las Vegas",
    state: "NV",
    country: "US",
    displayName: "Las Vegas, NV"
  },
  "portland": {
    lat: 45.5152,
    lng: -122.6784,
    address: "Portland, OR, USA",
    city: "Portland",
    state: "OR",
    country: "US",
    displayName: "Portland, OR"
  }
}

class FallbackLocationService {
  /**
   * Get coordinates for a city name
   */
  async geocodeCity(query: string): Promise<FallbackLocation | null> {
    try {
      if (!query || query.trim() === "") {
        logger.warn("Empty query provided to geocodeCity")
        return null
      }

      const normalizedQuery = query.toLowerCase().trim()
      
      // Check for exact match
      if (CITY_COORDINATES[normalizedQuery]) {
        logger.info("Found exact match for city", {
          component: "FallbackLocationService",
          action: "geocodeCity",
          metadata: { query, found: true }
        })
        return CITY_COORDINATES[normalizedQuery]
      }

      // Check for partial match
      for (const [cityKey, location] of Object.entries(CITY_COORDINATES)) {
        if (normalizedQuery.includes(cityKey) || cityKey.includes(normalizedQuery)) {
          logger.info("Found partial match for city", {
            component: "FallbackLocationService",
            action: "geocodeCity",
            metadata: { query, matched: cityKey }
          })
          return location
        }
      }

      // Check state abbreviations
      const stateMatch = normalizedQuery.match(/,\s*([a-z]{2})$/i)
      if (stateMatch) {
        const state = stateMatch[1].toUpperCase()
        const cityPart = normalizedQuery.substring(0, stateMatch.index).trim()
        
        for (const [cityKey, location] of Object.entries(CITY_COORDINATES)) {
          if (location.state === state && cityKey.includes(cityPart.toLowerCase())) {
            logger.info("Found match by state", {
              component: "FallbackLocationService",
              action: "geocodeCity",
              metadata: { query, matched: cityKey, state }
            })
            return location
          }
        }
      }

      logger.warn("No match found for city", {
        component: "FallbackLocationService",
        action: "geocodeCity",
        metadata: { query }
      })
      
      // Default to New York if no match
      return CITY_COORDINATES["new york"]
    } catch (error) {
      logger.error("Error in geocodeCity", {
        component: "FallbackLocationService",
        action: "geocodeCity",
        error: error instanceof Error ? error.message : String(error)
      })
      return CITY_COORDINATES["new york"]
    }
  }

  /**
   * Get city name from coordinates
   */
  async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      let closestCity = "Unknown Location"
      let closestDistance = Infinity

      for (const [cityKey, location] of Object.entries(CITY_COORDINATES)) {
        const distance = this.calculateDistance(lat, lng, location.lat, location.lng)
        if (distance < closestDistance) {
          closestDistance = distance
          closestCity = location.displayName
        }
      }

      logger.info("Reverse geocoded coordinates", {
        component: "FallbackLocationService",
        action: "reverseGeocode",
        metadata: { lat, lng, result: closestCity, distance: closestDistance }
      })

      return closestCity
    } catch (error) {
      logger.error("Error in reverseGeocode", {
        component: "FallbackLocationService",
        action: "reverseGeocode",
        error: error instanceof Error ? error.message : String(error)
      })
      return "Unknown Location"
    }
  }

  /**
   * Get current location using browser geolocation
   */
  async getCurrentLocation(): Promise<FallbackLocation> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser"))
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          const cityName = await this.reverseGeocode(latitude, longitude)
          
          resolve({
            lat: latitude,
            lng: longitude,
            address: cityName,
            city: cityName.split(",")[0].trim(),
            state: "",
            country: "US",
            displayName: cityName
          })
        },
        (error) => {
          logger.error("Geolocation error", {
            component: "FallbackLocationService",
            action: "getCurrentLocation",
            error: error.message
          })
          // Default to New York on error
          resolve(CITY_COORDINATES["new york"])
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      )
    })
  }

  /**
   * Get list of available cities
   */
  getAvailableCities(): Array<{ name: string; displayName: string; coordinates: { lat: number; lng: number } }> {
    return Object.entries(CITY_COORDINATES).map(([key, location]) => ({
      name: key,
      displayName: location.displayName,
      coordinates: { lat: location.lat, lng: location.lng }
    }))
  }

  /**
   * Calculate distance between two coordinates in miles
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3958.8 // Earth's radius in miles
    const dLat = this.toRad(lat2 - lat1)
    const dLng = this.toRad(lng2 - lng1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180
  }
}

export const fallbackLocationService = new FallbackLocationService()