import { API_CONFIG } from "@/lib/env"

// Interface for location data
export interface LocationData {
  lat: number
  lng: number
  name: string
  address: string
  city?: string
  state?: string
  country?: string
}

// Function to geocode an address using Mapbox (primary) or TomTom (fallback)
export async function geocodeAddress(address: string): Promise<LocationData | null> {
  try {
    if (!address || address.trim() === "") {
      console.error("Address is required for geocoding")
      return null
    }

    // Try Mapbox first
    if (API_CONFIG.maps.mapbox.clientApiKey && API_CONFIG.maps.mapbox.clientApiKey.length > 10 && !API_CONFIG.maps.mapbox.clientApiKey.includes('your-')) {
      try {
        const encodedAddress = encodeURIComponent(address.trim())
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${API_CONFIG.maps.mapbox.clientApiKey}`

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()

          if (data.features && data.features.length > 0) {
            const feature = data.features[0]
            const [lng, lat] = feature.center

            return {
              lat,
              lng,
              name: feature.text || address,
              address: feature.place_name || address,
            }
          }
        }
      } catch (error) {
        console.warn("Mapbox geocoding failed, trying TomTom:", error)
      }
    }

    // Fallback to TomTom
    if (API_CONFIG.tomtom.apiKey && API_CONFIG.tomtom.apiKey.length > 10 && !API_CONFIG.tomtom.apiKey.includes('your-')) {
      try {
        const encodedAddress = encodeURIComponent(address.trim())
        const url = `https://api.tomtom.com/search/2/geocode/${encodedAddress}.json?key=${API_CONFIG.tomtom.apiKey}`

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()

          if (data.results && data.results.length > 0) {
            const result = data.results[0]
            const { lat, lon: lng } = result.position

            return {
              lat,
              lng,
              name: result.poi?.name || result.address?.freeformAddress || address,
              address: result.address?.freeformAddress || address,
            }
          }
        }
      } catch (error) {
        console.warn("TomTom geocoding failed:", error)
      }
    }

    // Final fallback to static coordinates
    return await fallbackGeocode(address)
  } catch (error) {
    console.error("Error geocoding address:", error)
    return await fallbackGeocode(address)
  }
}

// Function to reverse geocode coordinates using Mapbox (primary) or TomTom (fallback)
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) {
      console.error("Invalid coordinates for reverse geocoding:", { lat, lng })
      return "Unknown location"
    }

    // Try Mapbox first
    if (API_CONFIG.maps.mapbox.clientApiKey) {
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${API_CONFIG.maps.mapbox.clientApiKey}`

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()

          if (data.features && data.features.length > 0) {
            const place = data.features.find(
              (f: any) => f.place_type?.includes("place") || f.place_type?.includes("locality"),
            )
            const neighborhood = data.features.find((f: any) => f.place_type?.includes("neighborhood"))
            const region = data.features.find((f: any) => f.place_type?.includes("region"))

            if (place) {
              return place.text
            } else if (neighborhood) {
              return neighborhood.text
            } else if (region) {
              return region.text
            } else if (data.features[0]) {
              return data.features[0].place_name || data.features[0].text || "Unknown location"
            }
          }
        }
      } catch (error) {
        console.warn("Mapbox reverse geocoding failed, trying TomTom:", error)
      }
    }

    // Fallback to TomTom
    if (API_CONFIG.tomtom.apiKey && API_CONFIG.tomtom.apiKey.length > 10 && !API_CONFIG.tomtom.apiKey.includes('your-')) {
      try {
        const url = `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lng}.json?key=${API_CONFIG.tomtom.apiKey}`

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()

          if (data.addresses && data.addresses.length > 0) {
            const address = data.addresses[0]
            return (
              address.address?.municipality ||
              address.address?.countrySubdivision ||
              address.address?.country ||
              "Unknown location"
            )
          }
        }
      } catch (error) {
        console.warn("TomTom reverse geocoding failed:", error)
      }
    }

    return fallbackReverseGeocode(lat, lng)
  } catch (error) {
    console.error("Error reverse geocoding:", error)
    return fallbackReverseGeocode(lat, lng)
  }
}

// Function to get nearby places using TomTom
export async function getNearbyPlaces(lat: number, lng: number, category: string, limit = 10): Promise<LocationData[]> {
  try {
    if (!API_CONFIG.tomtom.apiKey) {
      console.warn("TomTom API key is not defined, returning empty results")
      return []
    }

    if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) {
      console.error("Invalid coordinates for nearby places:", { lat, lng })
      return []
    }

    const encodedCategory = encodeURIComponent(category)
    const url = `https://api.tomtom.com/search/2/poiSearch/${encodedCategory}.json?key=${API_CONFIG.tomtom.apiKey}&lat=${lat}&lon=${lng}&radius=5000&limit=${limit}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.warn(`TomTom nearby places API error: ${response.status} ${response.statusText}`)
      return []
    }

    const data = await response.json()

    if (!data.results || data.results.length === 0) {
      return []
    }

    return data.results.map((result: any) => ({
      lat: result.position.lat,
      lng: result.position.lon,
      name: result.poi?.name || result.address?.freeformAddress || "",
      address: result.address?.freeformAddress || "",
    }))
  } catch (error) {
    console.error("Error getting nearby places:", error)
    return []
  }
}

// Fallback geocoding using a simple coordinate estimation
async function fallbackGeocode(address: string): Promise<LocationData | null> {
  // Simple fallback for major cities
  const cityCoordinates: Record<string, { lat: number; lng: number }> = {
    "new york": { lat: 40.7128, lng: -74.006 },
    "los angeles": { lat: 34.0522, lng: -118.2437 },
    chicago: { lat: 41.8781, lng: -87.6298 },
    houston: { lat: 29.7604, lng: -95.3698 },
    phoenix: { lat: 33.4484, lng: -112.074 },
    philadelphia: { lat: 39.9526, lng: -75.1652 },
    "san antonio": { lat: 29.4241, lng: -98.4936 },
    "san diego": { lat: 32.7157, lng: -117.1611 },
    dallas: { lat: 32.7767, lng: -96.797 },
    "san jose": { lat: 37.3382, lng: -121.8863 },
    austin: { lat: 30.2672, lng: -97.7431 },
    jacksonville: { lat: 30.3322, lng: -81.6557 },
    "san francisco": { lat: 37.7749, lng: -122.4194 },
    columbus: { lat: 39.9612, lng: -82.9988 },
    charlotte: { lat: 35.2271, lng: -80.8431 },
    "fort worth": { lat: 32.7555, lng: -97.3308 },
    indianapolis: { lat: 39.7684, lng: -86.1581 },
    seattle: { lat: 47.6062, lng: -122.3321 },
    denver: { lat: 39.7392, lng: -104.9903 },
    washington: { lat: 38.9072, lng: -77.0369 },
    boston: { lat: 42.3601, lng: -71.0589 },
    "el paso": { lat: 31.7619, lng: -106.485 },
    detroit: { lat: 42.3314, lng: -83.0458 },
    nashville: { lat: 36.1627, lng: -86.7816 },
    memphis: { lat: 35.1495, lng: -90.049 },
    portland: { lat: 45.5152, lng: -122.6784 },
    "oklahoma city": { lat: 35.4676, lng: -97.5164 },
    "las vegas": { lat: 36.1699, lng: -115.1398 },
    louisville: { lat: 38.2527, lng: -85.7585 },
    baltimore: { lat: 39.2904, lng: -76.6122 },
    milwaukee: { lat: 43.0389, lng: -87.9065 },
    albuquerque: { lat: 35.0844, lng: -106.6504 },
    tucson: { lat: 32.2226, lng: -110.9747 },
    fresno: { lat: 36.7378, lng: -119.7871 },
    sacramento: { lat: 38.5816, lng: -121.4944 },
    mesa: { lat: 33.4152, lng: -111.8315 },
    "kansas city": { lat: 39.0997, lng: -94.5786 },
    atlanta: { lat: 33.749, lng: -84.388 },
    "long beach": { lat: 33.7701, lng: -118.1937 },
    "colorado springs": { lat: 38.8339, lng: -104.8214 },
    raleigh: { lat: 35.7796, lng: -78.6382 },
    miami: { lat: 25.7617, lng: -80.1918 },
    "virginia beach": { lat: 36.8529, lng: -75.978 },
    omaha: { lat: 41.2565, lng: -95.9345 },
    oakland: { lat: 37.8044, lng: -122.2711 },
    minneapolis: { lat: 44.9778, lng: -93.265 },
    tulsa: { lat: 36.154, lng: -95.9928 },
    arlington: { lat: 32.7357, lng: -97.1081 },
    "new orleans": { lat: 29.9511, lng: -90.0715 },
  }

  const normalizedAddress = address.toLowerCase().trim()

  // Check for exact city match
  for (const [city, coords] of Object.entries(cityCoordinates)) {
    if (normalizedAddress.includes(city)) {
      return {
        lat: coords.lat,
        lng: coords.lng,
        name: city
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
        address: address,
      }
    }
  }

  // Default to New York if no match found
  console.warn(`No fallback coordinates found for "${address}", defaulting to New York`)
  return {
    lat: 40.7128,
    lng: -74.006,
    name: "New York",
    address: address,
  }
}

// Fallback reverse geocoding using coordinate ranges
function fallbackReverseGeocode(lat: number, lng: number): string {
  // Simple coordinate-based location detection for major US regions
  if (lat >= 40.4 && lat <= 40.9 && lng >= -74.3 && lng <= -73.7) {
    return "New York Area"
  } else if (lat >= 33.7 && lat <= 34.3 && lng >= -118.7 && lng <= -117.9) {
    return "Los Angeles Area"
  } else if (lat >= 41.6 && lat <= 42.1 && lng >= -87.9 && lng <= -87.3) {
    return "Chicago Area"
  } else if (lat >= 37.6 && lat <= 37.9 && lng >= -122.5 && lng <= -122.3) {
    return "San Francisco Area"
  } else if (lat >= 47.4 && lat <= 47.8 && lng >= -122.5 && lng <= -122.1) {
    return "Seattle Area"
  } else if (lat >= 25.6 && lat <= 25.9 && lng >= -80.3 && lng <= -80.1) {
    return "Miami Area"
  } else if (lat >= 29.6 && lat <= 29.9 && lng >= -95.5 && lng <= -95.2) {
    return "Houston Area"
  } else if (lat >= 32.6 && lat <= 32.9 && lng >= -97.0 && lng <= -96.6) {
    return "Dallas Area"
  } else if (lat >= 33.6 && lat <= 33.9 && lng >= -84.5 && lng <= -84.2) {
    return "Atlanta Area"
  } else if (lat >= 39.0 && lat <= 39.4 && lng >= -104.9 && lng <= -104.8) {
    return "Denver Area"
  } else if (lat >= 30.1 && lat <= 30.4 && lng >= -97.9 && lng <= -97.6) {
    return "Austin Area"
  } else if (lat >= 42.2 && lat <= 42.5 && lng >= -71.2 && lng <= -71.0) {
    return "Boston Area"
  } else if (lat >= 38.8 && lat <= 39.0 && lng >= -77.1 && lng <= -76.9) {
    return "Washington DC Area"
  } else if (lat >= 45.4 && lat <= 45.6 && lng >= -122.8 && lng <= -122.5) {
    return "Portland Area"
  } else if (lat >= 36.0 && lat <= 36.3 && lng >= -115.3 && lng <= -115.0) {
    return "Las Vegas Area"
  } else if (lat >= 32.6 && lat <= 32.9 && lng >= -117.3 && lng <= -117.0) {
    return "San Diego Area"
  } else if (lat >= 33.3 && lat <= 33.6 && lng >= -112.2 && lng <= -111.9) {
    return "Phoenix Area"
  } else if (lat >= 39.0 && lat <= 39.3 && lng >= -76.7 && lng <= -76.5) {
    return "Baltimore Area"
  } else if (lat >= 42.9 && lat <= 43.2 && lng >= -87.0 && lng <= -87.8) {
    return "Milwaukee Area"
  } else if (lat >= 44.8 && lat <= 45.1 && lng >= -93.4 && lng <= -93.1) {
    return "Minneapolis Area"
  } else if (lat >= 39.0 && lat <= 39.2 && lng >= -94.7 && lng <= -94.4) {
    return "Kansas City Area"
  } else if (lat >= 35.0 && lat <= 35.3 && lng >= -106.8 && lng <= -106.5) {
    return "Albuquerque Area"
  } else if (lat >= 32.1 && lat <= 32.4 && lng >= -111.1 && lng <= -110.8) {
    return "Tucson Area"
  } else if (lat >= 36.6 && lat <= 36.9 && lng >= -120.0 && lng <= -119.6) {
    return "Fresno Area"
  } else if (lat >= 38.4 && lat <= 38.7 && lng >= -121.6 && lng <= -121.3) {
    return "Sacramento Area"
  } else if (lat >= 35.6 && lat <= 35.9 && lng >= -78.8 && lng <= -78.5) {
    return "Raleigh Area"
  } else if (lat >= 36.7 && lat <= 37.0 && lng >= -76.1 && lng <= -75.8) {
    return "Virginia Beach Area"
  } else if (lat >= 41.1 && lat <= 41.4 && lng >= -96.1 && lng <= -95.8) {
    return "Omaha Area"
  } else if (lat >= 37.6 && lat <= 37.9 && lng >= -122.4 && lng <= -122.1) {
    return "Oakland Area"
  } else if (lat >= 36.0 && lat <= 36.3 && lng >= -96.1 && lng <= -95.8) {
    return "Tulsa Area"
  } else if (lat >= 32.6 && lat <= 32.9 && lng >= -97.2 && lng <= -96.9) {
    return "Arlington Area"
  } else if (lat >= 29.8 && lat <= 30.1 && lng >= -90.2 && lng <= -89.9) {
    return "New Orleans Area"
  }

  // Broader regional detection
  if (lat >= 24 && lat <= 49 && lng >= -125 && lng <= -66) {
    if (lng >= -125 && lng <= -104) {
      return "Western US"
    } else if (lng >= -104 && lng <= -90) {
      return "Central US"
    } else {
      return "Eastern US"
    }
  }

  return `Location (${lat.toFixed(2)}, ${lng.toFixed(2)})`
}

// Function to calculate distance between two coordinates in miles
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  try {
    if (typeof lat1 !== "number" || typeof lng1 !== "number" || typeof lat2 !== "number" || typeof lng2 !== "number") {
      console.error("Invalid coordinates for distance calculation")
      return 0
    }

    if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
      console.error("NaN coordinates for distance calculation")
      return 0
    }

    const R = 3958.8 // Earth's radius in miles
    const dLat = toRad(lat2 - lat1)
    const dLng = toRad(lng2 - lng1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c
    return Math.round(distance * 10) / 10 // Round to 1 decimal place
  } catch (error) {
    console.error("Error calculating distance:", error)
    return 0
  }
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180
}

// Alias for geocodeAddress to match usage in components
export const geocodeLocation = geocodeAddress

// Function to reverse geocode coordinates and return detailed location data
export async function reverseGeocodeCoordinates(lat: number, lng: number): Promise<LocationData | null> {
  try {
    if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) {
      console.error("Invalid coordinates for reverse geocoding:", { lat, lng })
      return null
    }

    // Try Mapbox first
    if (API_CONFIG.maps.mapbox.clientApiKey) {
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${API_CONFIG.maps.mapbox.clientApiKey}`

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()

          if (data.features && data.features.length > 0) {
            // Extract city, state, country from features
            let city = ""
            let state = ""
            let country = ""
            let address = ""

            for (const feature of data.features) {
              if (feature.place_type?.includes("place") && !city) {
                city = feature.text
              }
              if (feature.place_type?.includes("region") && !state) {
                state = feature.text
              }
              if (feature.place_type?.includes("country") && !country) {
                country = feature.text
              }
            }

            address = data.features[0].place_name || `${city}, ${state}`

            return {
              lat,
              lng,
              name: city || "Unknown location",
              address,
              city,
              state,
              country
            }
          }
        }
      } catch (error) {
        console.warn("Mapbox reverse geocoding failed, trying fallback:", error)
      }
    }

    // Fallback to simple reverse geocode
    const locationName = await reverseGeocode(lat, lng)
    const parts = locationName.split(",").map(s => s.trim())
    
    return {
      lat,
      lng,
      name: locationName,
      address: locationName,
      city: parts[0] || "",
      state: parts[1] || "",
      country: "United States"
    }
  } catch (error) {
    console.error("Error reverse geocoding coordinates:", error)
    return null
  }
}
