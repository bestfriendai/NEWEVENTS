import { API_CONFIG } from "@/lib/env"

// Interface for location data
export interface LocationData {
  lat: number
  lng: number
  name: string
  address: string
}

// Function to geocode an address using Mapbox
export async function geocodeAddress(address: string): Promise<LocationData | null> {
  try {
    const encodedAddress = encodeURIComponent(address)
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${API_CONFIG.maps.mapbox.apiKey}`,
    )

    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.features || data.features.length === 0) {
      return null
    }

    const feature = data.features[0]
    const [lng, lat] = feature.center

    return {
      lat,
      lng,
      name: feature.text || "",
      address: feature.place_name || "",
    }
  } catch (error) {
    console.error("Error geocoding address:", error)
    return null
  }
}

// Function to reverse geocode coordinates using Mapbox
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${API_CONFIG.maps.mapbox.apiKey}`,
    )

    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.features || data.features.length === 0) {
      return "Unknown location"
    }

    return data.features[0].place_name || "Unknown location"
  } catch (error) {
    console.error("Error reverse geocoding:", error)
    return "Unknown location"
  }
}

// Function to get nearby places using Mapbox
export async function getNearbyPlaces(lat: number, lng: number, category: string, limit = 10): Promise<LocationData[]> {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${category}.json?proximity=${lng},${lat}&limit=${limit}&access_token=${API_CONFIG.maps.mapbox.apiKey}`,
    )

    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.features || data.features.length === 0) {
      return []
    }

    return data.features.map((feature: any) => {
      const [featureLng, featureLat] = feature.center
      return {
        lat: featureLat,
        lng: featureLng,
        name: feature.text || "",
        address: feature.place_name || "",
      }
    })
  } catch (error) {
    console.error("Error getting nearby places:", error)
    return []
  }
}
