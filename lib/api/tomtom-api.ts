import { TOMTOM_API_KEY } from "@/lib/env"

export interface TomTomSearchResult {
  id: string
  type: string
  score: number
  address: {
    streetNumber?: string
    streetName?: string
    municipality?: string
    countrySubdivision?: string
    countryCode?: string
    country?: string
    postalCode?: string
    freeformAddress?: string
  }
  position: {
    lat: number
    lon: number
  }
  viewport?: {
    topLeftPoint: { lat: number; lon: number }
    btmRightPoint: { lat: number; lon: number }
  }
}

export async function geocodeWithTomTom(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const queryParams = new URLSearchParams()
    queryParams.append("key", TOMTOM_API_KEY || "")
    queryParams.append("query", address)
    queryParams.append("limit", "1")

    const response = await fetch(
      `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(address)}.json?${queryParams.toString()}`,
    )

    if (!response.ok) {
      // console.error("TomTom geocoding error:", response.status, response.statusText)
      return null
    }

    const data = await response.json()

    if (data.results && data.results.length > 0) {
      const result = data.results[0]
      return {
        lat: result.position.lat,
        lng: result.position.lon,
      }
    }

    return null
  } catch (error) {
    // console.error("TomTom geocoding error:", error)
    return null
  }
}

export async function reverseGeocodeWithTomTom(lat: number, lng: number): Promise<string | null> {
  try {
    const queryParams = new URLSearchParams()
    queryParams.append("key", TOMTOM_API_KEY || "")

    const response = await fetch(
      `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lng}.json?${queryParams.toString()}`,
    )

    if (!response.ok) {
      // console.error("TomTom reverse geocoding error:", response.status, response.statusText)
      return null
    }

    const data = await response.json()

    if (data.addresses && data.addresses.length > 0) {
      return data.addresses[0].address.freeformAddress
    }

    return null
  } catch (error) {
    // console.error("TomTom reverse geocoding error:", error)
    return null
  }
}

export async function searchPlacesWithTomTom(
  query: string,
  coordinates?: { lat: number; lng: number },
): Promise<TomTomSearchResult[]> {
  try {
    const queryParams = new URLSearchParams()
    queryParams.append("key", TOMTOM_API_KEY || "")
    queryParams.append("query", query)
    queryParams.append("limit", "10")

    if (coordinates) {
      queryParams.append("lat", coordinates.lat.toString())
      queryParams.append("lon", coordinates.lng.toString())
      queryParams.append("radius", "50000") // 50km radius
    }

    const response = await fetch(
      `https://api.tomtom.com/search/2/search/${encodeURIComponent(query)}.json?${queryParams.toString()}`,
    )

    if (!response.ok) {
      // console.error("TomTom search error:", response.status, response.statusText)
      return []
    }

    const data = await response.json()
    return data.results || []
  } catch (error) {
    // console.error("TomTom search error:", error)
    return []
  }
}
