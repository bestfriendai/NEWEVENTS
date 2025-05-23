"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, AlertCircle, MapPin, Calendar, Clock, ExternalLink, Search, Info } from "lucide-react"
import { searchEvents, getEventDetails } from "@/lib/api/events-api"
import type { EventDetailProps } from "@/components/event-detail-modal"

export function EnhancedRapidApiTest() {
  const [searchKeyword, setSearchKeyword] = useState("")
  const [searchLocation, setSearchLocation] = useState("")
  const [eventId, setEventId] = useState("")
  const [searchResults, setSearchResults] = useState<EventDetailProps[]>([])
  const [eventDetail, setEventDetail] = useState<EventDetailProps | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isFetchingDetail, setIsFetchingDetail] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [apiResponse, setApiResponse] = useState<any>(null)

  // Function to search for events
  const handleSearch = async () => {
    setIsSearching(true)
    setError(null)
    setSearchResults([])
    setApiResponse(null)

    try {
      const result = await searchEvents({
        keyword: searchKeyword,
        location: searchLocation,
        radius: 50,
        size: 10,
      })

      console.log("Search results:", result)
      setSearchResults(result.events)

      // Store the raw API response for debugging
      setApiResponse({
        totalCount: result.totalCount,
        page: result.page,
        totalPages: result.totalPages,
        events: result.events,
      })

      if (result.events.length === 0) {
        setError("No events found. Try different search terms.")
      }
    } catch (err) {
      console.error("Error searching events:", err)
      setError(`Error searching events: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsSearching(false)
    }
  }

  // Function to get event details
  const handleGetEventDetail = async () => {
    if (!eventId) {
      setDetailError("Please enter an event ID")
      return
    }

    setIsFetchingDetail(true)
    setDetailError(null)
    setEventDetail(null)

    try {
      const result = await getEventDetails(eventId)
      console.log("Event detail:", result)

      if (result) {
        setEventDetail(result)
      } else {
        setDetailError("Event not found or error retrieving event details")
      }
    } catch (err) {
      console.error("Error getting event detail:", err)
      setDetailError(`Error getting event detail: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsFetchingDetail(false)
    }
  }

  // Function to make a direct API call for testing
  const handleDirectApiCall = async () => {
    setIsSearching(true)
    setError(null)
    setApiResponse(null)

    try {
      // Build the URL for the API call
      const baseUrl = "https://real-time-events-search.p.rapidapi.com/search-events"
      const queryParams = new URLSearchParams()

      if (searchKeyword) queryParams.append("query", searchKeyword)
      if (searchLocation) queryParams.append("location", searchLocation)
      queryParams.append("radius", "50mi")
      queryParams.append("limit", "10")

      // Make the API call
      const response = await fetch(`${baseUrl}?${queryParams.toString()}`, {
        headers: {
          "x-rapidapi-key": "92bc1b4fc7mshacea9f118bf7a3fp1b5a6cjsnd2287a72fcb9",
          "x-rapidapi-host": "real-time-events-search.p.rapidapi.com",
        },
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Direct API response:", data)
      setApiResponse(data)

      // Process the events if available
      if (data.status === "OK" && data.data) {
        // If data.data is an array of events
        if (Array.isArray(data.data)) {
          setSearchResults(data.data)
        }
        // If data.data contains events in a nested structure
        else if (data.data.events && Array.isArray(data.data.events)) {
          setSearchResults(data.data.events)
        }
        // If it's a single event wrapped in data
        else {
          setSearchResults([data.data])
        }
      } else {
        setError("No events found or invalid API response format")
      }
    } catch (err) {
      console.error("Error making direct API call:", err)
      setError(`Error making direct API call: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">RapidAPI Events Integration Test</h1>
      <p className="text-gray-500 mb-8">
        This page tests the integration with the RapidAPI Events API, showing real data only.
      </p>

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="search">Search Events</TabsTrigger>
          <TabsTrigger value="detail">Event Detail</TabsTrigger>
          <TabsTrigger value="direct">Direct API Call</TabsTrigger>
        </TabsList>

        {/* Search Events Tab */}
        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle>Search Events</CardTitle>
              <CardDescription>Search for events by keyword and location</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="keyword" className="text-sm font-medium">
                      Keyword
                    </label>
                    <Input
                      id="keyword"
                      placeholder="e.g., concert, festival"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="location" className="text-sm font-medium">
                      Location
                    </label>
                    <Input
                      id="location"
                      placeholder="e.g., New York, Los Angeles"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSearch} disabled={isSearching} className="w-full">
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search Events
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Error message */}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Search Results</h2>
              <p className="text-gray-500 mb-4">Found {searchResults.length} events</p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((event, index) => (
                  <Card key={index} className="overflow-hidden">
                    <div className="h-48 overflow-hidden">
                      <img
                        src={event.image || "/community-event.png"}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <Badge>{event.category}</Badge>
                      </div>
                      <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-2">
                      <div className="flex items-center text-sm">
                        <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{event.time}</span>
                      </div>
                      {event.coordinates && (
                        <div className="text-xs text-gray-500 mt-2">
                          Coordinates: {event.coordinates.lat.toFixed(6)}, {event.coordinates.lng.toFixed(6)}
                        </div>
                      )}
                      {event.ticketLinks && event.ticketLinks.length > 0 && (
                        <div className="mt-2">
                          <div className="text-sm font-medium mb-1">Ticket Links:</div>
                          <div className="space-y-1">
                            {event.ticketLinks.slice(0, 2).map((link, i) => (
                              <a
                                key={i}
                                href={link.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-xs text-blue-500 hover:text-blue-700"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                {link.source}
                              </a>
                            ))}
                            {event.ticketLinks.length > 2 && (
                              <div className="text-xs text-gray-500">+{event.ticketLinks.length - 2} more</div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* API Response Debug */}
          {apiResponse && (
            <div className="mt-8">
              <Separator className="my-4" />
              <h3 className="text-xl font-bold mb-2">API Response Debug</h3>
              <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
                <pre className="text-xs">{JSON.stringify(apiResponse, null, 2)}</pre>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Event Detail Tab */}
        <TabsContent value="detail">
          <Card>
            <CardHeader>
              <CardTitle>Get Event Detail</CardTitle>
              <CardDescription>Retrieve details for a specific event by ID</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <label htmlFor="eventId" className="text-sm font-medium">
                  Event ID
                </label>
                <Input
                  id="eventId"
                  placeholder="Enter event ID"
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Example: 1234567890, event_id_12345, etc. (The exact format depends on the API)
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleGetEventDetail} disabled={isFetchingDetail} className="w-full">
                {isFetchingDetail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <Info className="mr-2 h-4 w-4" />
                    Get Event Detail
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Error message */}
          {detailError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{detailError}</AlertDescription>
            </Alert>
          )}

          {/* Event detail */}
          {eventDetail && (
            <div className="mt-8">
              <Card>
                <div className="md:flex">
                  <div className="md:w-1/3">
                    <img
                      src={eventDetail.image || "/community-event.png"}
                      alt={eventDetail.title}
                      className="w-full h-64 object-cover"
                    />
                  </div>
                  <div className="md:w-2/3 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="text-2xl font-bold">{eventDetail.title}</h2>
                      <Badge>{eventDetail.category}</Badge>
                    </div>

                    <div className="space-y-4">
                      <p className="text-gray-700">{eventDetail.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                            <span className="text-sm">{eventDetail.date}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-gray-500" />
                            <span className="text-sm">{eventDetail.time}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                            <span className="text-sm">{eventDetail.location}</span>
                          </div>
                          <div className="text-sm text-gray-700">{eventDetail.address}</div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-medium">Organizer:</div>
                          <div className="flex items-center">
                            <img
                              src={eventDetail.organizer.avatar || "/placeholder.svg"}
                              alt={eventDetail.organizer.name}
                              className="w-6 h-6 rounded-full mr-2"
                            />
                            <span className="text-sm">{eventDetail.organizer.name}</span>
                          </div>
                          <div className="text-sm font-medium">Price:</div>
                          <div className="text-sm">{eventDetail.price}</div>
                          {eventDetail.coordinates && (
                            <div className="text-xs text-gray-500 mt-2">
                              Coordinates: {eventDetail.coordinates.lat.toFixed(6)},{" "}
                              {eventDetail.coordinates.lng.toFixed(6)}
                            </div>
                          )}
                        </div>
                      </div>

                      {eventDetail.ticketLinks && eventDetail.ticketLinks.length > 0 && (
                        <div>
                          <div className="text-sm font-medium mb-2">Ticket Links:</div>
                          <div className="space-y-2">
                            {eventDetail.ticketLinks.map((link, i) => (
                              <a
                                key={i}
                                href={link.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-blue-500 hover:text-blue-700"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                {link.source}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Debug information */}
              <div className="mt-4">
                <Separator className="my-4" />
                <h3 className="text-xl font-bold mb-2">Event Detail Debug</h3>
                <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
                  <pre className="text-xs">{JSON.stringify(eventDetail, null, 2)}</pre>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Direct API Call Tab */}
        <TabsContent value="direct">
          <Card>
            <CardHeader>
              <CardTitle>Direct API Call</CardTitle>
              <CardDescription>Make a direct call to the RapidAPI endpoint</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="direct-keyword" className="text-sm font-medium">
                      Keyword
                    </label>
                    <Input
                      id="direct-keyword"
                      placeholder="e.g., concert, festival"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="direct-location" className="text-sm font-medium">
                      Location
                    </label>
                    <Input
                      id="direct-location"
                      placeholder="e.g., New York, Los Angeles"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleDirectApiCall} disabled={isSearching} className="w-full">
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Calling API...
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Make Direct API Call
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Error message */}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* API Response Debug */}
          {apiResponse && (
            <div className="mt-8">
              <h3 className="text-xl font-bold mb-2">Raw API Response</h3>
              <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
                <pre className="text-xs">{JSON.stringify(apiResponse, null, 2)}</pre>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
