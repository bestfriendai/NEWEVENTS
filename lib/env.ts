import { z } from 'zod'

// Helper function to create conditional validation based on environment
const createApiKeySchema = (name: string, required: boolean = false) => {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  if (required || !isDevelopment) {
    // Required in production or when explicitly marked as required
    return z.string().min(1, `${name} is required`)
  } else {
    // Optional in development - allow placeholder values
    return z.string().optional().or(z.string().startsWith('dev-placeholder-').optional())
  }
}

// Environment schema for validation
const envSchema = z.object({
  // Public environment variables (always required)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  
  // Server-side API keys - required in production, optional in development
  RAPIDAPI_KEY: createApiKeySchema('RapidAPI key'),
  RAPIDAPI_HOST: z.string().default('real-time-events-search.p.rapidapi.com'),
  TICKETMASTER_API_KEY: createApiKeySchema('Ticketmaster API key'),
  TICKETMASTER_SECRET: z.string().optional(),
  TOMTOM_API_KEY: createApiKeySchema('TomTom API key'),
  MAPBOX_API_KEY: createApiKeySchema('Mapbox API key'),
  
  // Optional API keys (always optional)
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
export const MAPBOX_API_KEY = env.MAPBOX_API_KEY
export const EVENTBRITE_API_KEY = env.EVENTBRITE_API_KEY
export const EVENTBRITE_CLIENT_SECRET = env.EVENTBRITE_CLIENT_SECRET
export const EVENTBRITE_PRIVATE_TOKEN = env.EVENTBRITE_PRIVATE_TOKEN
export const EVENTBRITE_PUBLIC_TOKEN = env.EVENTBRITE_PUBLIC_TOKEN
export const PREDICTHQ_API_KEY = env.PREDICTHQ_API_KEY
export const OPENROUTER_API_KEY = env.OPENROUTER_API_KEY

// Helper function to check if API key is valid (not a placeholder)
const isValidApiKey = (key: string | undefined): boolean => {
  return !!(key && !key.startsWith('dev-placeholder-') && key !== 'your-' && key.length > 10)
}

// API availability checks
export const hasTicketmasterApiKey = isValidApiKey(env.TICKETMASTER_API_KEY)
export const hasEventbriteApiKey = isValidApiKey(env.EVENTBRITE_API_KEY)
export const hasPredictHQApiKey = isValidApiKey(env.PREDICTHQ_API_KEY)
export const hasMapboxApiKey = isValidApiKey(env.MAPBOX_API_KEY)
export const hasTomTomApiKey = isValidApiKey(env.TOMTOM_API_KEY)
export const hasRapidApiKey = isValidApiKey(env.RAPIDAPI_KEY)

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
      apiKey: env.MAPBOX_API_KEY,
    },
    tomtom: {
      apiKey: env.TOMTOM_API_KEY,
    },
  },
} as const

// Development logging (only in development)
if (env.NODE_ENV === 'development') {
  // console.log("🔧 API Configuration Status:")
  
  // Required services
  const supabaseConfigured = env.NEXT_PUBLIC_SUPABASE_URL && !env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project')
  // console.log("- Supabase:", supabaseConfigured ? "✅ Configured" : "⚠️ Using placeholder (update required)")
  
  // API services with placeholder detection
  // console.log("- RapidAPI:", hasRapidApiKey ? "✅ Configured" : "⚠️ Using placeholder")
  // console.log("- Ticketmaster:", hasTicketmasterApiKey ? "✅ Configured" : "⚠️ Using placeholder")
  // console.log("- TomTom Maps:", hasTomTomApiKey ? "✅ Configured" : "⚠️ Using placeholder")
  // console.log("- Mapbox Maps:", hasMapboxApiKey ? "✅ Configured" : "⚠️ Using placeholder")
  
  // Optional services
  // console.log("- Eventbrite:", hasEventbriteApiKey ? "✅ Configured" : "⚠️ Optional")
  // console.log("- PredictHQ:", hasPredictHQApiKey ? "✅ Configured" : "⚠️ Optional")
  
  if (!supabaseConfigured) {
    // console.log("\n🚨 Important: Update Supabase credentials in .env for database functionality")
  }
  
  const placeholderCount = [hasRapidApiKey, hasTicketmasterApiKey, hasTomTomApiKey, hasMapboxApiKey].filter(Boolean).length
  if (placeholderCount < 4) {
    // console.log(`\n💡 ${4 - placeholderCount} API key(s) using placeholders - some features may not work`)
    // console.log("   Replace placeholder values in .env with real API keys when needed")
  }
}
