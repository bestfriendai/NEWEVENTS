export const MAPBOX_CONFIG = {
  // Use environment variable for access token
  accessToken: process.env.NEXT_PUBLIC_MAPBOX_API_KEY || "",

  // Map styles
  defaultStyle: "mapbox://styles/mapbox/dark-v11",
  alternativeStyle: "mapbox://styles/mapbox/streets-v12",

  // Map settings
  defaultZoom: 12,
  maxZoom: 18,
  minZoom: 8,

  // API endpoints
  baseUrl: "https://api.mapbox.com",
  geocodingUrl: "https://api.mapbox.com/geocoding/v5/mapbox.places",
  stylesUrl: "https://api.mapbox.com/styles/v1",
  tilesUrl: "https://api.mapbox.com/v4",

  // Rate limiting
  rateLimitPerSecond: 600, // Mapbox allows 600 requests per minute
  rateLimitPerMonth: 50000, // Adjust based on your plan
}

export const MAP_STYLES = {
  dark: "mapbox://styles/mapbox/dark-v11",
  light: "mapbox://styles/mapbox/streets-v12",
  satellite: "mapbox://styles/mapbox/satellite-v9",
  outdoors: "mapbox://styles/mapbox/outdoors-v12",
  navigation: "mapbox://styles/mapbox/navigation-day-v1",
  navigationNight: "mapbox://styles/mapbox/navigation-night-v1",
}

export const MARKER_COLORS = {
  music: "from-purple-600 to-blue-600",
  arts: "from-pink-600 to-rose-600",
  sports: "from-green-600 to-emerald-600",
  food: "from-orange-600 to-red-600",
  business: "from-gray-600 to-slate-600",
  education: "from-blue-600 to-cyan-600",
  nightlife: "from-yellow-600 to-orange-600",
  default: "from-purple-500 to-pink-500",
}

// Mapbox feature flags
export const MAPBOX_FEATURES = {
  geocoding: true,
  directions: true,
  staticMaps: true,
  tilesets: true,
  styles: true,
}

// Validate Mapbox configuration
export function validateMapboxConfig(): boolean {
  const hasToken = !!MAPBOX_CONFIG.accessToken

  if (!hasToken) {
    console.warn("Mapbox API key not found. Please set NEXT_PUBLIC_MAPBOX_API_KEY environment variable.")
    return false
  }

  return true
}

// Get Mapbox configuration for client use
export function getMapboxConfig() {
  return {
    ...MAPBOX_CONFIG,
    isValid: validateMapboxConfig(),
  }
}
