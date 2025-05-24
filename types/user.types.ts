// types/user.types.ts

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
