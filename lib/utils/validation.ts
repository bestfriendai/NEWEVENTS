/**
 * Enhanced Validation Utilities
 * Provides comprehensive validation schemas and utilities
 */

import { z } from "zod"

// Common validation schemas
export const EmailSchema = z.string().email("Invalid email address")

export const PasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")

export const PhoneSchema = z.string().regex(/^\+?[\d\s\-$$$$]+$/, "Invalid phone number format")

export const URLSchema = z.string().url("Invalid URL format")

export const CoordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})

// Event validation schemas
export const EventSearchSchema = z.object({
  keyword: z.string().min(1).max(200).optional(),
  location: z.string().min(1).max(200).optional(),
  radius: z.number().min(1).max(100).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  categories: z.array(z.string().min(1).max(50)).max(10).optional(),
  page: z.number().min(0).max(1000).optional(),
  size: z.number().min(1).max(100).optional(),
  sort: z.enum(["relevance", "date", "popularity", "price"]).optional(),
})

export const EventCreateSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  category: z.string().min(1).max(100).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  location: z.string().min(1).max(255),
  address: z.string().max(500).optional(),
  coordinates: CoordinatesSchema.optional(),
  price: z
    .object({
      min: z.number().min(0).optional(),
      max: z.number().min(0).optional(),
      currency: z.string().length(3).default("USD"),
    })
    .optional(),
  imageUrl: URLSchema.optional(),
  organizer: z.object({
    name: z.string().min(1).max(255),
    email: EmailSchema.optional(),
    phone: PhoneSchema.optional(),
  }),
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
  ticketLinks: z.array(URLSchema).max(10).optional(),
})

// User validation schemas
export const UserProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: EmailSchema,
  phone: PhoneSchema.optional(),
  location: z
    .object({
      name: z.string().min(1).max(255),
      coordinates: CoordinatesSchema,
    })
    .optional(),
  preferences: z
    .object({
      categories: z.array(z.string()).max(20).optional(),
      priceRange: z.enum(["free", "low", "medium", "high", "any"]).optional(),
      timePreference: z.enum(["morning", "afternoon", "evening", "night", "any"]).optional(),
      radius: z.number().min(1).max(100).optional(),
      notifications: z
        .object({
          email: z.boolean().default(true),
          push: z.boolean().default(true),
          sms: z.boolean().default(false),
        })
        .optional(),
    })
    .optional(),
})

export const UserPreferencesSchema = z.object({
  favoriteCategories: z.array(z.string()).max(20).default([]),
  pricePreference: z.enum(["free", "low", "medium", "high", "any"]).default("any"),
  timePreference: z.enum(["morning", "afternoon", "evening", "night", "any"]).default("any"),
  radiusPreference: z.number().min(1).max(100).default(25),
  notificationSettings: z
    .object({
      email: z.boolean().default(true),
      push: z.boolean().default(true),
      sms: z.boolean().default(false),
      frequency: z.enum(["immediate", "daily", "weekly"]).default("daily"),
    })
    .default({}),
})

// API validation schemas
export const PaginationSchema = z.object({
  page: z.number().min(0).default(0),
  size: z.number().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
})

export const FilterSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(["eq", "ne", "gt", "gte", "lt", "lte", "in", "like", "ilike"]),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
})

// Validation utility functions
export function validateAndTransform<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): {
  success: boolean
  data?: T
  errors?: string[]
} {
  try {
    const result = schema.safeParse(data)

    if (result.success) {
      return {
        success: true,
        data: result.data,
      }
    } else {
      return {
        success: false,
        errors: result.error.errors.map((err) => `${err.path.join(".")}: ${err.message}`),
      }
    }
  } catch (error) {
    return {
      success: false,
      errors: ["Validation failed with unexpected error"],
    }
  }
}

export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (data: unknown) => {
    const result = validateAndTransform(schema, data)
    if (!result.success) {
      throw new Error(`Validation failed: ${result.errors?.join(", ")}`)
    }
    return result.data!
  }
}

// Custom validation helpers
export const isValidEventDate = (date: string): boolean => {
  const eventDate = new Date(date)
  const now = new Date()
  return eventDate > now && eventDate.getFullYear() <= now.getFullYear() + 5
}

export const isValidCoordinates = (lat: number, lng: number): boolean => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

export const sanitizeSearchQuery = (query: string): string => {
  return query
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML
    .replace(/['"]/g, "") // Remove quotes
    .substring(0, 200) // Limit length
}

export const normalizeCategory = (category: string): string => {
  return category
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
}
