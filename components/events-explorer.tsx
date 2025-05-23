"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

// Dynamically import the MapExplorer component with SSR disabled
const MapExplorer = dynamic(() => import("@/components/map-explorer").then((mod) => mod.MapExplorer), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
      <div className="flex flex-col items-center">
        <Loader2 className="h-12 w-12 text-purple-500 animate-spin mb-4" />
        <p className="text-gray-400">Loading map explorer...</p>
      </div>
    </div>
  ),
})

export function EventsExplorer() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return null
  }

  return <MapExplorer />
}
