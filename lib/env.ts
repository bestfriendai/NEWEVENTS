import { z } from 'zod'

// Environment schema for validation
const envSchema = z.object({
  // Public environment variables (available on client)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  
  // Server-side only environment variables
  RAPIDAPI_KEY: z.string().min(1, 'RapidAPI key is required'),
  RAPIDAPI_HOST: z.string().default('real-time-events-search.p.rapidapi.com'),
  TICKETMASTER_API_KEY: z.string().min(1, 'Ticketmaster API key is required'),
  TICKETMASTER_SECRET: z.string().optional(),
  TOMTOM_API_KEY: z.string().min(1, 'TomTom API key is required'),
  
  // Optional API keys
  EVENTBRITE_API_KEY: z.string().optional(),
  EVENTBRITE_CLIENT_SECRET: z.string().optional(),
  EVENTBRITE_PRIVATE_TOKEN: z.string().optional(),
  EVENTBRITE_PUBLIC_TOKEN: z.string().optional(),
  PREDICTHQ_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  
  // Application settings
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

// Parse and validate environment variables
function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n')
      throw new Error(`Environment validation failed:\n${missingVars}`)
    }
    throw error
  }
}

// Export validated environment variables
export const env = validateEnv()

// Legacy exports for backward compatibility (will be deprecated)
export const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
export const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
export const RAPIDAPI_KEY = env.RAPIDAPI_KEY
export const RAPIDAPI_HOST = env.RAPIDAPI_HOST
export const TICKETMASTER_API_KEY = env.TICKETMASTER_API_KEY
export const TICKETMASTER_SECRET = env.TICKETMASTER_SECRET
export const TOMTOM_API_KEY = env.TOMTOM_API_KEY
export const EVENTBRITE_API_KEY = env.EVENTBRITE_API_KEY
export const EVENTBRITE_CLIENT_SECRET = env.EVENTBRITE_CLIENT_SECRET
export const EVENTBRITE_PRIVATE_TOKEN = env.EVENTBRITE_PRIVATE_TOKEN
export const EVENTBRITE_PUBLIC_TOKEN = env.EVENTBRITE_PUBLIC_TOKEN
export const PREDICTHQ_API_KEY = env.PREDICTHQ_API_KEY
export const OPENROUTER_API_KEY = env.OPENROUTER_API_KEY

// API availability checks
export const hasTicketmasterApiKey = !!env.TICKETMASTER_API_KEY
export const hasEventbriteApiKey = !!env.EVENTBRITE_API_KEY
export const hasPredictHQApiKey = !!env.PREDICTHQ_API_KEY
export const hasMapboxApiKey = false // Mapbox not configured
export const hasTomTomApiKey = !!env.TOMTOM_API_KEY
export const hasRapidApiKey = !!env.RAPIDAPI_KEY

// Default API provider
export const DEFAULT_API_PROVIDER = "rapidapi"

// API configuration
export const API_CONFIG = {
  ticketmaster: {
    baseUrl: "https://app.ticketmaster.com/discovery/v2",
    apiKey: env.TICKETMASTER_API_KEY,
    secret: env.TICKETMASTER_SECRET,
  },
  eventbrite: {
    baseUrl: "https://www.eventbriteapi.com/v3",
    apiKey: env.EVENTBRITE_API_KEY,
    clientSecret: env.EVENTBRITE_CLIENT_SECRET,
    privateToken: env.EVENTBRITE_PRIVATE_TOKEN,
    publicToken: env.EVENTBRITE_PUBLIC_TOKEN,
  },
  predicthq: {
    baseUrl: "https://api.predicthq.com/v1",
    apiKey: env.PREDICTHQ_API_KEY,
  },
  rapidapi: {
    baseUrl: "https://real-time-events-search.p.rapidapi.com",
    apiKey: env.RAPIDAPI_KEY,
    host: env.RAPIDAPI_HOST,
  },
  maps: {
    mapbox: {
      apiKey: null, // Not configured
    },
    tomtom: {
      apiKey: env.TOMTOM_API_KEY,
    },
  },
} as const

// Development logging (only in development)
if (env.NODE_ENV === 'development') {
  console.log("🔧 API Configuration Status:")
  console.log("- Supabase:", env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Configured" : "❌ Missing")
  console.log("- RapidAPI:", hasRapidApiKey ? "✅ Configured" : "❌ Missing")
  console.log("- Ticketmaster:", hasTicketmasterApiKey ? "✅ Configured" : "❌ Missing")
  console.log("- TomTom Maps:", hasTomTomApiKey ? "✅ Configured" : "❌ Missing")
  console.log("- Eventbrite:", hasEventbriteApiKey ? "✅ Configured" : "⚠️ Optional")
  console.log("- PredictHQ:", hasPredictHQApiKey ? "✅ Configured" : "⚠️ Optional")
}
