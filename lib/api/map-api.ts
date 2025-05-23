import { MAPBOX_API_KEY } from "@/lib/env"

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
    if (!MAPBOX_API_KEY) {
      console.error("Mapbox API key is not defined")
      return null
    }

    if (!address || address.trim() === "") {
      console.error("Address is required for geocoding")
      return null
    }

    const encodedAddress = encodeURIComponent(address.trim())
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_API_KEY}`

    console.log("Geocoding address:", address)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error(`Mapbox geocoding API error: ${response.status} ${response.statusText}`)
      return null
    }

    const data = await response.json()

    if (!data.features || data.features.length === 0) {
      console.warn("No geocoding results found for address:", address)
      return null
    }

    const feature = data.features[0]
    const [lng, lat] = feature.center

    const result: LocationData = {
      lat,
      lng,
      name: feature.text || address,
      address: feature.place_name || address,
    }

    console.log("Geocoding successful:", result)
    return result
  } catch (error) {
    console.error("Error geocoding address:", error)
    return null
  }
}

// Function to reverse geocode coordinates using Mapbox
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    if (!MAPBOX_API_KEY) {
      console.error("Mapbox API key is not defined")
      return "Unknown location"
    }

    if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) {
      console.error("Invalid coordinates for reverse geocoding:", { lat, lng })
      return "Unknown location"
    }

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_API_KEY}`

    console.log("Reverse geocoding coordinates:", { lat, lng })

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error(`Mapbox reverse geocoding API error: ${response.status} ${response.statusText}`)
      return "Unknown location"
    }

    const data = await response.json()

    if (!data.features || data.features.length === 0) {
      console.warn("No reverse geocoding results found for coordinates:", { lat, lng })
      return "Unknown location"
    }

    // Try to get a meaningful place name
    const place = data.features.find((f: any) => f.place_type.includes("place") || f.place_type.includes("locality"))
    const neighborhood = data.features.find((f: any) => f.place_type.includes("neighborhood"))
    const region = data.features.find((f: any) => f.place_type.includes("region"))

    let locationName = "Unknown location"

    if (place) {
      locationName = place.text
    } else if (neighborhood) {
      locationName = neighborhood.text
    } else if (region) {
      locationName = region.text
    } else if (data.features[0]) {
      locationName = data.features[0].place_name || data.features[0].text || "Unknown location"
    }

    console.log("Reverse geocoding successful:", locationName)
    return locationName
  } catch (error) {
    console.error("Error reverse geocoding:", error)
    return "Unknown location"
  }
}

// Function to get nearby places using Mapbox
export async function getNearbyPlaces(lat: number, lng: number, category: string, limit = 10): Promise<LocationData[]> {
  try {
    if (!MAPBOX_API_KEY) {
      console.error("Mapbox API key is not defined")
      return []
    }

    if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) {
      console.error("Invalid coordinates for nearby places:", { lat, lng })
      return []
    }

    const encodedCategory = encodeURIComponent(category)
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedCategory}.json?proximity=${lng},${lat}&limit=${limit}&access_token=${MAPBOX_API_KEY}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error(`Mapbox nearby places API error: ${response.status} ${response.statusText}`)
      return []
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
