// Global type definitions for the DateAI application

export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  preferences?: UserPreferences
  created_at?: string
  updated_at?: string
}

export interface UserPreferences {
  favoriteCategories?: string[]
  pricePreference?: 'free' | 'paid' | 'any'
  timePreference?: 'morning' | 'afternoon' | 'evening' | 'any'
  locationRadius?: number
  notifications?: {
    email: boolean
    push: boolean
    sms: boolean
  }
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

export interface ApiResponse<T> {
  data: T
  status: 'success' | 'error'
  message?: string
  totalCount?: number
  page?: number
  totalPages?: number
}

export interface SearchFilters {
  keyword?: string
  location?: string
  category?: string
  dateRange?: {
    start: Date
    end: Date
  }
  priceRange?: {
    min: number
    max: number
  }
  radius?: number
  sortBy?: 'date' | 'popularity' | 'price' | 'distance'
  sortOrder?: 'asc' | 'desc'
}

export interface MapViewport {
  latitude: number
  longitude: number
  zoom: number
}

export interface NotificationItem {
  id: number
  type: 'event' | 'system' | 'social' | 'promotion'
  title: string
  message: string
  timestamp: string
  read: boolean
  actionUrl?: string
  actionText?: string
  avatar?: string
}

// Animation variants for consistent animations
export interface AnimationVariants {
  initial: object
  animate: object
  exit?: object
  transition?: object
}

// Component prop types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface LoadingState {
  isLoading: boolean
  error?: string | null
}

// API Error types
export interface ApiError {
  message: string
  code?: string
  status?: number
  details?: unknown
}

// Form types
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'select' | 'textarea' | 'date' | 'number'
  placeholder?: string
  required?: boolean
  options?: Array<{ value: string; label: string }>
  validation?: {
    min?: number
    max?: number
    pattern?: RegExp
    custom?: (value: any) => string | undefined
  }
}

// Theme types
export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  foreground: string
  muted: string
  border: string
  destructive: string
  warning: string
  success: string
}

export interface ThemeConfig {
  colors: ThemeColors
  spacing: Record<string, string>
  typography: Record<string, object>
  borderRadius: Record<string, string>
  shadows: Record<string, string>
}