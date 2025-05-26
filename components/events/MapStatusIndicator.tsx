"use client"

import { Badge } from "@/components/ui/badge"
import { MapPin, Grid3X3 } from "lucide-react"
import { hasMapboxApiKey } from "@/lib/env"

export function MapStatusIndicator() {
  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Badge
        variant={hasMapboxApiKey ? "default" : "secondary"}
        className={`${
          hasMapboxApiKey ? "bg-green-600 hover:bg-green-700" : "bg-gray-600"
        } text-white shadow-lg backdrop-blur-sm`}
      >
        {hasMapboxApiKey ? (
          <>
            <MapPin className="h-3 w-3 mr-1" />
            Interactive Map
          </>
        ) : (
          <>
            <Grid3X3 className="h-3 w-3 mr-1" />
            Grid View
          </>
        )}
      </Badge>
    </div>
  )
}
