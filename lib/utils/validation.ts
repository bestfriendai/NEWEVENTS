/**
 * Runtime validation utilities for API responses and user input
 */

import { logger } from "@/lib/utils/logger"
import DOMPurify from 'dompurify'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  data?: unknown
}

export interface ValidationRule<T> {
  validate: (value: T) => boolean
  message: string
}

export interface EventDetailOrganizer {
  name: string;
  avatar: string;
}

export interface EventDetailCoordinates {
  lat: number;
  lng: number;
}

export interface EventDetailType {
  id: number;
  title: string;
  description: string;
  category: string;
  date: string;
  time: string;
  location: string;
  address: string;
  price: string; // Consider union: number | string if "Free" or "$10"
  image: string; // URL
  organizer: EventDetailOrganizer;
  attendees: number;
  isFavorite: boolean;
  coordinates?: EventDetailCoordinates;
}

export interface SearchParamsType {
  keyword?: string;
  location?: string;
  radius?: number;
  startDateTime?: string;
  endDateTime?: string;
  categories?: string[]; // Assuming string array based on common usage
  page?: number;
  size?: number;
  sort?: string;
}
/**
 * Basic validation functions
 */
export const validators = {
  required: <T>(value: T): true | string => {
    if (value === null || value === undefined) return "Value is required"
    if (typeof value === 'string' && value.trim().length === 0) return "Value is required"
    if (Array.isArray(value) && value.length === 0) return "Value is required"
    return true
  },

  string: (value: unknown): true | string => {
    if (typeof value !== 'string') return "Value must be a string"
    return true
  },

  number: (value: unknown): true | string => {
    const strValue = String(value).trim();
    if (strValue === "") {
        return "Numeric value cannot be an empty string";
    }
    const parsedValue = parseFloat(strValue);
    if (isNaN(parsedValue)) {
      return "Value must be a valid numeric representation";
    }
    return true;
  },

  integer: (value: unknown): true | string => {
    const strValue = String(value).trim();
    if (strValue === "") {
        return "Integer value cannot be an empty string";
    }
    const parsedValue = parseFloat(strValue);

    if (isNaN(parsedValue)) {
      return "Value must be a valid numeric representation for an integer";
    }
    if (!Number.isInteger(parsedValue)) {
      return "Value must be a whole number (integer)";
    }
    return true;
  },

  boolean: (value: unknown): true | string => {
    if (typeof value !== 'boolean') return "Value must be a boolean"
    return true
  },

  array: (value: unknown): true | string => {
    if (!Array.isArray(value)) return "Value must be an array"
    return true
  },

  object: (value: unknown): true | string => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return "Value must be an object"
    return true
  },

  email: (value: string): true | string => {
    // Assuming `value` is already confirmed to be a string by schema type validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) return "Invalid email format"
    return true
  },

  url: (value: string): true | string => {
    // Assuming `value` is already confirmed to be a string
    try {
      new URL(value)
      return true
    } catch {
      return "Invalid URL format"
    }
  },

  // This internal helper is not directly exposed or used in schemas,
  // but its logic will be incorporated into latitude/longitude.
  // For direct use, it would also return true | string.
  // coordinate: (value: number): true | string => {
  //   if (!(typeof value === 'number' && !isNaN(value) && isFinite(value))) return "Coordinate must be a finite number";
  //   return true;
  // },

  latitude: (value: number): true | string => {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) return "Latitude must be a finite number"
    if (value < -90 || value > 90) return "Latitude must be between -90 and 90"
    return true
  },

  longitude: (value: number): true | string => {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) return "Longitude must be a finite number"
    if (value < -180 || value > 180) return "Longitude must be between -180 and 180"
    return true
  },

  dateString: (value: string): true | string => {
    // Assuming `value` is already confirmed to be a string
    const date = new Date(value)
    if (isNaN(date.getTime())) return "Invalid date format"
    return true
  },

  positiveNumber: (value: number): true | string => {
    // Assuming `value` is already confirmed to be a number
    if (value <= 0) return "Value must be a positive number"
    return true
  },

  nonNegativeNumber: (value: number): true | string => {
    // Assuming `value` is already confirmed to be a number
    if (value < 0) return "Value must be a non-negative number"
    return true
  },

  minLength: (min: number) => (value: string): true | string => {
    // Assuming `value` is already confirmed to be a string
    if (value.length < min) return `Value must be at least ${min} characters long`
    return true
  },

  maxLength: (max: number) => (value: string): true | string => {
    // Assuming `value` is already confirmed to be a string
    if (value.length > max) return `Value must be at most ${max} characters long`
    return true
  },

  range: (min: number, max: number) => (value: number): true | string => {
    // Assuming `value` is already confirmed to be a number
    if (value < min || value > max) return `Value must be between ${min} and ${max}`
    return true
  },

  oneOf: <T>(options: T[]) => (value: T): true | string => {
    if (!options.includes(value)) return `Value must be one of: ${options.join(', ')}`
    return true
  },

  pattern: (regex: RegExp) => (value: string): true | string => {
    // Assuming `value` is already confirmed to be a string
    if (!regex.test(value)) return "Value does not match the required pattern"
    return true
  }
}

/**
 * Schema-based validator
 */
export interface ValidationSchema {
  [key: string]: {
    required?: boolean
    type?: "string" | "number" | "boolean" | "array" | "object"
    validator?: (value: unknown) => true | string
    message?: string
    nested?: ValidationSchema
  }
}

export class SchemaValidator {
  validate(data: Record<string, unknown>, schema: ValidationSchema): ValidationResult {
    const errors: string[] = []

    if (!validators.object(data)) {
      return {
        isValid: false,
        errors: ["Data must be an object"],
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
        const typeValidationResult = typeValidator(value)
        if (typeof typeValidationResult === 'string') {
          errors.push(rules.message || typeValidationResult)
          continue
        }
        // If typeValidationResult is true, validation passed.
      }

      // Custom validator
      if (rules.validator) {
        const customValidationResult = rules.validator(value)
        if (typeof customValidationResult === 'string') {
          errors.push(rules.message || customValidationResult)
          continue
        }
        // If customValidationResult is true, validation passed.
      }

      // Nested object validation
      if (rules.nested && validators.object(value)) {
        const nestedResult = this.validate(value, rules.nested)
        if (!nestedResult.isValid) {
          errors.push(...nestedResult.errors.map((error) => `${key}.${error}`))
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: errors.length === 0 ? data : undefined,
    }
  }
}

/**
 * API response validators
 */

const eventDetailValidationSchema: ValidationSchema = {
  id: { required: true, type: "number" },
  title: { required: true, type: "string", validator: validators.minLength(1) },
  description: { required: true, type: "string" },
  category: { required: true, type: "string" },
  date: { required: true, type: "string", validator: validators.dateString },
  time: { required: true, type: "string" },
  location: { required: true, type: "string" },
  address: { required: true, type: "string" },
  price: { required: true, type: "string" },
  image: { required: true, type: "string", validator: validators.url },
  organizer: {
    required: true,
    type: "object",
    nested: {
      name: { required: true, type: "string" },
      avatar: { required: true, type: "string" },
    },
  },
  attendees: { required: true, type: "number", validator: validators.nonNegativeNumber },
  isFavorite: { required: true, type: "boolean" },
  coordinates: {
    required: false,
    type: "object",
    nested: {
      lat: { required: true, type: "number", validator: validators.latitude },
      lng: { required: true, type: "number", validator: validators.longitude },
    },
  },
}

const searchParamsValidationSchema: ValidationSchema = {
  keyword: { required: false, type: "string" },
  location: { required: false, type: "string" },
  radius: { required: false, type: "number", validator: validators.positiveNumber },
  startDateTime: { required: false, type: "string", validator: validators.dateString },
  endDateTime: { required: false, type: "string", validator: validators.dateString },
  categories: { required: false, type: "array" },
  page: { required: false, type: "number", validator: validators.nonNegativeNumber },
  size: { required: false, type: "number", validator: validators.range(1, 100) },
  sort: { required: false, type: "string" },
}

const coordinatesValidationSchema: ValidationSchema = {
  lat: { required: true, type: "number", validator: validators.latitude },
  lng: { required: true, type: "number", validator: validators.longitude },
}

const apiResponseValidationSchema: ValidationSchema = {
  events: { required: true, type: "array" },
  totalCount: { required: true, type: "number", validator: validators.nonNegativeNumber },
  page: { required: true, type: "number", validator: validators.nonNegativeNumber },
  totalPages: { required: true, type: "number", validator: validators.nonNegativeNumber },
  sources: { required: false, type: "array" },
}

export const apiValidators = {
  eventDetail: (data: unknown): ValidationResult => {
    return schemaValidator.validate(data as Record<string, unknown>, eventDetailValidationSchema)
  },

  searchParams: (data: unknown): ValidationResult => {
    return schemaValidator.validate(data as Record<string, unknown>, searchParamsValidationSchema)
  },

  coordinates: (data: unknown): ValidationResult => {
    return schemaValidator.validate(data as Record<string, unknown>, coordinatesValidationSchema)
  },

  apiResponse: (data: unknown): ValidationResult => {
    return schemaValidator.validate(data as Record<string, unknown>, apiResponseValidationSchema)
  },
}

/**
 * Sanitization functions
 */
export const sanitizers = {
  string: (value: unknown): string => {
    if (typeof value === "string") return value.trim()
    return String(value || "")
  },

  number: (value: unknown): number => {
    const num = Number(value)
    return isNaN(num) ? 0 : num
  },

  boolean: (value: unknown): boolean => {
    if (typeof value === "boolean") return value
    if (typeof value === "string") {
      return value.toLowerCase() === "true" || value === "1"
    }
    return Boolean(value)
  },

  array: (value: unknown): unknown[] => {
    if (Array.isArray(value)) return value
    if (value === null || value === undefined) return []
    return [value]
  },

  coordinates: (lat: unknown, lng: unknown): { lat: number; lng: number } | null => {
    const numLat = sanitizers.number(lat)
    const numLng = sanitizers.number(lng)

    const latValidation = validators.latitude(numLat)
    const lngValidation = validators.longitude(numLng)

    if (latValidation === true && lngValidation === true) {
      return { lat: numLat, lng: numLng }
    }

    return null
  },

  url: (value: unknown): string => {
    const str = sanitizers.string(value)
    if (!str) return ""

    // Add protocol if missing
    if (str.startsWith("//")) return `https:${str}`
    if (!str.startsWith("http://") && !str.startsWith("https://")) {
      return `https://${str}`
    }

    return str
  },

  html: (value: unknown): string => {
    const str = sanitizers.string(value)
    // Ensure DOMPurify is used in a browser-like environment or with a JSDOM setup for server-side.
    if (typeof window === 'undefined') {
      // Fallback for non-browser environments if JSDOM isn't used.
      logger.warn('DOMPurify is being used in a non-browser environment without JSDOM. Falling back to basic sanitization.', {
        component: 'sanitizers.html',
        action: 'sanitize_fallback'
      })
      // Basic escaping as a fallback
      return str
        .replace(/&/g, "&")
        .replace(/</g, "<")
        .replace(/>/g, ">")
        .replace(/"/g, '"') 
        .replace(/'/g, "&#x27;");
    }
    return DOMPurify.sanitize(str, { USE_PROFILES: { html: true } });
  },
}

/**
 * Validation helper functions
 */
export const validateAndSanitize = <T>(
  data: unknown,
  validator: (data: unknown) => ValidationResult,
  sanitizer?: (data: unknown) => T,
  componentName?: string,
  actionName?: string
): { isValid: boolean; data?: T; errors: string[] } => {
  try {
    // Sanitize first if sanitizer provided
    const sanitizedData = sanitizer ? sanitizer(data) : data
    
    // Then validate
    const result = validator(sanitizedData)
    
    if (result.isValid) {
      return {
        isValid: true,
        data: (result.data || sanitizedData) as T,
        errors: []
      }
    }
    
    return {
      isValid: false,
      errors: result.errors
    }
  } catch (error) {
    logger.error('Validation error', {
      component: componentName || 'validation',
      action: actionName || 'validate_and_sanitize_error'
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
export const isEventDetail = (data: unknown): data is EventDetailType => {
  const result = apiValidators.eventDetail(data)
  return result.isValid
}

export const isCoordinates = (data: unknown): data is { lat: number; lng: number } => {
  const result = apiValidators.coordinates(data)
  return result.isValid
}

export const isValidSearchParams = (data: unknown): boolean => {
  const result = apiValidators.searchParams(data)
  return result.isValid
}

// Create validator instance
export const schemaValidator = new SchemaValidator()
