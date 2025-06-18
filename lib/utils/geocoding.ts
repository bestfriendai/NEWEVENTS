import https from "node:https"

interface GeocodingResponse {
  results: {
    geometry: {
      location: {
        lat: number
        lng: number
      }
    }
  }[]
  status: string
}

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    console.error("GOOGLE_MAPS_API_KEY is not set in environment variables.")
    return null
  }

  const encodedAddress = encodeURIComponent(address)
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`

  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = ""

        res.on("data", (chunk) => {
          data += chunk
        })

        res.on("end", () => {
          try {
            const response: GeocodingResponse = JSON.parse(data)

            if (response.status === "OK" && response.results.length > 0) {
              const location = response.results[0].geometry.location
              resolve({ lat: location.lat, lng: location.lng })
            } else {
              console.warn(`Geocoding failed for address "${address}". Status: ${response.status}`)
              resolve(null)
            }
          } catch (error) {
            console.error("Error parsing geocoding response:", error)
            reject(error)
          }
        })
      })
      .on("error", (error) => {
        console.error("Error during geocoding request:", error)
        reject(error)
      })
  })
}
