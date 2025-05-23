// Environment variables for the application
// Note: Using a placeholder Mapbox key - replace with valid key for production
export const MAPBOX_API_KEY = null // Set to null to trigger fallback geocoding

// RapidAPI configuration - using the exact values provided
export const RAPIDAPI_KEY = "92bc1b4fc7mshacea9f118bf7a3fp1b5a6cjsnd2287a72fcb9"
export const RAPIDAPI_HOST = "real-time-events-search.p.rapidapi.com"

// Ticketmaster API configuration
export const TICKETMASTER_API_KEY = "DpUgBswNV5hHthFyjKK5M5lN3PSLZNU9"

// Eventbrite API configuration
export const EVENTBRITE_API_KEY = process.env.NEXT_PUBLIC_EVENTBRITE_API_KEY || "YJH4KGIHRNHOKODPZD"

// PredictHQ API configuration
export const PREDICTHQ_API_KEY = process.env.NEXT_PUBLIC_PREDICTHQ_API_KEY || "Pbax0yFsCfXX8OfpC_-wnk3aqPP_JKb2rROBuE5s"

export const TICKETMASTER_SECRET = "H1dYvpxiiaTgJow5"

export const EVENTBRITE_CLIENT_SECRET = "QGVOJ2QGDI2TMBZKOW5IKKPMZOVP6FA2VXLNGWSI4FP43BNLSQ"
export const EVENTBRITE_PRIVATE_TOKEN = "EUB5KUFLJH2SKVCHVD3E"
export const EVENTBRITE_PUBLIC_TOKEN = "C4WQAR3XB7XX2AYOUEQ4"

// Supabase credentials
export const SUPABASE_URL = "https://hayrbdzsglfmidwrlawu.supabase.co"
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhheXJiZHpzZ2xmbWlkd3JsYXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NzYwNjcsImV4cCI6MjA1OTA1MjA2N30.AfBRE4xY4TIMWndtxnXyyOqlV9l8BpNHbTHeZbVXpxU"

// OpenRouter API key
export const OPENROUTER_API_KEY = "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"

// Check if API keys are available
export const hasTicketmasterApiKey = true
export const hasEventbriteApiKey = !!EVENTBRITE_API_KEY
export const hasPredictHQApiKey = !!PREDICTHQ_API_KEY
export const hasMapboxApiKey = false // Set to false since we're using fallback
export const TOMTOM_API_KEY = "L6x6moNiYg0RSomE2RmDEqS8KW1pFBKz"
export const hasTomTomApiKey = true
export const hasRapidApiKey = true // We have a hardcoded key now

// Default API provider - only use RapidAPI
export const DEFAULT_API_PROVIDER = "rapidapi"

// API configuration
export const API_CONFIG = {
  ticketmaster: {
    baseUrl: "https://app.ticketmaster.com/discovery/v2",
    apiKey: TICKETMASTER_API_KEY,
    secret: TICKETMASTER_SECRET,
  },
  eventbrite: {
    baseUrl: "https://www.eventbriteapi.com/v3",
    apiKey: EVENTBRITE_API_KEY,
    clientSecret: EVENTBRITE_CLIENT_SECRET,
    privateToken: EVENTBRITE_PRIVATE_TOKEN,
    publicToken: EVENTBRITE_PUBLIC_TOKEN,
  },
  predicthq: {
    baseUrl: "https://api.predicthq.com/v1",
    apiKey: PREDICTHQ_API_KEY,
  },
  rapidapi: {
    baseUrl: "https://real-time-events-search.p.rapidapi.com",
    apiKey: RAPIDAPI_KEY,
    host: RAPIDAPI_HOST,
  },
  maps: {
    mapbox: {
      apiKey: MAPBOX_API_KEY,
    },
    tomtom: {
      apiKey: TOMTOM_API_KEY,
    },
  },
}

// Log configuration for debugging (only in development)
if (process.env.NODE_ENV === "development") {
  console.log("API Configuration Debug:")
  console.log("- Mapbox API Key:", hasMapboxApiKey ? "Present" : "Using Fallback Geocoding")
  console.log("- RapidAPI Key:", hasRapidApiKey ? "Present" : "Missing")
  console.log("- RapidAPI Host:", RAPIDAPI_HOST)
}
