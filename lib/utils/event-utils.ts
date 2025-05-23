import type { EventDetailProps } from "@/components/event-detail-modal"

/**
 * Calculates distance between two coordinates in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c // Distance in km
  return d
}

/**
 * Converts degrees to radians
 */
export function deg2rad(deg: number): number {
  return deg * (Math.PI / 180)
}

/**
 * Gets color based on event category
 */
export function getCategoryColor(category: string): string {
  switch (category.toLowerCase()) {
    case "music":
      return "#8B5CF6" // Purple
    case "arts":
      return "#3B82F6" // Blue
    case "sports":
      return "#10B981" // Green
    case "food":
      return "#EC4899" // Pink
    case "business":
      return "#F59E0B" // Yellow
    default:
      return "#6366F1" // Indigo
  }
}

/**
 * Formats date for display
 */
export function formatDate(dateString: string): string {
  if (!dateString) return "Date TBA"
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch {
    return "Date TBA"
  }
}

/**
 * Formats time for display
 */
export function formatTime(startTime: string, endTime?: string): string {
  if (!startTime) return "Time TBA"
  try {
    const start = new Date(startTime)
    const startFormatted = start.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })

    if (endTime) {
      const end = new Date(endTime)
      const endFormatted = end.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      return `${startFormatted} - ${endFormatted}`
    }

    return `${startFormatted} onwards`
  } catch {
    return "Time TBA"
  }
}

/**
 * Generates mock events around a location
 */
export function generateMockEventsAroundLocation(
  lat: number,
  lng: number,
  radius: number,
  count: number,
): EventDetailProps[] {
  const events: EventDetailProps[] = []
  const categories = ["Music", "Arts", "Sports", "Food", "Business"]
  const locations = ["Park", "Arena", "Theater", "Stadium", "Hall", "Center", "Venue", "Club", "Gallery", "Restaurant"]

  for (let i = 0; i < count; i++) {
    // Generate random coordinates within the radius
    const randomAngle = Math.random() * Math.PI * 2
    const randomRadius = Math.sqrt(Math.random()) * radius * 0.01 // Convert km to degrees (approximate)
    const eventLat = lat + randomRadius * Math.cos(randomAngle)
    const eventLng = lng + randomRadius * Math.sin(randomAngle)

    // Generate random date within next 30 days
    const today = new Date()
    const futureDate = new Date(today)
    futureDate.setDate(today.getDate() + Math.floor(Math.random() * 30))
    const formattedDate = futureDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    // Generate random time
    const hours = Math.floor(Math.random() * 12) + 1
    const minutes = Math.floor(Math.random() * 4) * 15
    const period = Math.random() > 0.5 ? "PM" : "AM"
    const formattedTime = `${hours}:${minutes.toString().padStart(2, "0")} ${period}`

    // Generate random category
    const category = categories[Math.floor(Math.random() * categories.length)]

    // Generate random location
    const location = locations[Math.floor(Math.random() * locations.length)]

    // Generate random price
    const price = Math.random() > 0.3 ? `$${Math.floor(Math.random() * 100) + 10}` : "Free"

    // Generate random attendees
    const attendees = Math.floor(Math.random() * 1000) + 50

    // Create event
    events.push({
      id: 1000 + i,
      title: `${category} Event ${i + 1}`,
      description: `This is a mock ${category.toLowerCase()} event near your location.`,
      category,
      date: formattedDate,
      time: formattedTime,
      location: `${location} ${i + 1}`,
      address: `Near your location`,
      price,
      image: "/community-event.png",
      organizer: {
        name: "Local Organizer",
        avatar: "/avatar-1.png",
      },
      attendees,
      isFavorite: Math.random() > 0.8,
      coordinates: { lat: eventLat, lng: eventLng },
    })
  }

  return events
}
