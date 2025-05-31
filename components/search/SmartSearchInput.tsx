"use client"

/**
 * Smart Search Input Component
 * Advanced search with autocomplete, suggestions, and analytics
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Clock, 
  TrendingUp, 
  MapPin, 
  Tag, 
  X, 
  Sparkles,
  History,
  ArrowRight
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useSmartSearch } from '@/hooks/use-smart-search'
import { cn } from '@/lib/utils'

interface SmartSearchInputProps {
  onSearch: (query: string) => void
  onSuggestionSelect?: (suggestion: any) => void
  placeholder?: string
  className?: string
  showInsights?: boolean
  autoFocus?: boolean
}

export function SmartSearchInput({
  onSearch,
  onSuggestionSelect,
  placeholder = "Search events, categories, or locations...",
  className,
  showInsights = true,
  autoFocus = false
}: SmartSearchInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const {
    query,
    suggestions,
    isLoading,
    searchHistory,
    analytics,
    setQuery,
    executeSearch,
    trackSearchClick,
    clearHistory,
    getSearchInsights,
    enhanceQuery,
    hasSuggestions,
    hasHistory
  } = useSmartSearch({
    minQueryLength: 1,
    maxSuggestions: 8,
    enableHistory: true,
    enableAnalytics: true
  })

  const insights = getSearchInsights()

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setSelectedIndex(-1)
    setIsOpen(value.length > 0 || hasHistory)
  }, [setQuery, hasHistory])

  // Handle search execution
  const handleSearch = useCallback((searchQuery?: string) => {
    const finalQuery = searchQuery || query
    if (!finalQuery.trim()) return

    const enhanced = enhanceQuery(finalQuery)
    executeSearch(enhanced)
    onSearch(enhanced)
    setIsOpen(false)
    inputRef.current?.blur()
  }, [query, enhanceQuery, executeSearch, onSearch])

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: any) => {
    setQuery(suggestion.text)
    executeSearch(suggestion.text)
    onSearch(suggestion.text)
    onSuggestionSelect?.(suggestion)
    setIsOpen(false)
    inputRef.current?.blur()
  }, [setQuery, executeSearch, onSearch, onSuggestionSelect])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return

    const totalItems = suggestions.length + (hasHistory ? Math.min(searchHistory.length, 3) : 0)

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % totalItems)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev <= 0 ? totalItems - 1 : prev - 1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          if (selectedIndex < suggestions.length) {
            handleSuggestionSelect(suggestions[selectedIndex])
          } else {
            const historyIndex = selectedIndex - suggestions.length
            const historyItem = searchHistory[historyIndex]
            if (historyItem) {
              handleSuggestionSelect({ text: historyItem.query, type: 'recent' })
            }
          }
        } else {
          handleSearch()
        }
        break
      case 'Escape':
        setIsOpen(false)
        inputRef.current?.blur()
        break
    }
  }, [isOpen, selectedIndex, suggestions, searchHistory, hasHistory, handleSuggestionSelect, handleSearch])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  // Get suggestion icon
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'category': return <Tag className="h-4 w-4" />
      case 'location': return <MapPin className="h-4 w-4" />
      case 'recent': return <Clock className="h-4 w-4" />
      case 'popular': return <TrendingUp className="h-4 w-4" />
      default: return <Search className="h-4 w-4" />
    }
  }

  // Get suggestion color
  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'category': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      case 'location': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'recent': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
      case 'popular': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
      default: return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
    }
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(query.length > 0 || hasHistory)}
          placeholder={placeholder}
          className="pl-10 pr-12 h-12 text-base"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery('')
              setIsOpen(false)
              inputRef.current?.focus()
            }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {isOpen && (hasSuggestions || hasHistory || showInsights) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
          >
            {/* Search Insights */}
            {showInsights && query.length === 0 && (
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Search Insights
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {insights.searchFrequency}
                    </div>
                    <div className="text-xs text-gray-500">Searches</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {insights.averageResults}
                    </div>
                    <div className="text-xs text-gray-500">Avg Results</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {insights.clickThroughRate}%
                    </div>
                    <div className="text-xs text-gray-500">Click Rate</div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Searches */}
            {hasHistory && query.length === 0 && (
              <div className="p-2">
                <div className="flex items-center justify-between px-2 py-1 mb-2">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Recent Searches
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearHistory}
                    className="h-6 px-2 text-xs"
                  >
                    Clear
                  </Button>
                </div>
                {searchHistory.slice(0, 3).map((item, index) => (
                  <motion.button
                    key={`history-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSuggestionSelect({ text: item.query, type: 'recent' })}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors",
                      selectedIndex === suggestions.length + index
                        ? "bg-gray-100 dark:bg-gray-700"
                        : "hover:bg-gray-50 dark:hover:bg-gray-750"
                    )}
                  >
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                      {item.query}
                    </span>
                    <span className="text-xs text-gray-400">
                      {item.results} results
                    </span>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {hasSuggestions && (
              <>
                {hasHistory && query.length === 0 && <Separator />}
                <div className="p-2">
                  {query.length > 0 && (
                    <div className="flex items-center gap-2 px-2 py-1 mb-2">
                      <Search className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Suggestions
                      </span>
                    </div>
                  )}
                  {suggestions.map((suggestion, index) => (
                    <motion.button
                      key={suggestion.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleSuggestionSelect(suggestion)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors",
                        selectedIndex === index
                          ? "bg-gray-100 dark:bg-gray-700"
                          : "hover:bg-gray-50 dark:hover:bg-gray-750"
                      )}
                    >
                      <div className="text-gray-400">
                        {getSuggestionIcon(suggestion.type)}
                      </div>
                      <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                        {suggestion.text}
                      </span>
                      <Badge
                        variant="secondary"
                        className={cn("text-xs", getSuggestionColor(suggestion.type))}
                      >
                        {suggestion.type}
                      </Badge>
                      <ArrowRight className="h-3 w-3 text-gray-400" />
                    </motion.button>
                  ))}
                </div>
              </>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="p-4 text-center">
                <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                  Generating suggestions...
                </div>
              </div>
            )}

            {/* No Results */}
            {!isLoading && !hasSuggestions && !hasHistory && query.length > 0 && (
              <div className="p-4 text-center text-sm text-gray-500">
                No suggestions found. Press Enter to search anyway.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
