"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, TrendingUp, MapPin, Clock, Users, Heart, Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EventCard } from "@/components/events/EventCard"
import { cn } from "@/lib/utils"
import type { EventDetail } from "@/types/event.types"

interface RecommendationReason {
  type: "location" | "preference" | "trending" | "social" | "time" | "weather"
  text: string
  confidence: number
}

interface SmartRecommendation {
  event: EventDetail
  score: number
  reasons: RecommendationReason[]
  category: "perfect_match" | "trending" | "nearby" | "similar_taste" | "new_experience"
}

interface SmartEventRecommendationsProps {
  userLocation?: { lat: number; lng: number; name: string }
  userPreferences?: {
    favoriteCategories: string[]
    priceRange: string
    timePreference: string
  }
  recentActivity?: EventDetail[]
  onEventSelect: (event: EventDetail) => void
  className?: string
}

export function SmartEventRecommendations({
  userLocation,
  userPreferences,
  recentActivity = [],
  onEventSelect,
  className,
}: SmartEventRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)

  // Generate smart recommendations
  useEffect(() => {
    const generateRecommendations = async () => {
      setIsLoading(true)

      // Simulate API call with intelligent recommendation logic
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const mockRecommendations: SmartRecommendation[] = [
        {
          event: {
            id: 1,
            title: "Jazz Under the Stars",
            description: "Intimate outdoor jazz performance with local artists",
            category: "Music",
            date: "Tonight",
            time: "8:00 PM",
            location: "Riverside Park",
            address: "123 River St, Downtown",
            price: "$25",
            image: "/placeholder.svg?height=300&width=400&text=Jazz+Night",
            organizer: { name: "Blue Note Collective", avatar: "/avatar-1.png" },
            attendees: 150,
            isFavorite: false,
            coordinates: { lat: 40.7128, lng: -74.006 },
          },
          score: 0.95,
          reasons: [
            { type: "preference", text: "Matches your love for jazz music", confidence: 0.9 },
            { type: "location", text: "Only 0.5 miles from your location", confidence: 0.8 },
            { type: "time", text: "Perfect for evening plans", confidence: 0.7 },
          ],
          category: "perfect_match",
        },
        {
          event: {
            id: 2,
            title: "Rooftop Food Festival",
            description: "Gourmet food trucks and craft cocktails with city views",
            category: "Food",
            date: "Tomorrow",
            time: "6:00 PM",
            location: "Sky Terrace",
            address: "456 High St, Midtown",
            price: "$15 entry",
            image: "/placeholder.svg?height=300&width=400&text=Food+Festival",
            organizer: { name: "Foodie Collective", avatar: "/avatar-2.png" },
            attendees: 300,
            isFavorite: false,
            coordinates: { lat: 40.7589, lng: -73.9851 },
          },
          score: 0.88,
          reasons: [
            { type: "trending", text: "Trending in your area", confidence: 0.9 },
            { type: "social", text: "Friends are interested", confidence: 0.6 },
            { type: "weather", text: "Perfect weather for rooftop dining", confidence: 0.8 },
          ],
          category: "trending",
        },
      ]

      setRecommendations(mockRecommendations)
      setIsLoading(false)
    }

    generateRecommendations()
  }, [userLocation, userPreferences, recentActivity])

  const categories = [
    { id: "all", label: "All Recommendations", icon: Sparkles },
    { id: "perfect_match", label: "Perfect Match", icon: Star },
    { id: "trending", label: "Trending", icon: TrendingUp },
    { id: "nearby", label: "Nearby", icon: MapPin },
    { id: "similar_taste", label: "Similar Taste", icon: Heart },
    { id: "new_experience", label: "New Experience", icon: Users },
  ]

  const filteredRecommendations =
    selectedCategory === "all" ? recommendations : recommendations.filter((rec) => rec.category === selectedCategory)

  const getReasonIcon = (type: RecommendationReason["type"]) => {
    switch (type) {
      case "location":
        return <MapPin className="h-3 w-3" />
      case "preference":
        return <Heart className="h-3 w-3" />
      case "trending":
        return <TrendingUp className="h-3 w-3" />
      case "social":
        return <Users className="h-3 w-3" />
      case "time":
        return <Clock className="h-3 w-3" />
      case "weather":
        return <Sparkles className="h-3 w-3" />
      default:
        return <Star className="h-3 w-3" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600"
    if (confidence >= 0.6) return "text-yellow-600"
    return "text-gray-600"
  }

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold">Smart Recommendations</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg" />
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2" />
                <div className="h-3 bg-gray-200 rounded mb-4" />
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold">Smart Recommendations</h2>
          <Badge variant="outline" className="ml-2">
            AI Powered
          </Badge>
        </div>

        <div className="text-sm text-gray-600">Based on your preferences and activity</div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const Icon = category.icon
          const isSelected = selectedCategory === category.id
          const count =
            category.id === "all"
              ? recommendations.length
              : recommendations.filter((rec) => rec.category === category.id).length

          return (
            <Button
              key={category.id}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className={cn(
                "transition-all duration-200",
                isSelected ? "bg-purple-600 text-white" : "hover:bg-purple-50 dark:hover:bg-purple-900/20",
              )}
            >
              <Icon className="h-4 w-4 mr-2" />
              {category.label}
              {count > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {count}
                </Badge>
              )}
            </Button>
          )
        })}
      </div>

      {/* Recommendations Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedCategory}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {filteredRecommendations.map((recommendation, index) => (
            <motion.div
              key={recommendation.event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="relative"
            >
              {/* Recommendation Score Badge */}
              <div className="absolute top-4 left-4 z-10">
                <Badge
                  className={cn(
                    "bg-white/90 backdrop-blur-sm text-purple-700 border-purple-200",
                    recommendation.score >= 0.9 && "bg-green-500/90 text-white border-green-400",
                    recommendation.score >= 0.8 &&
                      recommendation.score < 0.9 &&
                      "bg-blue-500/90 text-white border-blue-400",
                  )}
                >
                  <Star className="h-3 w-3 mr-1" />
                  {Math.round(recommendation.score * 100)}% match
                </Badge>
              </div>

              {/* Event Card */}
              <EventCard
                event={recommendation.event}
                onSelect={() => onEventSelect(recommendation.event)}
                className="h-full"
              />

              {/* Recommendation Reasons */}
              <Card className="mt-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-700">
                <CardContent className="p-4">
                  <h4 className="font-medium text-sm mb-3 flex items-center">
                    <Sparkles className="h-4 w-4 mr-2 text-purple-600" />
                    Why we recommend this
                  </h4>
                  <div className="space-y-2">
                    {recommendation.reasons.slice(0, 2).map((reason, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <div className={cn("mt-0.5", getConfidenceColor(reason.confidence))}>
                          {getReasonIcon(reason.type)}
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">{reason.text}</span>
                        <div className={cn("ml-auto text-xs font-medium", getConfidenceColor(reason.confidence))}>
                          {Math.round(reason.confidence * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Empty State */}
      {filteredRecommendations.length === 0 && !isLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No recommendations found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Try adjusting your preferences or explore different categories
          </p>
          <Button onClick={() => setSelectedCategory("all")} variant="outline">
            View All Recommendations
          </Button>
        </motion.div>
      )}
    </div>
  )
}
