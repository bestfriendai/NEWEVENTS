import { Suspense } from "react"
import { EventsClient } from "./events-client"
import { LocationProvider } from "@/contexts/LocationContext"
import { FavoritesProvider } from "@/contexts/FavoritesContext"

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-[#0F1116]">
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#0F1116] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading events...</p>
            </div>
          </div>
        }
      >
        <LocationProvider>
          <FavoritesProvider>
            <EventsClient />
          </FavoritesProvider>
        </LocationProvider>
      </Suspense>
    </div>
  )
}
