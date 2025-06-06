"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface EnhancedLoadingSkeletonProps {
  variant?: "default" | "compact" | "featured" | "grid"
  count?: number
  className?: string
}

const shimmerAnimation = {
  initial: { x: "-100%" },
  animate: { x: "100%" },
  transition: {
    repeat: Infinity,
    duration: 1.5,
    ease: "easeInOut"
  }
}

function EventCardSkeleton({ variant = "default" }: { variant?: "default" | "compact" | "featured" }) {
  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-[#1A1D25]/80 backdrop-blur-sm border border-gray-800/50 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                <Skeleton className="w-full h-full bg-gray-800/50" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  {...shimmerAnimation}
                />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-4 w-3/4 bg-gray-800/50" />
                <Skeleton className="h-3 w-1/2 bg-gray-800/50" />
                <Skeleton className="h-3 w-2/3 bg-gray-800/50" />
              </div>
              <div className="flex-shrink-0">
                <Skeleton className="h-8 w-8 rounded bg-gray-800/50" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (variant === "featured") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="bg-gradient-to-br from-[#1A1D25] to-[#2A2D35] border border-gray-800/50 overflow-hidden">
          <div className="relative h-64 overflow-hidden">
            <Skeleton className="w-full h-full bg-gray-800/50" />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              {...shimmerAnimation}
            />
            
            {/* Featured badge skeleton */}
            <div className="absolute top-4 left-4">
              <Skeleton className="h-6 w-20 rounded-full bg-gray-700/50" />
            </div>

            {/* Quick actions skeleton */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Skeleton className="h-8 w-8 rounded bg-gray-700/50" />
              <Skeleton className="h-8 w-8 rounded bg-gray-700/50" />
            </div>

            {/* Event info overlay skeleton */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-6 w-16 rounded-full bg-gray-700/50" />
                <Skeleton className="h-6 w-12 rounded-full bg-gray-700/50" />
              </div>
              
              <Skeleton className="h-6 w-3/4 mb-2 bg-gray-700/50" />
              
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-20 bg-gray-700/50" />
                <Skeleton className="h-4 w-24 bg-gray-700/50" />
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    )
  }

  // Default variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="bg-[#1A1D25]/80 backdrop-blur-sm border border-gray-800/50 overflow-hidden">
        <div className="relative h-48 overflow-hidden">
          <Skeleton className="w-full h-full bg-gray-800/50" />
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            {...shimmerAnimation}
          />
          
          {/* Category badge skeleton */}
          <div className="absolute top-3 left-3">
            <Skeleton className="h-6 w-16 rounded-full bg-gray-700/50" />
          </div>

          {/* Price badge skeleton */}
          <div className="absolute bottom-3 right-3">
            <Skeleton className="h-6 w-12 rounded-full bg-gray-700/50" />
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-5 w-3/4 bg-gray-800/50" />
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 bg-gray-800/50" />
              <Skeleton className="h-4 w-20 bg-gray-800/50" />
              <Skeleton className="h-4 w-4 bg-gray-800/50 ml-2" />
              <Skeleton className="h-4 w-16 bg-gray-800/50" />
            </div>
            
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 bg-gray-800/50" />
              <Skeleton className="h-4 w-32 bg-gray-800/50" />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Skeleton className="h-6 w-6 rounded-full bg-gray-800/50" />
              <Skeleton className="h-3 w-24 bg-gray-800/50" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function HeaderSkeleton() {
  return (
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
          </div>
        </div>
      </div>
    </div>
  )
}

function FiltersSkeleton() {
  return (
    <div className="flex items-center space-x-4 mb-8 overflow-x-auto pb-2">
      <div className="flex items-center space-x-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 bg-gray-800/50 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-10 w-40 ml-auto bg-gray-800/50" />
    </div>
  )
}

function FeaturedEventsSkeleton() {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Skeleton className="w-10 h-10 rounded-xl bg-gray-800/50" />
          <div>
            <Skeleton className="h-6 w-32 mb-1 bg-gray-800/50" />
            <Skeleton className="h-4 w-48 bg-gray-800/50" />
          </div>
        </div>
        <Skeleton className="h-10 w-24 bg-gray-800/50" />
      </div>
      
      <div className="flex gap-6 overflow-x-auto pb-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-80">
            <EventCardSkeleton variant="featured" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function EnhancedLoadingSkeleton({ 
  variant = "grid", 
  count = 12, 
  className 
}: EnhancedLoadingSkeletonProps) {
  if (variant === "grid") {
    return (
      <div className={cn("min-h-screen bg-gradient-to-br from-[#0A0B10] to-[#12141D]", className)}>
        <HeaderSkeleton />
        
        <div className="max-w-7xl mx-auto px-6 pb-8">
          <FiltersSkeleton />
          <FeaturedEventsSkeleton />
          
          {/* Events Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: count }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <EventCardSkeleton />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.05 }}
        >
          <EventCardSkeleton variant={variant as "default" | "compact" | "featured"} />
        </motion.div>
      ))}
    </div>
  )
}

// Individual skeleton components for specific use cases
export { EventCardSkeleton, HeaderSkeleton, FiltersSkeleton, FeaturedEventsSkeleton }
