import https from "node:https"

export class GeocodingService {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async geocode(address: string): Promise<any> {
    const encodedAddress = encodeURIComponent(address)
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${this.apiKey}`

    return new Promise((resolve, reject) => {
      https
        .get(url, (res) => {
          let data = ""

          res.on("data", (chunk) => {
            data += chunk
          })

          res.on("end", () => {
            try {
              const jsonData = JSON.parse(data)
              resolve(jsonData)
            } catch (error) {
              reject(error)
            }
          })
        })
        .on("error", (error) => {
          reject(error)
        })
    })
  }
}
