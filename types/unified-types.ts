// Unified type definitions to resolve type mismatches

// Base event interface with common properties
export interface BaseEvent {
  id: string | number
  title: string
  description: string
  category: string
  date: string
  time?: string
  image?: string
  isFavorite?: boolean
}

// Location information
export interface EventLocation {
  name: string
  address?: string
  city?: string
  state?: string
  country?: string
  coordinates?: {
    lat: number
    lng: number
  }
}

// Price information
export interface EventPrice {
  min?: number
  max?: number
  currency?: string
  display?: string // For formatted price strings like "$20-$50"
}

// Organizer information
export interface EventOrganizer {
  id?: string
  name: string
  description?: string
  logo?: string
  website?: string
  verified?: boolean
}

// Ticket link information
export interface TicketLink {
  link: string
  source: string
  type?: string
}

// Main Event interface (for API responses and general use)
export interface Event extends BaseEvent {
  id: string
  location: EventLocation
  price?: EventPrice
  url?: string
  source: "ticketmaster" | "predicthq" | "eventbrite" | "rapidapi"
  tags?: string[]
  attendeeCount?: number
  organizer?: EventOrganizer
  ticketLinks?: TicketLink[]
  
  // Additional properties for compatibility
  latitude?: number
  longitude?: number
  rating?: number
  
  // Metadata
  createdAt?: string
  updatedAt?: string
  externalId?: string
}

// EventDetailProps (for UI components, especially modal)
export interface EventDetailProps extends BaseEvent {
  id: number
  location: string // Simple string for UI display
  address?: string
  coordinates?: { lat: number; lng: number }
  price: string // Formatted price string for display
  attendees?: number
  organizer?: { name: string; logo?: string }
  isFeatured?: boolean
  ticketLinks?: Array<{ link: string; source: string }>
}

// Conversion utilities
export function eventToDetailProps(event: Event): EventDetailProps {
  return {
    id: typeof event.id === 'string' ? parseInt(event.id, 10) : event.id,
    title: event.title,
    description: event.description,
    date: event.date,
    time: event.time,
    location: event.location.name || event.location.city || 'Location TBA',
    address: event.location.address,
    coordinates: event.location.coordinates,
    price: formatPrice(event.price),
    category: event.category,
    image: event.image,
    attendees: event.attendeeCount,
    organizer: event.organizer ? {
      name: event.organizer.name,
      logo: event.organizer.logo
    } : undefined,
    isFavorite: event.isFavorite,
    ticketLinks: event.ticketLinks
  }
}

export function detailPropsToEvent(props: EventDetailProps, source: Event['source'] = 'rapidapi'): Event {
  return {
    id: props.id.toString(),
    title: props.title,
    description: props.description,
    category: props.category,
    date: props.date,
    time: props.time,
    location: {
      name: props.location,
      address: props.address,
      coordinates: props.coordinates
    },
    price: parsePrice(props.price),
    image: props.image,
    source,
    attendeeCount: props.attendees,
    organizer: props.organizer,
    isFavorite: props.isFavorite,
    ticketLinks: props.ticketLinks
  }
}

// Helper functions
function formatPrice(price?: EventPrice): string {
  if (!price) return 'Free'
  if (price.display) return price.display
  
  const currency = price.currency || 'USD'
  const symbol = currency === 'USD' ? '$' : currency
  
  if (price.min === 0 && (!price.max || price.max === 0)) return 'Free'
  if (price.min && price.max && price.min !== price.max) {
    return `${symbol}${price.min}-${symbol}${price.max}`
  }
  return `${symbol}${price.min || price.max || 0}`
}

function parsePrice(priceStr: string): EventPrice | undefined {
  if (!priceStr || priceStr.toLowerCase() === 'free') {
    return { min: 0, max: 0, currency: 'USD' }
  }
  
  const matches = priceStr.match(/\$?(\d+(?:\.\d{2})?)/g)
  if (!matches) return undefined
  
  const prices = matches.map(m => parseFloat(m.replace('$', '')))
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
    currency: 'USD',
    display: priceStr
  }
}

// Re-export other types for compatibility
export * from './event.types'
export * from './api.types'
export * from './user.types'