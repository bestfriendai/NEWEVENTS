import { logger } from "@/lib/utils/logger"
import type { EventDetailProps } from "@/components/event-detail-modal"

// Fallback event data when RapidAPI is unavailable
export function generateRapidApiFallbackEvents(limit = 20): EventDetailProps[] {
  const categories = ["Music", "Arts", "Sports", "Food", "Business", "Technology"]
  const locations = [
    { name: "Madison Square Garden", city: "New York", lat: 40.7505, lng: -73.9934 },
    { name: "Hollywood Bowl", city: "Los Angeles", lat: 34.1122, lng: -118.339 },
    { name: "Navy Pier", city: "Chicago", lat: 41.8919, lng: -87.6051 },
    { name: "Space Needle", city: "Seattle", lat: 47.6205, lng: -122.3493 },
  ]

  const events: EventDetailProps[] = []

  for (let i = 0; i < limit; i++) {
    const category = categories[i % categories.length]
    const location = locations[i % locations.length]

    // Generate future dates
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 30) + 1)

    const formattedDate = futureDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    const formattedTime = new Date(futureDate.getTime() + Math.random() * 12 * 60 * 60 * 1000).toLocaleTimeString(
      "en-US",
      {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      },
    )

    events.push({
      id: i + 1000, // Offset to avoid conflicts
      title: `${category} Event ${i + 1}`,
      description: `Experience an amazing ${category.toLowerCase()} event in ${location.city}.`,
      category,
      date: formattedDate,
      time: formattedTime,
      location: location.name,
      address: `${location.name}, ${location.city}`,
      price: Math.random() < 0.3 ? "Free" : `$${Math.floor(Math.random() * 100) + 10}`,
      image: `/event-${(i % 12) + 1}.png`,
      organizer: {
        name: `${location.city} Events`,
        avatar: `/avatar-${(i % 6) + 1}.png`,
      },
      attendees: Math.floor(Math.random() * 1000) + 50,
      isFavorite: false,
      coordinates: { lat: location.lat, lng: location.lng },
      ticketLinks: [{ source: "Tickets", link: "#" }],
    })
  }

  return events
}

// Test RapidAPI connection
export async function testRapidApiConnection(): Promise<boolean> {
  try {
    const response = await fetch("https://real-time-events-search.p.rapidapi.com/search-events?query=test&limit=1", {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": process.env.RAPIDAPI_KEY || "",
        "X-RapidAPI-Host": "real-time-events-search.p.rapidapi.com",
      },
    })

    return response.ok
  } catch (error) {
    logger.error("RapidAPI connection test failed", { error })
    return false
  }
}
