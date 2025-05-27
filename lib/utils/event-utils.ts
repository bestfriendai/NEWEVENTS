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
 * Transform database event entity to UI event props
 */
export function transformEventEntityToProps(entity: any): EventDetailProps {
  return {
    id: entity.id,
    title: entity.title || "Untitled Event",
    description: entity.description || "No description available",
    category: entity.category || "Event",
    date: entity.start_date ? new Date(entity.start_date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }) : "TBD",
    time: entity.start_date ? new Date(entity.start_date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }) : "TBD",
    location: entity.location_name || "TBD",
    address: entity.location_address || "Address TBD",
    price: formatEventPrice(entity.price_min, entity.price_max, entity.price_currency),
    image: entity.image_url || "/community-event.png",
    organizer: {
      name: entity.organizer_name || "Event Organizer",
      avatar: entity.organizer_avatar || "/avatar-1.png",
    },
    attendees: entity.attendee_count || 0,
    isFavorite: false, // TODO: Implement user favorites
    coordinates: {
      lat: entity.location_lat || 0,
      lng: entity.location_lng || 0,
    },
  }
}

/**
 * Format event price for display
 */
function formatEventPrice(minPrice?: number, maxPrice?: number, currency = "USD"): string {
  if (!minPrice && !maxPrice) return "Free"
  if (minPrice === 0 && maxPrice === 0) return "Free"

  const symbol = currency === "USD" ? "$" : currency

  if (minPrice && maxPrice && minPrice !== maxPrice) {
    return `${symbol}${minPrice}-${maxPrice}`
  }

  const price = minPrice || maxPrice || 0
  return `${symbol}${price}`
}
