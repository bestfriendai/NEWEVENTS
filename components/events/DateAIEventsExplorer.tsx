"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import type { Event } from "@/types"
import { EventsMap } from "./EventsMap"
import EventsMapFallback from "./EventsMapFallback"

interface DateAIEventsExplorerProps {
  events: Event[]
}

const DateAIEventsExplorer: React.FC<DateAIEventsExplorerProps> = ({ events }) => {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [mapError, setMapError] = useState(false)

  useEffect(() => {
    const getPosition = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            })
          },
          (error) => {
            console.error("Error getting user location:", error)
          },
        )
      } else {
        console.error("Geolocation is not supported by this browser.")
      }
    }

    getPosition()
  }, [])

  useEffect(() => {
    if (date) {
      const formattedDate = format(date, "yyyy-MM-dd")
      const filtered = events.filter((event) => event.date === formattedDate)
      setFilteredEvents(filtered)
    }
  }, [date, events])

  useEffect(() => {
    if (searchTerm) {
      const searchFiltered = events.filter((event) => event.title.toLowerCase().includes(searchTerm.toLowerCase()))
      setFilteredEvents(searchFiltered)
    } else if (date) {
      const formattedDate = format(date, "yyyy-MM-dd")
      const filtered = events.filter((event) => event.date === formattedDate)
      setFilteredEvents(filtered)
    } else {
      setFilteredEvents(events)
    }
  }, [searchTerm, date, events])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Filters Section */}
      <div className="lg:col-span-1">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="space-y-4">
            <h2 className="text-lg font-semibold">Filters</h2>
            <div>
              <Input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map Section */}
      <div className="lg:col-span-2">
        <Card className="bg-white/10 backdrop-blur-md border-white/20 h-96 lg:h-[600px] overflow-hidden">
          <CardContent className="p-0 h-full">
            {mapError ? (
              <EventsMapFallback
                events={filteredEvents}
                selectedEvent={selectedEvent}
                onEventSelect={setSelectedEvent}
              />
            ) : (
              <EventsMap
                events={filteredEvents}
                selectedEvent={selectedEvent}
                onEventSelect={setSelectedEvent}
                onError={() => setMapError(true)}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* List Section */}
      <div className="lg:col-span-1 lg:col-start-1">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent>
            <EventsList events={filteredEvents} selectedEvent={selectedEvent} onEventSelect={setSelectedEvent} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DateAIEventsExplorer
