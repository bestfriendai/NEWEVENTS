"use client"

import { useState, useEffect } from "react"
import { AnimatePresence } from "framer-motion"
import { EventsPageClient } from "./events-page-client"
import { LocationSetupScreen } from "@/components/events/LocationSetupScreen"

export default function EventsPage() {
  const [hasLocation, setHasLocation] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; name: string } | null>(null)

  // Check if user already has a location set (from localStorage or previous session)
  useEffect(() => {
    const savedLocation = localStorage.getItem("dateai-user-location")
    if (savedLocation) {
      try {
        const location = JSON.parse(savedLocation)
        setUserLocation(location)
        setHasLocation(true)
      } catch (e) {
        // Invalid saved location, ignore
      }
    }
  }, [])

  const handleLocationSet = (location: { lat: number; lng: number; name: string }) => {
    setUserLocation(location)
    setHasLocation(true)
    // Save location for future sessions
    localStorage.setItem("dateai-user-location", JSON.stringify(location))
  }

  const handleLocationChange = () => {
    setHasLocation(false)
    localStorage.removeItem("dateai-user-location")
  }

  return (
    <div className="min-h-screen bg-[#0F1116]">
      <AnimatePresence mode="wait">
        {!hasLocation ? (
          <LocationSetupScreen key="location-setup" onLocationSet={handleLocationSet} />
        ) : (
          <EventsPageClient key="events-page" initialLocation={userLocation} onLocationChange={handleLocationChange} />
        )}
      </AnimatePresence>
    </div>
  )
}
