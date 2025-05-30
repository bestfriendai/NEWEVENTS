export const MAPBOX_CONFIG = {
  accessToken: process.env.NEXT_PUBLIC_MAPBOX_API_KEY || "",
  defaultStyle: "mapbox://styles/mapbox/dark-v11",
  alternativeStyle: "mapbox://styles/mapbox/streets-v12",
  defaultZoom: 12,
  maxZoom: 18,
  minZoom: 8,
}

export const MAP_STYLES = {
  dark: "mapbox://styles/mapbox/dark-v11",
  light: "mapbox://styles/mapbox/streets-v12",
  satellite: "mapbox://styles/mapbox/satellite-v9",
  outdoors: "mapbox://styles/mapbox/outdoors-v12",
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
