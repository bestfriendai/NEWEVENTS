// Environment variables validation
export const env = {
  NEXT_PUBLIC_MAPBOX_API_KEY: process.env.NEXT_PUBLIC_MAPBOX_API_KEY || "",
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  NEXT_PUBLIC_TICKETMASTER_API_KEY: process.env.NEXT_PUBLIC_TICKETMASTER_API_KEY || "",
  NEXT_PUBLIC_EVENTBRITE_API_KEY: process.env.NEXT_PUBLIC_EVENTBRITE_API_KEY || "",
  NEXT_PUBLIC_PREDICTHQ_API_KEY: process.env.NEXT_PUBLIC_PREDICTHQ_API_KEY || "",
  RAPIDAPI_KEY: process.env.RAPIDAPI_KEY || "",
  RAPIDAPI_HOST: process.env.RAPIDAPI_HOST || "real-time-events-search.p.rapidapi.com",
  TOMTOM_API_KEY: process.env.TOMTOM_API_KEY || "",
  TICKETMASTER_API_KEY: process.env.TICKETMASTER_API_KEY || "",
  TICKETMASTER_SECRET: process.env.TICKETMASTER_SECRET || "",
  EVENTBRITE_API_KEY: process.env.EVENTBRITE_API_KEY || "",
  EVENTBRITE_CLIENT_SECRET: process.env.EVENTBRITE_CLIENT_SECRET || "",
  EVENTBRITE_PRIVATE_TOKEN: process.env.EVENTBRITE_PRIVATE_TOKEN || "",
  EVENTBRITE_PUBLIC_TOKEN: process.env.EVENTBRITE_PUBLIC_TOKEN || "",
  PREDICTHQ_API_KEY: process.env.PREDICTHQ_API_KEY || "",
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
} as const

// API Configuration for server-side usage
export const API_CONFIG = {
  ticketmaster: {
    baseUrl: "https://app.ticketmaster.com/discovery/v2",
    apiKey: env.TICKETMASTER_API_KEY || env.NEXT_PUBLIC_TICKETMASTER_API_KEY,
  },
  eventbrite: {
    baseUrl: "https://www.eventbriteapi.com/v3",
    apiKey: env.EVENTBRITE_API_KEY || env.NEXT_PUBLIC_EVENTBRITE_API_KEY,
    privateToken: env.EVENTBRITE_PRIVATE_TOKEN,
  },
  rapidapi: {
    baseUrl: "https://real-time-events-search.p.rapidapi.com",
    apiKey: env.RAPIDAPI_KEY,
    host: env.RAPIDAPI_HOST,
    key: env.RAPIDAPI_KEY, // Alias for compatibility
  },
  predicthq: {
    baseUrl: "https://api.predicthq.com/v1",
    apiKey: env.PREDICTHQ_API_KEY || env.NEXT_PUBLIC_PREDICTHQ_API_KEY,
  },
  tomtom: {
    baseUrl: "https://api.tomtom.com",
    apiKey: env.TOMTOM_API_KEY,
  },
  maps: {
    mapbox: {
      apiKey: env.NEXT_PUBLIC_MAPBOX_API_KEY,
    },
    tomtom: {
      apiKey: env.TOMTOM_API_KEY,
    },
  },
  supabase: {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
} as const

// Server configuration function for API routes
export function getServerConfig() {
  return {
    ticketmaster: {
      baseUrl: API_CONFIG.ticketmaster.baseUrl,
      apiKey: API_CONFIG.ticketmaster.apiKey,
    },
    eventbrite: {
      baseUrl: API_CONFIG.eventbrite.baseUrl,
      apiKey: API_CONFIG.eventbrite.apiKey,
      privateToken: API_CONFIG.eventbrite.privateToken,
    },
    rapidapi: {
      baseUrl: API_CONFIG.rapidapi.baseUrl,
      apiKey: API_CONFIG.rapidapi.apiKey,
      host: API_CONFIG.rapidapi.host,
    },
    predicthq: {
      baseUrl: API_CONFIG.predicthq.baseUrl,
      apiKey: API_CONFIG.predicthq.apiKey,
    },
    tomtom: {
      baseUrl: API_CONFIG.tomtom.baseUrl,
      apiKey: API_CONFIG.tomtom.apiKey,
    },
    supabase: {
      url: API_CONFIG.supabase.url,
      anonKey: API_CONFIG.supabase.anonKey,
    },
  }
}

// Validate required environment variables
export function validateEnv() {
  const requiredVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const

  const missing = requiredVars.filter((key) => !env[key])

  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(", ")}`)
  }

  return {
    isValid: missing.length === 0,
    missing,
  }
}

// Validated environment configuration
export function getValidatedEnv() {
  const validation = validateEnv()
  
  if (!validation.isValid) {
    const errorMessage = `Environment validation failed:\n${validation.missing.map(key => `${key}: Required`).join('\n')}`
    
    // In development, just warn instead of throwing
    if (process.env.NODE_ENV === 'development') {
      console.warn(errorMessage)
      return API_CONFIG
    }
    
    throw new Error(errorMessage)
  }
  
  return API_CONFIG
}

// Export the validated config as default
export default getValidatedEnv()
