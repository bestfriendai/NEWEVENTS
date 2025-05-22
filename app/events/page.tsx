import { AppLayout } from "@/components/app-layout"
import { EventCard } from "@/components/event-card"
import { DateRangePicker } from "@/components/date-range-picker"
import { fetchEvents } from "@/app/actions/event-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Search, MapPin, Filter } from "lucide-react"

interface EventsPageProps {
  searchParams: {
    keyword?: string
    location?: string
    category?: string
    page?: string
  }
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const { keyword, location, category, page = "1" } = searchParams

  // Fetch events based on search parameters
  const {
    events,
    totalCount,
    page: currentPage,
    totalPages,
  } = await fetchEvents({
    keyword,
    location,
    categories: category ? [category] : undefined,
    page: Number.parseInt(page),
    size: 12,
  })

  // Categories for filter
  const categories = [
    { id: "music", label: "Music" },
    { id: "sports", label: "Sports" },
    { id: "arts", label: "Arts & Theater" },
    { id: "family", label: "Family" },
    { id: "comedy", label: "Comedy" },
    { id: "food", label: "Food & Drink" },
  ]

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-6">Discover Events</h1>

        {/* Search Bar */}
        <div className="bg-[#1A1D25]/80 backdrop-blur-md p-4 rounded-xl shadow-glow-sm mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search events..."
                defaultValue={keyword}
                className="w-full pl-10 pr-4 py-3 bg-[#22252F] border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Location"
                defaultValue={location}
                className="w-full pl-10 pr-4 py-3 bg-[#22252F] border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
            <DateRangePicker className="flex-1" />
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-6">
              Search
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters */}
          <div className="w-full lg:w-64 shrink-0">
            <div className="bg-[#1A1D25] rounded-xl p-5 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-white">Filters</h2>
                <Filter className="h-5 w-5 text-gray-400" />
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Categories</h3>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center">
                      <Checkbox
                        id={`category-${cat.id}`}
                        className="border-gray-700 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                      />
                      <Label htmlFor={`category-${cat.id}`} className="ml-2 text-sm text-gray-300">
                        {cat.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Price Range</h3>
                <Slider defaultValue={[0, 100]} max={100} step={1} className="my-4" />
                <div className="flex justify-between text-sm text-gray-400">
                  <span>$0</span>
                  <span>$1000+</span>
                </div>
              </div>

              {/* Distance */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Distance</h3>
                <Slider defaultValue={[25]} max={100} step={5} className="my-4" />
                <div className="flex justify-between text-sm text-gray-400">
                  <span>0 mi</span>
                  <span>100 mi</span>
                </div>
              </div>

              {/* Free Events Only */}
              <div className="mb-6">
                <div className="flex items-center">
                  <Checkbox
                    id="free-events"
                    className="border-gray-700 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                  />
                  <Label htmlFor="free-events" className="ml-2 text-sm text-gray-300">
                    Free events only
                  </Label>
                </div>
              </div>

              {/* Apply Filters Button */}
              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                Apply Filters
              </Button>
            </div>
          </div>

          {/* Events Grid */}
          <div className="flex-1">
            {/* Results Count */}
            <div className="mb-6">
              <p className="text-gray-300">
                {totalCount > 0 ? (
                  <>
                    Showing <span className="text-white font-medium">{events.length}</span> of{" "}
                    <span className="text-white font-medium">{totalCount}</span> events
                  </>
                ) : (
                  "No events found"
                )}
              </p>
            </div>

            {/* Events Grid */}
            {events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event, index) => (
                  <EventCard
                    key={event.id || index}
                    event={event}
                    index={index}
                    onViewDetails={() => {}}
                    onToggleFavorite={() => {}}
                  />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center bg-[#1A1D25] rounded-xl">
                <p className="text-gray-400 mb-4">No events found matching your criteria.</p>
                <Button variant="outline" className="border-gray-700 text-gray-300">
                  Clear Filters
                </Button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex space-x-2">
                  <Button variant="outline" className="border-gray-700 text-gray-300" disabled={currentPage <= 1}>
                    Previous
                  </Button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNumber = i + 1
                    return (
                      <Button
                        key={pageNumber}
                        variant={pageNumber === currentPage ? "default" : "outline"}
                        className={
                          pageNumber === currentPage
                            ? "bg-purple-600 hover:bg-purple-700 text-white"
                            : "border-gray-700 text-gray-300"
                        }
                      >
                        {pageNumber}
                      </Button>
                    )
                  })}

                  {totalPages > 5 && <span className="flex items-center text-gray-500">...</span>}

                  <Button
                    variant="outline"
                    className="border-gray-700 text-gray-300"
                    disabled={currentPage >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
