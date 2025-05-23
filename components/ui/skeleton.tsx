import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

// Event Card Skeleton
function EventCardSkeleton({ variant = "default" }: { variant?: "default" | "compact" | "grid" }) {
  if (variant === "compact") {
    return (
      <div className="flex items-center space-x-3 p-3 bg-card rounded-lg border">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    )
  }

  if (variant === "grid") {
    return (
      <div className="bg-card rounded-xl border overflow-hidden">
        <Skeleton className="h-48 w-full" />
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-4 p-4 bg-card rounded-xl border">
      <Skeleton className="h-16 w-16 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-md" />
      </div>
    </div>
  )
}

// Map Skeleton
function MapSkeleton() {
  return (
    <div className="relative w-full h-full bg-muted rounded-xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted/80 to-muted animate-pulse" />
      <div className="absolute top-4 left-4 space-y-2">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-8 w-32 rounded-md" />
      </div>
      <div className="absolute bottom-4 right-4 space-y-2">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
      {/* Simulate map markers */}
      <div className="absolute top-1/4 left-1/3">
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
      <div className="absolute top-1/2 right-1/4">
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
      <div className="absolute bottom-1/3 left-1/2">
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
    </div>
  )
}

// Globe Skeleton
function GlobeSkeleton() {
  return (
    <div className="relative w-full aspect-square max-w-[600px] mx-auto">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-500/20 via-secondary-500/20 to-accent-500/20 animate-pulse" />
      <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-muted via-muted/60 to-muted animate-pulse" />
      <div className="absolute inset-8 rounded-full bg-gradient-to-bl from-muted/80 via-muted/40 to-muted/80 animate-pulse" />
    </div>
  )
}

// Navigation Skeleton
function NavigationSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  )
}

// Profile Skeleton
function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
}

// Table Skeleton
function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

// Form Skeleton
function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="flex space-x-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  )
}

// Stats Skeleton
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-card p-6 rounded-xl border space-y-3">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </div>
  )
}

// Loading Screen
function LoadingScreen({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-muted border-t-primary-500 rounded-full animate-spin mx-auto" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-secondary-500 rounded-full animate-spin mx-auto" 
               style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
        <p className="text-muted-foreground animate-pulse">{message}</p>
      </div>
    </div>
  )
}

export { 
  Skeleton,
  EventCardSkeleton,
  MapSkeleton,
  GlobeSkeleton,
  NavigationSkeleton,
  ProfileSkeleton,
  TableSkeleton,
  FormSkeleton,
  StatsSkeleton,
  LoadingScreen
}
