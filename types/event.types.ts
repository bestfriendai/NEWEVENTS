export interface Event {
  id: string
  title: string
  description: string
  date: string
  location: {
    name: string
    address: string
    city: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  category: string
  price?: {
    min: number
    max?: number
    currency: string
  }
  image?: string
  url?: string
  source: "ticketmaster" | "predicthq" | "eventbrite"
  tags?: string[]
  attendeeCount?: number
  isFavorite?: boolean
}

export interface EventFilters {
  location?: string
  category?: string
  dateRange?: {
    start: string
    end: string
  }
  priceRange?: {
    min: number
    max: number
  }
  radius?: number
  tags?: string[]
}

export interface EventSearchParams {
  // Text search
  query?: string
  keyword?: string

  // Location
  location?: string
  lat?: number
  lng?: number
  radius?: number

  // Categories and filtering
  category?: string
  categories?: string[]

  // Date filtering
  startDate?: string
  endDate?: string
  dateRange?: {
    start: string
    end: string
  }

  // Price filtering
  minPrice?: number
  maxPrice?: number
  priceMin?: number
  priceMax?: number
  priceRange?: {
    min: number
    max: number
  }

  // Sorting and pagination
  sortBy?: "date" | "distance" | "popularity" | "price" | "relevance"
  sortOrder?: "asc" | "desc"
  page?: number
  limit?: number
  offset?: number

  // Advanced filters
  tags?: string[]
  source?: "rapidapi" | "ticketmaster" | "eventbrite" | "all"
  hasImages?: boolean
  hasDescription?: boolean

  // Search behavior
  includeCache?: boolean
  forceRefresh?: boolean
}

export interface EventCategory {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  color?: string
}

export interface EventVenue {
  id: string
  name: string
  address: string
  city: string
  state?: string
  country: string
  postalCode?: string
  coordinates: {
    lat: number
    lng: number
  }
  capacity?: number
  type?: string
}

export interface EventOrganizer {
  id: string
  name: string
  description?: string
  website?: string
  logo?: string
  verified?: boolean
}

// Alias for EventDetailProps from components
export type EventDetail = import('../components/event-detail-modal').EventDetailProps
