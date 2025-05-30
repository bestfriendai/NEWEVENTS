"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, Sparkles, Mic, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"

interface SearchSuggestion {
  id: string
  text: string
  type: "category" | "location" | "event" | "trending"
  icon?: React.ReactNode
  metadata?: any
}

interface EnhancedSearchProps {
  onSearch: (query: string, filters?: any) => void
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void
  placeholder?: string
  className?: string
  showFilters?: boolean
  showVoiceSearch?: boolean
  suggestions?: SearchSuggestion[]
  recentSearches?: string[]
}

export function EnhancedSearch({
  onSearch,
  onSuggestionSelect,
  placeholder = "Search for events, venues, or activities...",
  className,
  showFilters = true,
  showVoiceSearch = true,
  suggestions = [],
  recentSearches = [],
}: EnhancedSearchProps) {
  const [query, setQuery] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])

  const debouncedQuery = useDebounce(query, 300)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Voice search functionality
  const startVoiceSearch = useCallback(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = "en-US"

      recognition.onstart = () => setIsListening(true)
      recognition.onend = () => setIsListening(false)

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setQuery(transcript)
        onSearch(transcript, { filters: selectedFilters })
      }

      recognition.onerror = () => {
        setIsListening(false)
      }

      recognition.start()
    }
  }, [onSearch, selectedFilters])

  // Handle search
  const handleSearch = useCallback(() => {
    if (query.trim()) {
      onSearch(query.trim(), { filters: selectedFilters })
      setShowSuggestions(false)
    }
  }, [query, onSearch, selectedFilters])

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback(
    (suggestion: SearchSuggestion) => {
      setQuery(suggestion.text)
      setShowSuggestions(false)
      onSuggestionSelect?.(suggestion)
      onSearch(suggestion.text, { filters: selectedFilters, type: suggestion.type })
    },
    [onSuggestionSelect, onSearch, selectedFilters],
  )

  // Filter suggestions based on query
  const filteredSuggestions = suggestions
    .filter((suggestion) => suggestion.text.toLowerCase().includes(debouncedQuery.toLowerCase()))
    .slice(0, 8)

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
        setIsExpanded(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Auto-search on debounced query change
  useEffect(() => {
    if (debouncedQuery.trim() && debouncedQuery.length > 2) {
      setShowSuggestions(true)
    }
  }, [debouncedQuery])

  const quickFilters = [
    { id: "tonight", label: "Tonight", icon: "🌙" },
    { id: "free", label: "Free Events", icon: "🆓" },
    { id: "music", label: "Music", icon: "🎵" },
    { id: "food", label: "Food & Drink", icon: "🍽️" },
    { id: "outdoor", label: "Outdoor", icon: "🌳" },
    { id: "trending", label: "Trending", icon: "🔥" },
  ]

  return (
    <div ref={containerRef} className={cn("relative w-full max-w-2xl mx-auto", className)}>
      {/* Main Search Bar */}
      <motion.div
        className={cn(
          "relative bg-white dark:bg-gray-800 rounded-2xl border-2 transition-all duration-300",
          isExpanded
            ? "border-purple-500 shadow-lg shadow-purple-500/20"
            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
        )}
        animate={{
          scale: isExpanded ? 1.02 : 1,
          y: isExpanded ? -2 : 0,
        }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center p-4">
          <Search className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />

          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              setIsExpanded(true)
              setShowSuggestions(true)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch()
              } else if (e.key === "Escape") {
                setShowSuggestions(false)
                setIsExpanded(false)
                inputRef.current?.blur()
              }
            }}
            placeholder={placeholder}
            className="border-0 bg-transparent text-lg placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
          />

          <div className="flex items-center gap-2 ml-3">
            {/* Voice Search */}
            {showVoiceSearch && (
              <Button
                variant="ghost"
                size="sm"
                onClick={startVoiceSearch}
                className={cn(
                  "h-8 w-8 p-0 rounded-full transition-all duration-200",
                  isListening ? "bg-red-500 text-white animate-pulse" : "hover:bg-gray-100 dark:hover:bg-gray-700",
                )}
                disabled={isListening}
              >
                <Mic className="h-4 w-4" />
              </Button>
            )}

            {/* Clear Button */}
            {query && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery("")
                  setShowSuggestions(false)
                  inputRef.current?.focus()
                }}
                className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            )}

            {/* Search Button */}
            <Button
              onClick={handleSearch}
              disabled={!query.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 rounded-xl"
            >
              Search
            </Button>
          </div>
        </div>

        {/* Quick Filters */}
        {showFilters && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="flex flex-wrap gap-2">
              {quickFilters.map((filter) => (
                <Badge
                  key={filter.id}
                  variant={selectedFilters.includes(filter.id) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:scale-105",
                    selectedFilters.includes(filter.id)
                      ? "bg-purple-600 text-white"
                      : "hover:bg-purple-50 dark:hover:bg-purple-900/20",
                  )}
                  onClick={() => {
                    setSelectedFilters((prev) =>
                      prev.includes(filter.id) ? prev.filter((f) => f !== filter.id) : [...prev, filter.id],
                    )
                  }}
                >
                  <span className="mr-1">{filter.icon}</span>
                  {filter.label}
                </Badge>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && (isExpanded || query) && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-50 max-h-96 overflow-y-auto"
          >
            {/* Recent Searches */}
            {!query && recentSearches.length > 0 && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Recent Searches</h4>
                <div className="space-y-1">
                  {recentSearches.slice(0, 3).map((search, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setQuery(search)
                        onSearch(search, { filters: selectedFilters })
                        setShowSuggestions(false)
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center">
                        <Search className="h-4 w-4 text-gray-400 mr-3" />
                        <span className="text-sm">{search}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {filteredSuggestions.length > 0 && (
              <div className="p-2">
                {filteredSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="w-full text-left px-3 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {suggestion.icon || <Sparkles className="h-4 w-4 text-purple-500 mr-3" />}
                        <div>
                          <span className="text-sm font-medium">{suggestion.text}</span>
                          <div className="text-xs text-gray-500 capitalize">{suggestion.type}</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        {suggestion.type}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* No Results */}
            {query && filteredSuggestions.length === 0 && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No suggestions found</p>
                <p className="text-xs mt-1">Try a different search term</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Search Indicator */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 bg-red-500/10 rounded-2xl border-2 border-red-500 flex items-center justify-center backdrop-blur-sm"
          >
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2"
              >
                <Mic className="h-6 w-6 text-white" />
              </motion.div>
              <p className="text-red-600 font-medium">Listening...</p>
              <p className="text-sm text-red-500">Speak now</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
