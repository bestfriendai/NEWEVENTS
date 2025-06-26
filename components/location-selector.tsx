"use client"

import { useState } from "react"
import { MapPin, Crosshair, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useLocation } from "@/hooks/use-location"
import { cn } from "@/lib/utils"

interface LocationSelectorProps {
  className?: string
  onLocationChange?: (location: { lat: number; lng: number; city?: string }) => void
}

export function LocationSelector({ className, onLocationChange }: LocationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [manualAddress, setManualAddress] = useState("")
  const { location, isLoading, isLocationEnabled, requestLocation, setManualLocation, clearLocation } = useLocation()

  const handleUseCurrentLocation = async () => {
    await requestLocation()
    setIsOpen(false)
    if (onLocationChange && location) {
      onLocationChange(location)
    }
  }

  const handleSetManualLocation = async () => {
    if (manualAddress.trim()) {
      await setManualLocation(manualAddress)
      setManualAddress("")
      setIsOpen(false)
      if (onLocationChange && location) {
        onLocationChange(location)
      }
    }
  }

  const displayLocation = location.city && location.state 
    ? `${location.city}, ${location.state}`
    : location.city || "Set Location"

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "flex items-center gap-2 border-gray-700 hover:border-purple-500 transition-colors",
            isLocationEnabled && "text-purple-400 border-purple-500/50",
            className
          )}
        >
          <MapPin className="h-4 w-4" />
          <span className="hidden sm:inline">{displayLocation}</span>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-[#1A1D25] border-gray-700">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-white">Set Your Location</h4>
            <p className="text-sm text-gray-400">
              Find events near you by setting your location
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleUseCurrentLocation}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              <Crosshair className="h-4 w-4 mr-2" />
              Use Current Location
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#1A1D25] px-2 text-gray-500">or</span>
              </div>
            </div>

            <div className="space-y-2">
              <Input
                placeholder="Enter city or address"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSetManualLocation()
                  }
                }}
                className="bg-[#0F1116] border-gray-700 text-white"
              />
              <Button
                onClick={handleSetManualLocation}
                disabled={!manualAddress.trim() || isLoading}
                variant="outline"
                className="w-full border-gray-700"
              >
                Set Location
              </Button>
            </div>

            {isLocationEnabled && (
              <Button
                onClick={() => {
                  clearLocation()
                  setIsOpen(false)
                }}
                variant="ghost"
                className="w-full text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Location
              </Button>
            )}
          </div>

          {location && (
            <div className="pt-3 border-t border-gray-700">
              <p className="text-sm text-gray-400">
                Current: <span className="text-white">{displayLocation}</span>
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}