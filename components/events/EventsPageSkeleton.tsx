"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

function EventCardSkeleton() {
  return (
    <Card className="bg-[#1A1D25]/80 backdrop-blur-md border border-gray-800/50 overflow-hidden">
      <Skeleton className="h-48 w-full bg-gray-800/50" />
      <CardContent className="p-6">
        <Skeleton className="h-6 w-3/4 mb-2 bg-gray-800/50" />
        <Skeleton className="h-4 w-full mb-1 bg-gray-800/50" />
        <Skeleton className="h-4 w-2/3 mb-4 bg-gray-800/50" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/2 bg-gray-800/50" />
          <Skeleton className="h-4 w-3/4 bg-gray-800/50" />
          <div className="flex justify-between pt-2">
            <Skeleton className="h-4 w-1/3 bg-gray-800/50" />
            <Skeleton className="h-6 w-16 bg-gray-800/50" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function FeaturedEventSkeleton() {
  return (
    <div className="flex-shrink-0 w-80">
      <Card className="bg-[#1A1D25]/80 backdrop-blur-md border border-gray-800/50 overflow-hidden">
        <Skeleton className="h-48 w-full bg-gray-800/50" />
        <CardContent className="p-6">
          <Skeleton className="h-6 w-3/4 mb-2 bg-gray-800/50" />
          <Skeleton className="h-4 w-full mb-1 bg-gray-800/50" />
          <Skeleton className="h-4 w-2/3 mb-4 bg-gray-800/50" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/2 bg-gray-800/50" />
            <Skeleton className="h-4 w-3/4 bg-gray-800/50" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function EventsPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0B10] to-[#12141D]">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-30 bg-[#12141D]/80 backdrop-blur-md border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div>
                <Skeleton className="h-8 w-48 mb-2 bg-gray-800/50" />
                <Skeleton className="h-4 w-32 bg-gray-800/50" />
              </div>
              <Skeleton className="h-6 w-24 bg-gray-800/50" />
            </div>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-80 bg-gray-800/50" />
              <Skeleton className="h-10 w-32 bg-gray-800/50" />
              <Skeleton className="h-10 w-24 bg-gray-800/50" />
              <Skeleton className="h-10 w-32 bg-gray-800/50" />
            </div>
          </div>
        </div>
      </div>

      {/* Featured Events Skeleton */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Skeleton className="w-10 h-10 bg-gray-800/50" />
            <div>
              <Skeleton className="h-6 w-40 mb-1 bg-gray-800/50" />
              <Skeleton className="h-4 w-56 bg-gray-800/50" />
            </div>
          </div>
          <Skeleton className="h-8 w-20 bg-gray-800/50" />
        </div>

        <div className="flex space-x-6 overflow-x-auto pb-4 scrollbar-hide">
          {Array.from({ length: 4 }).map((_, i) => (
            <FeaturedEventSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        {/* Category Pills Skeleton */}
        <div className="flex items-center space-x-4 mb-8 overflow-x-auto pb-2">
          <div className="flex items-center space-x-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-24 bg-gray-800/50" />
            ))}
          </div>
          <Skeleton className="h-10 w-40 ml-auto bg-gray-800/50" />
        </div>

        {/* Events Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
