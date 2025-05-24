import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export function EventCardSkeleton() {
  return (
    <Card className="bg-[#1A1D25] border-gray-800 overflow-hidden">
      {/* Image skeleton */}
      <div className="aspect-video relative">
        <Skeleton className="w-full h-full bg-gray-700" />
        
        {/* Category badge skeleton */}
        <div className="absolute top-3 left-3">
          <Skeleton className="h-6 w-20 bg-gray-600" />
        </div>
        
        {/* Favorite button skeleton */}
        <div className="absolute top-3 right-3">
          <Skeleton className="h-8 w-8 rounded-full bg-gray-600" />
        </div>
        
        {/* Price skeleton */}
        <div className="absolute bottom-3 right-3">
          <Skeleton className="h-6 w-16 rounded-full bg-gray-600" />
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Title skeleton */}
        <Skeleton className="h-6 w-3/4 bg-gray-700" />
        
        {/* Description skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full bg-gray-700" />
          <Skeleton className="h-4 w-2/3 bg-gray-700" />
        </div>

        {/* Event details skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/2 bg-gray-700" />
          <Skeleton className="h-4 w-1/3 bg-gray-700" />
          <Skeleton className="h-4 w-2/3 bg-gray-700" />
        </div>

        {/* Organizer and attendees skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-6 w-6 rounded-full bg-gray-700" />
            <Skeleton className="h-4 w-20 bg-gray-700" />
          </div>
          <Skeleton className="h-4 w-12 bg-gray-700" />
        </div>
      </div>
    </Card>
  )
}

export function EventCardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }, (_, index) => (
        <EventCardSkeleton key={index} />
      ))}
    </div>
  )
}

export function MapSkeleton() {
  return (
    <div className="h-[500px] rounded-xl overflow-hidden border border-gray-800 bg-[#1A1D25] relative">
      <Skeleton className="w-full h-full bg-gray-700" />
      
      {/* Map controls skeleton */}
      <div className="absolute top-4 right-4 space-y-2">
        <Skeleton className="h-8 w-8 bg-gray-600" />
        <Skeleton className="h-8 w-8 bg-gray-600" />
      </div>
      
      {/* Loading indicator */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
          <p className="text-gray-400 text-sm">Loading map...</p>
        </div>
      </div>
    </div>
  )
}

export function FeaturedEventSkeleton() {
  return (
    <div className="relative h-[60vh] min-h-[500px] overflow-hidden rounded-2xl">
      {/* Background skeleton */}
      <Skeleton className="absolute inset-0 bg-gray-700" />
      
      {/* Content skeleton */}
      <div className="relative h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl space-y-6">
            {/* Badge skeleton */}
            <Skeleton className="h-6 w-32 bg-gray-600" />
            
            {/* Title skeleton */}
            <div className="space-y-3">
              <Skeleton className="h-12 w-full bg-gray-600" />
              <Skeleton className="h-12 w-3/4 bg-gray-600" />
            </div>
            
            {/* Description skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-5 w-full bg-gray-600" />
              <Skeleton className="h-5 w-4/5 bg-gray-600" />
            </div>
            
            {/* Event details skeleton */}
            <div className="flex flex-wrap gap-6">
              <Skeleton className="h-5 w-24 bg-gray-600" />
              <Skeleton className="h-5 w-20 bg-gray-600" />
              <Skeleton className="h-5 w-32 bg-gray-600" />
              <Skeleton className="h-5 w-28 bg-gray-600" />
            </div>
            
            {/* Buttons skeleton */}
            <div className="flex flex-wrap gap-4">
              <Skeleton className="h-12 w-48 bg-gray-600" />
              <Skeleton className="h-12 w-32 bg-gray-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats skeleton */}
      <div className="absolute top-8 right-8 bg-gray-800/50 backdrop-blur-md rounded-xl p-6 hidden lg:block">
        <div className="text-center space-y-4">
          <div>
            <Skeleton className="h-8 w-16 bg-gray-600 mx-auto mb-2" />
            <Skeleton className="h-3 w-20 bg-gray-600 mx-auto" />
          </div>
          <div className="border-t border-gray-600 pt-4">
            <Skeleton className="h-6 w-12 bg-gray-600 mx-auto mb-2" />
            <Skeleton className="h-3 w-16 bg-gray-600 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function LocationSearchSkeleton() {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
      <div className="text-center mb-8 space-y-4">
        <Skeleton className="h-8 w-64 bg-gray-600 mx-auto" />
        <Skeleton className="h-5 w-96 bg-gray-600 mx-auto" />
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <Skeleton className="h-14 w-full bg-gray-600" />
          </div>
          <Skeleton className="h-14 w-24 bg-gray-600" />
        </div>

        <div className="text-center">
          <Skeleton className="h-10 w-48 bg-gray-600 mx-auto" />
        </div>
      </div>
    </div>
  )
}