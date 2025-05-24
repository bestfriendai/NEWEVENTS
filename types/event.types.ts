// types/event.types.ts

// Copied from types/index.ts
export interface TicketmasterImage {
  url: string
  width: number
  height: number
  ratio: "small" | "large" | "medium"
}

export interface EventDetail {
  id: number
  title: string
  description: string
  category: string
  date: string
  time: string
  location: string
  address: string
  price: string
  image: string
  organizer: {
    name: string
    avatar: string
  }
  attendees: number
  isFavorite: boolean
  coordinates?: {
    lat: number
    lng: number
  }
  ticketLinks?: Array<{
    source: string
    link: string
  }>
  tags?: string[]
  venue?: {
    name: string
    capacity?: number
    type?: string
  }
}

// EventDetailProps was a direct alias to EventDetail and has been removed.
// Usages should be updated to EventDetail.

// Search and Filter Types
export interface EventSearchParams {
  location?: string
  keyword?: string
  category?: string
  radius?: number
size?: number
  startDate?: string | undefined
  endDate?: string | undefined
  priceMin?: number
  priceMax?: number
  sortBy?: 'date' | 'popularity' | 'price' | 'distance'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// Enhanced event search parameters
export interface EnhancedEventSearchParams extends EventSearchParams {
  providers?: string[]
  includeVenueDetails?: boolean
  includePricing?: boolean
}

// API Response Types
export interface TicketmasterEvent {
  id: string
  name: string
  url?: string
  info?: string
  pleaseNote?: string
  accessibility?: {
    info?: string
  }
  promoter?: {
    name?: string
    description?: string
  }
  images?: TicketmasterImage[]
  sales?: {
    public?: {
      startDateTime?: string
      endDateTime?: string
    }
    presales?: Array<{
      url?: string
      name?: string
    }>
  }
  dates?: {
    start?: {
      localDate?: string
      localTime?: string
    }
  }
  _embedded?: {
    venues?: Array<{
      name?: string
      address?: {
        line1?: string
      }
      city?: {
        name?: string
      }
      state?: {
        name?: string
        stateCode?: string
      }
      location?: {
        latitude?: string
        longitude?: string
      }
    }>
    attractions?: Array<{
      name?: string
      images?: TicketmasterImage[]
    }>
  }
  priceRanges?: Array<{
    min?: number
    max?: number
    currency?: string
  }>
  classifications?: Array<{
    segment?: {
      name?: string
    }
    genre?: {
      name?: string
    }
  }>
}

export interface RapidAPIEvent {
  title: string
  description?: string
  start_time: string
  end_time?: string
  thumbnail?: string
  venue?: {
    name?: string
    full_address?: string
    latitude?: number
    longitude?: number
  }
  ticket_links?: Array<{
    source?: string
    link?: string
  }>
  info_links?: Array<{
    source?: string
    link?: string
  }>
  is_free?: boolean
}
