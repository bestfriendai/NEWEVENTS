import { AppLayout } from "@/components/app-layout"
import { EventCard } from "@/components/event-card"
import { Button } from "@/components/ui/button"
import { fetchFeaturedEvents, fetchEventsByCategory } from "@/app/actions/event-actions"
import { Search, Calendar, MapPin, ArrowRight } from "lucide-react"
import Link from "next/link"

export default async function Home() {
  // Fetch featured events
  const featuredEvents = await fetchFeaturedEvents(2)

  // Fetch events by category
  const concertEvents = await fetchEventsByCategory("Music", 4)
  const sportsEvents = await fetchEventsByCategory("Sports", 4)
  const artsEvents = await fetchEventsByCategory("Arts", 4)

  return (
    <AppLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/hero-image.png" alt="DateAI Hero" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-[#121212]"></div>
        </div>

        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Discover{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                Amazing Events
              </span>{" "}
              Near You
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Find the perfect events for your next date, hangout with friends, or solo adventure.
            </p>

            {/* Search Form */}
            <div className="bg-[#1A1D25]/80 backdrop-blur-md p-4 rounded-xl shadow-glow-sm mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search events..."
                    className="w-full pl-10 pr-4 py-3 bg-[#22252F] border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Location"
                    className="w-full pl-10 pr-4 py-3 bg-[#22252F] border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                <div className="flex-1 relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Date"
                    className="w-full pl-10 pr-4 py-3 bg-[#22252F] border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-6">
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-16 bg-[#121212]">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Featured Events</h2>
            <Link href="/events" className="text-purple-400 hover:text-purple-300 flex items-center">
              View all <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredEvents.length > 0 ? (
              featuredEvents.map((event, index) => (
                <EventCard
                  key={event.id || index}
                  event={event}
                  variant="featured"
                  index={index}
                  onViewDetails={() => {}}
                  onToggleFavorite={() => {}}
                />
              ))
            ) : (
              <div className="col-span-2 py-20 text-center">
                <p className="text-gray-400">No featured events available at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Concerts & Music */}
      <section className="py-16 bg-[#0A0A0A]">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Concerts & Music</h2>
            <Link href="/events?category=Music" className="text-purple-400 hover:text-purple-300 flex items-center">
              View all <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {concertEvents.length > 0 ? (
              concertEvents.map((event, index) => (
                <EventCard
                  key={event.id || index}
                  event={event}
                  index={index}
                  onViewDetails={() => {}}
                  onToggleFavorite={() => {}}
                />
              ))
            ) : (
              <div className="col-span-4 py-20 text-center">
                <p className="text-gray-400">No music events available at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Sports */}
      <section className="py-16 bg-[#121212]">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Sports</h2>
            <Link href="/events?category=Sports" className="text-purple-400 hover:text-purple-300 flex items-center">
              View all <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sportsEvents.length > 0 ? (
              sportsEvents.map((event, index) => (
                <EventCard
                  key={event.id || index}
                  event={event}
                  index={index}
                  onViewDetails={() => {}}
                  onToggleFavorite={() => {}}
                />
              ))
            ) : (
              <div className="col-span-4 py-20 text-center">
                <p className="text-gray-400">No sports events available at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Arts & Theater */}
      <section className="py-16 bg-[#0A0A0A]">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Arts & Theater</h2>
            <Link href="/events?category=Arts" className="text-purple-400 hover:text-purple-300 flex items-center">
              View all <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {artsEvents.length > 0 ? (
              artsEvents.map((event, index) => (
                <EventCard
                  key={event.id || index}
                  event={event}
                  index={index}
                  onViewDetails={() => {}}
                  onToggleFavorite={() => {}}
                />
              ))
            ) : (
              <div className="col-span-4 py-20 text-center">
                <p className="text-gray-400">No arts events available at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </AppLayout>
  )
}
