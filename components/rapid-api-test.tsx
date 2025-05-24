"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { searchEvents, getEventDetails } from "@/lib/api/events-api"
import type { EventDetail } from "@/types/event.types"

export function RapidApiTest() {
  const [events, setEvents] = useState<EventDetail[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [eventDetail, setEventDetail] = useState<EventDetail | null>(null)

  const fetchEvents = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await searchEvents({
        keyword: "concert",
        location: "New York",
        page: 0,
        size: 5,
      })
      setEvents(result.events)
    } catch (err) {
      setError("Failed to fetch events: " + (err instanceof Error ? err.message : String(err)))
    } finally {
      setLoading(false)
    }
  }

  const fetchEventDetail = async (eventId: string) => {
    setLoading(true)
    setError(null)
    try {
      const detail = await getEventDetails(eventId)
      setEventDetail(detail)
    } catch (err) {
      setError("Failed to fetch event detail: " + (err instanceof Error ? err.message : String(err)))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>RapidAPI Events Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={fetchEvents} disabled={loading}>
              {loading ? "Loading..." : "Fetch Events"}
            </Button>

            {error && <div className="p-4 bg-red-50 text-red-600 rounded-md">{error}</div>}

            {events.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Events Found: {events.length}</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {events.map((event) => (
                    <Card key={event.id} className="overflow-hidden">
                      <div className="h-48 overflow-hidden relative">
                        <Image
                          src={event.image || "/placeholder.svg"}
                          alt={event.title}
                          fill
                          style={{ objectFit: 'cover' }}
                          sizes="(max-width: 768px) 100vw, 50vw"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "/community-event.png"
                          }}
                        />
                      </div>
                      <CardContent className="p-4">
                        <h4 className="font-bold">{event.title}</h4>
                        <p className="text-sm text-gray-500">
                          {event.date} • {event.time}
                        </p>
                        <p className="text-sm text-gray-500">{event.location}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => fetchEventDetail(event.id.toString())}
                        >
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {eventDetail && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Event Detail</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">{eventDetail.title}</h3>
                    <p className="text-gray-500">
                      {eventDetail.date} • {eventDetail.time}
                    </p>
                    <p className="text-gray-500">{eventDetail.location}</p>
                    <p className="text-gray-500">{eventDetail.address}</p>
                    <p className="text-gray-500">Price: {eventDetail.price}</p>
                    <p className="mt-4">{eventDetail.description}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
