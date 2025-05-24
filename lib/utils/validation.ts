/**
 * Runtime validation utilities for API responses and user input
 */

import { logger } from '@/lib/utils/logger'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  data?: any
}

export interface ValidationRule<T> {
  validate: (value: T) => boolean
  message: string
}

/**
 * Basic validation functions
 */
export const validators = {
  required: <T>(value: T): boolean => {
    if (value === null || value === undefined) return false
    if (typeof value === 'string') return value.trim().length > 0
    if (Array.isArray(value)) return value.length > 0
    return true
  },

  string: (value: any): value is string => typeof value === 'string',

  number: (value: any): value is number => typeof value === 'number' && !isNaN(value),

  boolean: (value: any): value is boolean => typeof value === 'boolean',

  array: (value: any): value is any[] => Array.isArray(value),

  object: (value: any): value is object => 
    typeof value === 'object' && value !== null && !Array.isArray(value),

  email: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value)
  },

  url: (value: string): boolean => {
    try {
      new URL(value)
      return true
    } catch {
      return false
    }
  },

  coordinate: (value: number): boolean => {
    return typeof value === 'number' && !isNaN(value) && isFinite(value)
  },

  latitude: (value: number): boolean => {
    return validators.coordinate(value) && value >= -90 && value <= 90
  },

  longitude: (value: number): boolean => {
    return validators.coordinate(value) && value >= -180 && value <= 180
  },

  dateString: (value: string): boolean => {
    const date = new Date(value)
    return !isNaN(date.getTime())
  },

  positiveNumber: (value: number): boolean => {
    return validators.number(value) && value > 0
  },

  nonNegativeNumber: (value: number): boolean => {
    return validators.number(value) && value >= 0
  },

  minLength: (min: number) => (value: string): boolean => {
    return validators.string(value) && value.length >= min
  },

  maxLength: (max: number) => (value: string): boolean => {
    return validators.string(value) && value.length <= max
  },

  range: (min: number, max: number) => (value: number): boolean => {
    return validators.number(value) && value >= min && value <= max
  },

  oneOf: <T>(options: T[]) => (value: T): boolean => {
    return options.includes(value)
  },

  pattern: (regex: RegExp) => (value: string): boolean => {
    return validators.string(value) && regex.test(value)
  }
}

/**
 * Schema-based validator
 */
export interface ValidationSchema {
  [key: string]: {
    required?: boolean
    type?: 'string' | 'number' | 'boolean' | 'array' | 'object'
    validator?: (value: any) => boolean
    message?: string
    nested?: ValidationSchema
  }
}

export class SchemaValidator {
  validate(data: any, schema: ValidationSchema): ValidationResult {
    const errors: string[] = []

    if (!validators.object(data)) {
      return {
        isValid: false,
        errors: ['Data must be an object']
      }
    }

    for (const [key, rules] of Object.entries(schema)) {
      const value = data[key]

      // Check required fields
      if (rules.required && !validators.required(value)) {
        errors.push(`${key} is required`)
        continue
      }

      // Skip validation if field is not required and not present
      if (!rules.required && (value === undefined || value === null)) {
        continue
      }

      // Type validation
      if (rules.type) {
        const typeValidator = validators[rules.type]
        if (!typeValidator(value)) {
          errors.push(rules.message || `${key} must be of type ${rules.type}`)
          continue
        }
      }

      // Custom validator
      if (rules.validator && !rules.validator(value)) {
        errors.push(rules.message || `${key} is invalid`)
        continue
      }

      // Nested object validation
      if (rules.nested && validators.object(value)) {
        const nestedResult = this.validate(value, rules.nested)
        if (!nestedResult.isValid) {
          errors.push(...nestedResult.errors.map(error => `${key}.${error}`))
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: errors.length === 0 ? data : undefined
    }
  }
}

/**
 * API response validators
 */
export const apiValidators = {
  eventDetail: (data: any): ValidationResult => {
    const schema: ValidationSchema = {
      id: { required: true, type: 'number' },
      title: { required: true, type: 'string', validator: validators.minLength(1) },
      description: { required: true, type: 'string' },
      category: { required: true, type: 'string' },
      date: { required: true, type: 'string', validator: validators.dateString },
      time: { required: true, type: 'string' },
      location: { required: true, type: 'string' },
      address: { required: true, type: 'string' },
      price: { required: true, type: 'string' },
      image: { required: true, type: 'string', validator: validators.url },
      organizer: {
        required: true,
        type: 'object',
        nested: {
          name: { required: true, type: 'string' },
          avatar: { required: true, type: 'string' }
        }
      },
      attendees: { required: true, type: 'number', validator: validators.nonNegativeNumber },
      isFavorite: { required: true, type: 'boolean' },
      coordinates: {
        required: false,
        type: 'object',
        nested: {
          lat: { required: true, type: 'number', validator: validators.latitude },
          lng: { required: true, type: 'number', validator: validators.longitude }
        }
      }
    }

    const validator = new SchemaValidator()
    return validator.validate(data, schema)
  },

  searchParams: (data: any): ValidationResult => {
    const schema: ValidationSchema = {
      keyword: { required: false, type: 'string' },
      location: { required: false, type: 'string' },
      radius: { required: false, type: 'number', validator: validators.positiveNumber },
      startDateTime: { required: false, type: 'string', validator: validators.dateString },
      endDateTime: { required: false, type: 'string', validator: validators.dateString },
      categories: { required: false, type: 'array' },
      page: { required: false, type: 'number', validator: validators.nonNegativeNumber },
      size: { required: false, type: 'number', validator: validators.range(1, 100) },
      sort: { required: false, type: 'string' }
    }

    const validator = new SchemaValidator()
    return validator.validate(data, schema)
  },

  coordinates: (data: any): ValidationResult => {
    const schema: ValidationSchema = {
      lat: { required: true, type: 'number', validator: validators.latitude },
      lng: { required: true, type: 'number', validator: validators.longitude }
    }

    const validator = new SchemaValidator()
    return validator.validate(data, schema)
  },

  apiResponse: (data: any): ValidationResult => {
    const schema: ValidationSchema = {
      events: { required: true, type: 'array' },
      totalCount: { required: true, type: 'number', validator: validators.nonNegativeNumber },
      page: { required: true, type: 'number', validator: validators.nonNegativeNumber },
      totalPages: { required: true, type: 'number', validator: validators.nonNegativeNumber },
      sources: { required: false, type: 'array' }
    }

    const validator = new SchemaValidator()
    return validator.validate(data, schema)
  }
}

/**
 * Sanitization functions
 */
export const sanitizers = {
  string: (value: any): string => {
    if (typeof value === 'string') return value.trim()
    return String(value || '')
  },

  number: (value: any): number => {
    const num = Number(value)
    return isNaN(num) ? 0 : num
  },

  boolean: (value: any): boolean => {
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1'
    }
    return Boolean(value)
  },

  array: (value: any): any[] => {
    if (Array.isArray(value)) return value
    if (value === null || value === undefined) return []
    return [value]
  },

  coordinates: (lat: any, lng: any): { lat: number; lng: number } | null => {
    const numLat = sanitizers.number(lat)
    const numLng = sanitizers.number(lng)
    
    if (validators.latitude(numLat) && validators.longitude(numLng)) {
      return { lat: numLat, lng: numLng }
    }
    
    return null
  },

  url: (value: any): string => {
    const str = sanitizers.string(value)
    if (!str) return ''
    
    // Add protocol if missing
    if (str.startsWith('//')) return `https:${str}`
    if (!str.startsWith('http://') && !str.startsWith('https://')) {
      return `https://${str}`
    }
    
    return str
  },

  html: (value: any): string => {
    const str = sanitizers.string(value)
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
  }
}

/**
 * Validation helper functions
 */
export const validateAndSanitize = <T>(
  data: any,
  validator: (data: any) => ValidationResult,
  sanitizer?: (data: any) => T
): { isValid: boolean; data?: T; errors: string[] } => {
  try {
    // Sanitize first if sanitizer provided
    const sanitizedData = sanitizer ? sanitizer(data) : data
    
    // Then validate
    const result = validator(sanitizedData)
    
    if (result.isValid) {
      return {
        isValid: true,
        data: result.data || sanitizedData,
        errors: []
      }
    }
    
    return {
      isValid: false,
      errors: result.errors
    }
  } catch (error) {
    logger.error('Validation error', {
      component: 'validation',
      action: 'validate_and_sanitize_error'
    }, error instanceof Error ? error : new Error('Unknown validation error'))
    
    return {
      isValid: false,
      errors: ['Validation failed due to unexpected error']
    }
  }
}

/**
 * Type guards for common types
 */
export const isEventDetail = (data: any): data is any => {
  const result = apiValidators.eventDetail(data)
  return result.isValid
}

export const isCoordinates = (data: any): data is { lat: number; lng: number } => {
  const result = apiValidators.coordinates(data)
  return result.isValid
}

export const isValidSearchParams = (data: any): boolean => {
  const result = apiValidators.searchParams(data)
  return result.isValid
}

// Create validator instance
export const schemaValidator = new SchemaValidator()
