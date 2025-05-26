import { FavoritesProvider } from "@/contexts/FavoritesContext"
import { LocationProvider } from "@/contexts/LocationContext"

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <LocationProvider>
      <FavoritesProvider>
        {children}
      </FavoritesProvider>
    </LocationProvider>
  )
}