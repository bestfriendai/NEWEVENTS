import { EventCardGridSkeleton } from "@/components/ui/event-skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0A0B0F] p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="h-8 bg-gray-800 rounded w-48 mb-4 animate-pulse"></div>
          <div className="h-4 bg-gray-800 rounded w-96 animate-pulse"></div>
        </div>
        <EventCardGridSkeleton count={6} />
      </div>
    </div>
  )
}
