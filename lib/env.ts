import { logger } from "@/lib/utils/logger"

// Client-side environment variables (prefixed with NEXT_PUBLIC_)
export const clientEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  NEXT_PUBLIC_MAPBOX_API_KEY: process.env.NEXT_PUBLIC_MAPBOX_API_KEY || "",
  NEXT_PUBLIC_PREDICTHQ_API_KEY: process.env.NEXT_PUBLIC_PREDICTHQ_API_KEY || "",
  NEXT_PUBLIC_TICKETMASTER_API_KEY: process.env.NEXT_PUBLIC_TICKETMASTER_API_KEY || "",
  NEXT_PUBLIC_EVENTBRITE_API_KEY: process.env.NEXT_PUBLIC_EVENTBRITE_API_KEY || "",
} as const

// Server-side environment variables (only accessible on server)
export const serverEnv = {
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
  MAPBOX_API_KEY: process.env.MAPBOX_API_KEY || "",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  NODE_ENV: process.env.NODE_ENV || "development",
} as const

// Combined environment for backward compatibility (use with caution)
export const env = {
  ...clientEnv,
  ...serverEnv,
} as const

// API Configuration - MAPBOX ONLY
export const API_CONFIG = {
  ticketmaster: {
    baseUrl: "https://app.ticketmaster.com/discovery/v2",
    apiKey: serverEnv.TICKETMASTER_API_KEY,
  },
  eventbrite: {
    baseUrl: "https://www.eventbriteapi.com/v3",
    apiKey: serverEnv.EVENTBRITE_API_KEY,
    privateToken: serverEnv.EVENTBRITE_PRIVATE_TOKEN,
  },
  rapidapi: {
    baseUrl: "https://real-time-events-search.p.rapidapi.com",
    apiKey: serverEnv.RAPIDAPI_KEY,
    host: serverEnv.RAPIDAPI_HOST,
    key: serverEnv.RAPIDAPI_KEY,
  },
  predicthq: {
    baseUrl: "https://api.predicthq.com/v1",
    apiKey: serverEnv.PREDICTHQ_API_KEY,
  },
  tomtom: {
    baseUrl: "https://api.tomtom.com",
    apiKey: serverEnv.TOMTOM_API_KEY,
  },
  maps: {
    mapbox: {
      apiKey: serverEnv.MAPBOX_API_KEY,
      clientApiKey: clientEnv.NEXT_PUBLIC_MAPBOX_API_KEY,
      baseUrl: "https://api.mapbox.com",
      geocodingUrl: "https://api.mapbox.com/geocoding/v5/mapbox.places",
      stylesUrl: "https://api.mapbox.com/styles/v1",
      tilesUrl: "https://api.mapbox.com/v4",
    },
  },
  supabase: {
    url: clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
    mapbox: {
      baseUrl: API_CONFIG.maps.mapbox.baseUrl,
      apiKey: API_CONFIG.maps.mapbox.apiKey,
      geocodingUrl: API_CONFIG.maps.mapbox.geocodingUrl,
    },
    supabase: {
      url: API_CONFIG.supabase.url,
      anonKey: API_CONFIG.supabase.anonKey,
    },
  }
}

// Client configuration function for client-side usage
export function getClientConfig() {
  return {
    supabase: {
      url: clientEnv.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    mapbox: {
      apiKey: clientEnv.NEXT_PUBLIC_MAPBOX_API_KEY,
      baseUrl: API_CONFIG.maps.mapbox.baseUrl,
      geocodingUrl: API_CONFIG.maps.mapbox.geocodingUrl,
    },
    predicthq: {
      apiKey: clientEnv.NEXT_PUBLIC_PREDICTHQ_API_KEY,
    },
    ticketmaster: {
      apiKey: clientEnv.NEXT_PUBLIC_TICKETMASTER_API_KEY,
    },
    eventbrite: {
      apiKey: clientEnv.NEXT_PUBLIC_EVENTBRITE_API_KEY,
    },
  }
}

// Validated environment configuration
export const CLIENT_CONFIG = getClientConfig()

// Validate required environment variables
export function validateEnv() {
  const requiredClientVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_MAPBOX_API_KEY",
  ] as const

  const requiredServerVars = [] as const // Optional server vars

  const missingClient = requiredClientVars.filter((key) => !clientEnv[key])
  const missingServer = requiredServerVars.filter((key) => !serverEnv[key])

  const missing = [...missingClient, ...missingServer]

  if (missing.length > 0) {
    logger.warn(`Missing environment variables: ${missing.join(", ")}`, {
      component: "Environment",
      action: "validateEnv",
      metadata: { missing, missingClient, missingServer },
    })
  }

  return {
    isValid: missing.length === 0,
    missing,
    missingClient,
    missingServer,
  }
}

// Helper functions to check API key availability
export function hasMapboxApiKey(): boolean {
  return !!(serverEnv.MAPBOX_API_KEY || clientEnv.NEXT_PUBLIC_MAPBOX_API_KEY)
}

export function hasTicketmasterApiKey(): boolean {
  return !!serverEnv.TICKETMASTER_API_KEY
}

export function hasEventbriteApiKey(): boolean {
  return !!(serverEnv.EVENTBRITE_PRIVATE_TOKEN || serverEnv.EVENTBRITE_API_KEY)
}

export function hasPredictHQApiKey(): boolean {
  return !!(serverEnv.PREDICTHQ_API_KEY || clientEnv.NEXT_PUBLIC_PREDICTHQ_API_KEY)
}

export function hasRapidApiKey(): boolean {
  return !!serverEnv.RAPIDAPI_KEY
}

export function hasTomTomApiKey(): boolean {
  return !!serverEnv.TOMTOM_API_KEY
}

// Validated environment configuration
export function getValidatedEnv() {
  const validation = validateEnv()

  if (!validation.isValid) {
    const errorMessage = `Environment validation failed:\n${validation.missing.map((key) => `${key}: Required`).join("\n")}`

    // In development, just warn instead of throwing
    if (typeof window === "undefined" && serverEnv.NODE_ENV === "development") {
      logger.warn(errorMessage, {
        component: "Environment",
        action: "getValidatedEnv",
        metadata: { context: "development_server" },
      })
      return API_CONFIG
    }

    // Don't throw on client side
    if (typeof window !== "undefined") {
      logger.warn(errorMessage, {
        component: "Environment",
        action: "getValidatedEnv",
        metadata: { context: "client_side" },
      })
      return API_CONFIG
    }

    throw new Error(errorMessage)
  }

  return API_CONFIG
}

// Export the validated config as default
export default getValidatedEnv()
