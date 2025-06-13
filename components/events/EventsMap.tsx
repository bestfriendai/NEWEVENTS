"use client"

import { cn } from "@/lib/utils"
import type { EventDetailProps } from "@/components/event-detail-modal"
import dynamic from 'next/dynamic'

// Dynamically import the MapboxMap component with no SSR
const MapboxMap = dynamic(
  () => import('@/components/map/MapboxMap'),
  { ssr: false, loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-900">
      <div className="animate-pulse text-gray-500">Loading map...</div>
    </div>
  )}
)

interface EventsMapProps {
  events: EventDetailProps[]
  userLocation: { lat: number; lng: number; name: string } | null
  selectedEvent?: EventDetailProps | null
  onEventSelect?: (event: EventDetailProps) => void
  onError?: (error: string) => void
  className?: string
}

export default function EventsMap({
  events,
  userLocation,
  selectedEvent,
  onEventSelect,
  onError,
  className,
}: EventsMapProps) {
  // Deduplicate events by ID to prevent duplicate key errors
  const deduplicatedEvents = events.reduce<EventDetailProps[]>((acc, event) => {
    if (!acc.some(e => e.id === event.id)) {
      acc.push(event)
    }
    return acc
  }, [])

  return (
    <div className={cn("relative w-full h-full", className)}>
      <MapboxMap
        events={deduplicatedEvents}
        userLocation={userLocation}
        selectedEvent={selectedEvent}
        onEventSelect={onEventSelect}
        onError={onError}
        className="w-full h-full"
      />
    </div>
  )
}
