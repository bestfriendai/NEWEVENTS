// Common type definitions to replace 'any' types

// Generic object types
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray
export type JsonObject = { [key: string]: JsonValue }
export type JsonArray = JsonValue[]
export type UnknownObject = Record<string, unknown>

// API Response types
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
  status: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// Error types
export interface ApiError {
  message: string
  code?: string
  status?: number
  details?: UnknownObject
}

// Request types
export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: UnknownObject | FormData | string
  query?: Record<string, string | number | boolean | undefined>
  timeout?: number
  signal?: AbortSignal
}

// Location types
export interface Coordinates {
  lat: number
  lng: number
}

export interface Address {
  street?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
}

export interface LocationData {
  name?: string
  address?: string | Address
  coordinates?: Coordinates
  placeId?: string
  formattedAddress?: string
}

// User types
export interface UserProfile {
  id: string
  email?: string
  name?: string
  avatar?: string
  preferences?: UserPreferences
  createdAt?: string
  updatedAt?: string
}

export interface UserPreferences {
  categories?: string[]
  radius?: number
  notifications?: boolean
  theme?: 'light' | 'dark' | 'system'
  language?: string
}

// Database types
export interface DatabaseRecord {
  id: string | number
  created_at?: string
  updated_at?: string
}

export interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: string
  order?: 'asc' | 'desc'
  filters?: Record<string, unknown>
}

// Form types
export interface FormField<T = unknown> {
  name: string
  value: T
  error?: string
  touched?: boolean
  required?: boolean
}

export interface FormState<T = UnknownObject> {
  values: T
  errors: Partial<Record<keyof T, string>>
  touched: Partial<Record<keyof T, boolean>>
  isSubmitting: boolean
  isValid: boolean
}

// Component props types
export interface WithClassName {
  className?: string
}

export interface WithChildren {
  children?: React.ReactNode
}

export interface WithStyle {
  style?: React.CSSProperties
}

// Utility types
export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type Maybe<T> = T | null | undefined

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequireAtLeastOne<T> = {
  [K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>
}[keyof T]

export type RequireOnlyOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>>
  & {
    [K in Keys]-?:
      Required<Pick<T, K>>
      & Partial<Record<Exclude<Keys, K>, undefined>>
  }[Keys]

// Function types
export type AsyncFunction<T = void, R = void> = (arg: T) => Promise<R>
export type VoidFunction = () => void
export type AsyncVoidFunction = () => Promise<void>

// Event handler types
export type ChangeHandler<T = HTMLInputElement> = (event: React.ChangeEvent<T>) => void
export type ClickHandler<T = HTMLElement> = (event: React.MouseEvent<T>) => void
export type SubmitHandler<T = HTMLFormElement> = (event: React.FormEvent<T>) => void
export type KeyHandler<T = HTMLElement> = (event: React.KeyboardEvent<T>) => void

// Status types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'
export type ConnectionState = 'connected' | 'connecting' | 'disconnected' | 'error'

// Re-export common types
export type { FC, ReactNode, CSSProperties } from 'react'