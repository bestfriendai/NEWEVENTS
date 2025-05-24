// types/ui.types.ts
import React from 'react'; // Added React import for React.ReactNode
import { Variants } from 'framer-motion';

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
export type AnimationVariants = Variants;

// Component prop types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface LoadingState {
  isLoading: boolean
  error?: string | null
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
    custom?: (value: unknown) => string | undefined
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