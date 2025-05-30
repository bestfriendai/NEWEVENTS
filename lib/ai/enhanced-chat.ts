import { logger } from "@/lib/utils/logger"

export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  metadata?: {
    eventContext?: any
    location?: { lat: number; lng: number; name: string }
    preferences?: any
  }
}

export interface EventRecommendation {
  event: any
  score: number
  reasoning: string
  matchFactors: string[]
}

export class EnhancedChatService {
  private conversationHistory: ChatMessage[] = []
  private userContext: any = {}

  async generateEventRecommendations(
    userMessage: string,
    userLocation?: { lat: number; lng: number; name: string },
    userPreferences?: any,
  ): Promise<{
    response: string
    recommendations: EventRecommendation[]
    suggestedQuestions: string[]
  }> {
    try {
      // Analyze user intent
      const intent = this.analyzeUserIntent(userMessage)

      // Get contextual events based on intent and location
      const events = await this.getContextualEvents(intent, userLocation, userPreferences)

      // Score and rank events
      const recommendations = this.scoreEvents(events, intent, userPreferences)

      // Generate personalized response
      const response = this.generatePersonalizedResponse(intent, recommendations, userLocation)

      // Generate follow-up questions
      const suggestedQuestions = this.generateSuggestedQuestions(intent, recommendations)

      return {
        response,
        recommendations: recommendations.slice(0, 5), // Top 5 recommendations
        suggestedQuestions,
      }
    } catch (error) {
      logger.error("Failed to generate event recommendations", { error, userMessage })
      return {
        response: "I'm having trouble finding events right now. Please try again in a moment.",
        recommendations: [],
        suggestedQuestions: [
          "What types of events do you usually enjoy?",
          "Are you looking for something specific tonight?",
          "Would you like me to suggest popular events in your area?",
        ],
      }
    }
  }

  private analyzeUserIntent(message: string): {
    type: "search" | "recommendation" | "question" | "booking"
    categories: string[]
    timeframe: "today" | "tonight" | "weekend" | "next_week" | "flexible"
    mood: "energetic" | "relaxed" | "romantic" | "social" | "cultural"
    groupSize: "solo" | "couple" | "small_group" | "large_group"
    keywords: string[]
  } {
    const lowerMessage = message.toLowerCase()

    // Determine intent type
    let type: "search" | "recommendation" | "question" | "booking" = "search"
    if (lowerMessage.includes("recommend") || lowerMessage.includes("suggest")) {
      type = "recommendation"
    } else if (lowerMessage.includes("?")) {
      type = "question"
    } else if (lowerMessage.includes("book") || lowerMessage.includes("ticket")) {
      type = "booking"
    }

    // Extract categories
    const categoryKeywords = {
      music: ["music", "concert", "band", "dj", "festival"],
      food: ["food", "restaurant", "dining", "eat", "drink"],
      arts: ["art", "museum", "gallery", "theater", "show"],
      sports: ["sport", "game", "match", "fitness"],
      nightlife: ["club", "bar", "nightlife", "party", "dance"],
    }

    const categories: string[] = []
    Object.entries(categoryKeywords).forEach(([category, keywords]) => {
      if (keywords.some((keyword) => lowerMessage.includes(keyword))) {
        categories.push(category)
      }
    })

    // Determine timeframe
    let timeframe: "today" | "tonight" | "weekend" | "next_week" | "flexible" = "flexible"
    if (lowerMessage.includes("today") || lowerMessage.includes("now")) {
      timeframe = "today"
    } else if (lowerMessage.includes("tonight") || lowerMessage.includes("evening")) {
      timeframe = "tonight"
    } else if (
      lowerMessage.includes("weekend") ||
      lowerMessage.includes("saturday") ||
      lowerMessage.includes("sunday")
    ) {
      timeframe = "weekend"
    } else if (lowerMessage.includes("next week") || lowerMessage.includes("upcoming")) {
      timeframe = "next_week"
    }

    // Determine mood
    let mood: "energetic" | "relaxed" | "romantic" | "social" | "cultural" = "social"
    if (lowerMessage.includes("energetic") || lowerMessage.includes("exciting") || lowerMessage.includes("fun")) {
      mood = "energetic"
    } else if (lowerMessage.includes("relaxed") || lowerMessage.includes("calm") || lowerMessage.includes("chill")) {
      mood = "relaxed"
    } else if (
      lowerMessage.includes("romantic") ||
      lowerMessage.includes("date") ||
      lowerMessage.includes("intimate")
    ) {
      mood = "romantic"
    } else if (
      lowerMessage.includes("cultural") ||
      lowerMessage.includes("educational") ||
      lowerMessage.includes("learn")
    ) {
      mood = "cultural"
    }

    // Determine group size
    let groupSize: "solo" | "couple" | "small_group" | "large_group" = "couple"
    if (lowerMessage.includes("alone") || lowerMessage.includes("solo") || lowerMessage.includes("myself")) {
      groupSize = "solo"
    } else if (lowerMessage.includes("friends") || lowerMessage.includes("group")) {
      groupSize = "small_group"
    } else if (lowerMessage.includes("party") || lowerMessage.includes("crowd")) {
      groupSize = "large_group"
    }

    // Extract keywords
    const keywords = message
      .split(" ")
      .filter(
        (word) =>
          word.length > 3 &&
          ![
            "the",
            "and",
            "for",
            "are",
            "but",
            "not",
            "you",
            "all",
            "can",
            "had",
            "her",
            "was",
            "one",
            "our",
            "out",
            "day",
            "get",
            "has",
            "him",
            "his",
            "how",
            "its",
            "may",
            "new",
            "now",
            "old",
            "see",
            "two",
            "way",
            "who",
            "boy",
            "did",
            "man",
            "men",
            "put",
            "say",
            "she",
            "too",
            "use",
          ].includes(word.toLowerCase()),
      )

    return {
      type,
      categories,
      timeframe,
      mood,
      groupSize,
      keywords,
    }
  }

  private async getContextualEvents(
    intent: any,
    userLocation?: { lat: number; lng: number; name: string },
    userPreferences?: any,
  ): Promise<any[]> {
    // This would integrate with your events API
    // For now, return mock events based on intent
    const mockEvents = [
      {
        id: 1,
        title: "Jazz Night at Blue Note",
        category: "music",
        mood: "relaxed",
        groupSize: "couple",
        location: userLocation?.name || "Downtown",
        time: "8:00 PM",
        price: "$25",
        description: "Intimate jazz performance with local artists",
      },
      {
        id: 2,
        title: "Food Truck Festival",
        category: "food",
        mood: "social",
        groupSize: "small_group",
        location: userLocation?.name || "City Park",
        time: "12:00 PM",
        price: "Free",
        description: "Diverse food trucks and live music",
      },
    ]

    return mockEvents.filter((event) => {
      if (intent.categories.length > 0) {
        return intent.categories.includes(event.category)
      }
      return true
    })
  }

  private scoreEvents(events: any[], intent: any, userPreferences?: any): EventRecommendation[] {
    return events
      .map((event) => {
        let score = 0.5 // Base score
        const matchFactors: string[] = []

        // Category match
        if (intent.categories.includes(event.category)) {
          score += 0.3
          matchFactors.push(`Matches your interest in ${event.category}`)
        }

        // Mood match
        if (event.mood === intent.mood) {
          score += 0.2
          matchFactors.push(`Perfect for a ${intent.mood} experience`)
        }

        // Group size match
        if (event.groupSize === intent.groupSize) {
          score += 0.15
          matchFactors.push(`Great for ${intent.groupSize} activities`)
        }

        // Time relevance
        if (intent.timeframe === "tonight" && event.time.includes("PM")) {
          score += 0.1
          matchFactors.push("Available tonight")
        }

        // User preferences
        if (userPreferences?.favoriteCategories?.includes(event.category)) {
          score += 0.1
          matchFactors.push("Matches your favorite category")
        }

        const reasoning = this.generateReasoning(event, matchFactors, score)

        return {
          event,
          score: Math.min(score, 1.0),
          reasoning,
          matchFactors,
        }
      })
      .sort((a, b) => b.score - a.score)
  }

  private generateReasoning(event: any, matchFactors: string[], score: number): string {
    const confidence = score > 0.8 ? "highly" : score > 0.6 ? "moderately" : "somewhat"
    const reasons = matchFactors.slice(0, 2).join(" and ")

    return `I ${confidence} recommend "${event.title}" because ${reasons}. ${event.description}`
  }

  private generatePersonalizedResponse(
    intent: any,
    recommendations: EventRecommendation[],
    userLocation?: { lat: number; lng: number; name: string },
  ): string {
    if (recommendations.length === 0) {
      return `I couldn't find any events matching your criteria${userLocation ? ` in ${userLocation.name}` : ""}. Would you like me to broaden the search or suggest popular events in your area?`
    }

    const topRec = recommendations[0]
    const locationText = userLocation ? ` in ${userLocation.name}` : ""

    let response = `Based on what you're looking for, I'd recommend "${topRec.event.title}"${locationText}. ${topRec.reasoning}`

    if (recommendations.length > 1) {
      response += `\n\nI also found ${recommendations.length - 1} other great option${recommendations.length > 2 ? "s" : ""} that might interest you.`
    }

    return response
  }

  private generateSuggestedQuestions(intent: any, recommendations: EventRecommendation[]): string[] {
    const questions = [
      "Tell me more about the venue",
      "What's the best way to get there?",
      "Are there similar events this week?",
      "What should I wear to this event?",
      "Can you help me find tickets?",
    ]

    // Customize based on intent and recommendations
    if (intent.mood === "romantic") {
      questions.unshift("Is this a good spot for a date?")
    }

    if (intent.groupSize === "large_group") {
      questions.unshift("Do they offer group discounts?")
    }

    if (recommendations.length > 0 && recommendations[0].event.price !== "Free") {
      questions.push("Are there any free alternatives?")
    }

    return questions.slice(0, 4)
  }

  addMessage(message: ChatMessage) {
    this.conversationHistory.push(message)

    // Keep only last 20 messages to manage memory
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20)
    }
  }

  updateUserContext(context: any) {
    this.userContext = { ...this.userContext, ...context }
  }

  getConversationHistory(): ChatMessage[] {
    return [...this.conversationHistory]
  }
}

export const chatService = new EnhancedChatService()
