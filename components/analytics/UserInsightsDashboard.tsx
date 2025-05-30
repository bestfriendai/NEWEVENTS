"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { TrendingUp, Calendar, Heart, Users, Clock, BarChart3, PieChart, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface UserInsight {
  id: string
  type: "preference" | "behavior" | "social" | "temporal"
  title: string
  description: string
  value: number
  trend: "up" | "down" | "stable"
  confidence: number
  actionable: boolean
}

interface EventPattern {
  category: string
  frequency: number
  avgRating: number
  lastAttended: string
  preference: number
}

interface UserInsightsDashboardProps {
  userId?: string
  className?: string
}

export function UserInsightsDashboard({ userId, className }: UserInsightsDashboardProps) {
  const [insights, setInsights] = useState<UserInsight[]>([])
  const [eventPatterns, setEventPatterns] = useState<EventPattern[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const generateInsights = async () => {
      setIsLoading(true)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const mockInsights: UserInsight[] = [
        {
          id: "1",
          type: "preference",
          title: "Music Event Enthusiast",
          description: "You attend 3x more music events than average users",
          value: 85,
          trend: "up",
          confidence: 0.92,
          actionable: true,
        },
        {
          id: "2",
          type: "temporal",
          title: "Weekend Explorer",
          description: "You prefer events on Friday-Sunday evenings",
          value: 78,
          trend: "stable",
          confidence: 0.88,
          actionable: true,
        },
        {
          id: "3",
          type: "social",
          title: "Group Activity Lover",
          description: "You typically attend events with 2-4 friends",
          value: 72,
          trend: "up",
          confidence: 0.85,
          actionable: false,
        },
        {
          id: "4",
          type: "behavior",
          title: "Early Planner",
          description: "You book events 2 weeks in advance on average",
          value: 65,
          trend: "down",
          confidence: 0.79,
          actionable: true,
        },
      ]

      const mockPatterns: EventPattern[] = [
        { category: "Music", frequency: 12, avgRating: 4.5, lastAttended: "2 days ago", preference: 90 },
        { category: "Food & Drink", frequency: 8, avgRating: 4.2, lastAttended: "1 week ago", preference: 75 },
        { category: "Arts & Culture", frequency: 5, avgRating: 4.7, lastAttended: "3 weeks ago", preference: 60 },
        { category: "Sports", frequency: 3, avgRating: 3.8, lastAttended: "1 month ago", preference: 40 },
        { category: "Business", frequency: 2, avgRating: 4.0, lastAttended: "2 months ago", preference: 25 },
      ]

      setInsights(mockInsights)
      setEventPatterns(mockPatterns)
      setIsLoading(false)
    }

    generateInsights()
  }, [userId])

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case "down":
        return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
      case "stable":
        return <Activity className="h-4 w-4 text-blue-500" />
    }
  }

  const getInsightIcon = (type: UserInsight["type"]) => {
    switch (type) {
      case "preference":
        return <Heart className="h-5 w-5" />
      case "behavior":
        return <BarChart3 className="h-5 w-5" />
      case "social":
        return <Users className="h-5 w-5" />
      case "temporal":
        return <Clock className="h-5 w-5" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "text-green-600 bg-green-50"
    if (confidence >= 0.8) return "text-blue-600 bg-blue-50"
    if (confidence >= 0.7) return "text-yellow-600 bg-yellow-50"
    return "text-gray-600 bg-gray-50"
  }

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2" />
                <div className="h-8 bg-gray-200 rounded mb-2" />
                <div className="h-3 bg-gray-200 rounded" />
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
        <div>
          <h2 className="text-2xl font-bold">Your Event Insights</h2>
          <p className="text-gray-600 dark:text-gray-400">Personalized insights based on your event activity</p>
        </div>
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
          <Activity className="h-3 w-3 mr-1" />
          AI Powered
        </Badge>
      </div>

      <Tabs defaultValue="insights" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="insights">Key Insights</TabsTrigger>
          <TabsTrigger value="patterns">Event Patterns</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-6">
          {/* Key Insights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {insights.map((insight, index) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                          {getInsightIcon(insight.type)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{insight.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            {getTrendIcon(insight.trend)}
                            <Badge variant="outline" className={cn("text-xs", getConfidenceColor(insight.confidence))}>
                              {Math.round(insight.confidence * 100)}% confidence
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {insight.actionable && (
                        <Badge variant="secondary" className="text-xs">
                          Actionable
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{insight.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Strength</span>
                        <span className="font-medium">{insight.value}%</span>
                      </div>
                      <Progress value={insight.value} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          {/* Event Patterns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Your Event Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {eventPatterns.map((pattern, index) => (
                  <motion.div
                    key={pattern.category}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{pattern.category}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span>{pattern.frequency} events</span>
                          <span>★ {pattern.avgRating}</span>
                          <span>{pattern.lastAttended}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Preference</span>
                          <span>{pattern.preference}%</span>
                        </div>
                        <Progress value={pattern.preference} className="h-1.5" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          {/* Personalized Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Explore Jazz Venues",
                description: "Based on your music preferences, try these intimate jazz clubs",
                action: "Discover",
                icon: <Heart className="h-5 w-5" />,
              },
              {
                title: "Weekend Food Tours",
                description: "Perfect for your weekend activity pattern",
                action: "Browse",
                icon: <Calendar className="h-5 w-5" />,
              },
              {
                title: "Group-Friendly Events",
                description: "Events perfect for your typical group size",
                action: "Explore",
                icon: <Users className="h-5 w-5" />,
              },
            ].map((rec, index) => (
              <motion.div
                key={rec.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">{rec.icon}</div>
                      <div>
                        <h3 className="font-semibold mb-1">{rec.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{rec.description}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="w-full justify-center">
                      {rec.action}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
