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

export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
  errors?: string[]
  pagination?: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

export interface EventSearchParams {
  query?: string
  location?: string
  category?: string
  startDate?: string
  endDate?: string
  minPrice?: number
  maxPrice?: number
  radius?: number
  page?: number
  limit?: number
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
