"use client"

import type React from "react"

import { useState, useCallback, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { X, SlidersHorizontal, Tag, Calendar, DollarSign, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { DateRangePicker } from "@/components/date-range-picker"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import type { EventFilters } from "@/components/events/EventFilters"
import { logger } from "@/lib/utils/logger"

interface MapFiltersPanelProps {
  filters: EventFilters
  onFiltersChange: (filters: EventFilters) => void
  onClose: () => void
  eventCount: number
}

const CATEGORIES = [
  { id: "Music", label: "Music", icon: "🎵" },
  { id: "Arts", label: "Arts & Culture", icon: "🎨" },
  { id: "Sports", label: "Sports", icon: "⚽" },
  { id: "Food", label: "Food & Drink", icon: "🍽️" },
  { id: "Business", label: "Business", icon: "💼" },
  { id: "Event", label: "Other Events", icon: "🎪" },
]

export function MapFiltersPanel({ filters, onFiltersChange, onClose, eventCount }: MapFiltersPanelProps) {
  const [localFilters, setLocalFilters] = useState<EventFilters>(filters)
  const [isApplying, setIsApplying] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const applyTimeoutRef = useRef<NodeJS.Timeout>()
  const mountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (applyTimeoutRef.current) {
        clearTimeout(applyTimeoutRef.current)
      }
    }
  }, [])

  // Sync with external filters
  useEffect(() => {
    setLocalFilters(filters)
    setHasChanges(false)
  }, [filters])

  // Check for changes
  useEffect(() => {
    const filtersChanged = JSON.stringify(localFilters) !== JSON.stringify(filters)
    setHasChanges(filtersChanged)
  }, [localFilters, filters])

  const updateFilters = useCallback((updates: Partial<EventFilters>) => {
    if (!mountedRef.current) return

    setLocalFilters((prev) => {
      const newFilters = { ...prev, ...updates }
      logger.info("Map filters updated locally", {
        component: "MapFiltersPanel",
        updates,
        newFilters,
      })
      return newFilters
    })
  }, [])

  const handleCategoryToggle = useCallback(
    (categoryId: string) => {
      const newCategories = localFilters.categories.includes(categoryId)
        ? localFilters.categories.filter((id) => id !== categoryId)
        : [...localFilters.categories, categoryId]

      updateFilters({ categories: newCategories })
    },
    [localFilters.categories, updateFilters],
  )

  const handleApplyFilters = useCallback(
    async (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault()
        e.stopPropagation()
      }

      if (isApplying || !hasChanges) {
        logger.warn("Map filters apply blocked", {
          component: "MapFiltersPanel",
          isApplying,
          hasChanges,
        })
        return
      }

      try {
        setIsApplying(true)

        logger.info("Applying map filters", {
          component: "MapFiltersPanel",
          filters: localFilters,
        })

        // Apply with visual feedback
        await new Promise((resolve) => {
          applyTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              onFiltersChange(localFilters)
              setHasChanges(false)
              resolve(void 0)
            }
          }, 150)
        })

        // Close panel after successful application
        if (mountedRef.current) {
          onClose()
        }
      } catch (error) {
        logger.error("Failed to apply map filters", {
          component: "MapFiltersPanel",
          error: error instanceof Error ? error.message : "Unknown error",
        })
      } finally {
        if (mountedRef.current) {
          setIsApplying(false)
        }
      }
    },
    [isApplying, hasChanges, localFilters, onFiltersChange, onClose],
  )

  const clearAllFilters = useCallback(() => {
    const defaultFilters: EventFilters = {
      categories: [],
      dateRange: null,
      priceRange: { min: 0, max: 500 },
      distance: 25,
      searchQuery: "",
      sortBy: "date",
      sortOrder: "asc",
    }
    setLocalFilters(defaultFilters)

    logger.info("Map filters cleared", {
      component: "MapFiltersPanel",
    })
  }, [])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleApplyFilters()
      } else if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleApplyFilters, onClose])

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed left-0 top-0 h-full w-80 bg-[#1A1D25]/95 backdrop-blur-md border-r border-gray-800 z-50 overflow-y-auto"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <SlidersHorizontal className="h-5 w-5 text-purple-400 mr-2" />
              <h2 className="text-xl font-bold text-white">Map Filters</h2>
              {hasChanges && <Badge className="ml-2 bg-yellow-600 text-white text-xs">Modified</Badge>}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
              disabled={isApplying}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Results Count */}
          <div className="mb-6 p-3 bg-purple-600/10 border border-purple-500/20 rounded-lg">
            <p className="text-purple-400 text-sm text-center">
              {eventCount} events found
              {hasChanges && " (filters modified)"}
            </p>
          </div>

          {/* Categories */}
          <div className="mb-6">
            <Label className="text-white mb-3 block flex items-center">
              <Tag className="h-4 w-4 mr-2" />
              Categories
            </Label>
            <div className="space-y-2">
              {CATEGORIES.map((category) => (
                <div key={category.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={category.id}
                    checked={localFilters.categories.includes(category.id)}
                    onCheckedChange={() => handleCategoryToggle(category.id)}
                    className="border-gray-600"
                    disabled={isApplying}
                  />
                  <Label
                    htmlFor={category.id}
                    className="text-sm text-gray-300 cursor-pointer flex items-center flex-1"
                  >
                    <span className="mr-2">{category.icon}</span>
                    {category.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator className="my-6 bg-gray-700" />

          {/* Date Range */}
          <div className="mb-6">
            <Label className="text-white mb-3 block flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Date Range
            </Label>
            <DateRangePicker
              {...(localFilters.dateRange
                ? {
                    dateRange: {
                      from: localFilters.dateRange.start,
                      to: localFilters.dateRange.end,
                    },
                  }
                : {})}
              onDateRangeChange={(dateRange) => {
                const newDateRange =
                  dateRange && dateRange.from && dateRange.to
                    ? {
                        start: dateRange.from,
                        end: dateRange.to,
                      }
                    : null
                updateFilters({ dateRange: newDateRange })
              }}
              disabled={isApplying}
            />
          </div>

          <Separator className="my-6 bg-gray-700" />

          {/* Price Range */}
          <div className="mb-6">
            <Label className="text-white mb-3 block flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Price Range
            </Label>
            <div className="px-2">
              <Slider
                value={[localFilters.priceRange.min, localFilters.priceRange.max]}
                onValueChange={([min, max]) => {
                  if (min !== undefined && max !== undefined) {
                    updateFilters({ priceRange: { min, max } })
                  }
                }}
                max={500}
                step={10}
                className="mb-3"
                disabled={isApplying}
              />
              <div className="flex justify-between text-sm text-gray-400">
                <span>${localFilters.priceRange.min}</span>
                <span>${localFilters.priceRange.max}+</span>
              </div>
            </div>
          </div>

          <Separator className="my-6 bg-gray-700" />

          {/* Distance */}
          <div className="mb-6">
            <Label className="text-white mb-3 block flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Distance ({localFilters.distance} miles)
            </Label>
            <div className="px-2">
              <Slider
                value={[localFilters.distance]}
                onValueChange={([distance]) => {
                  if (distance !== undefined) {
                    updateFilters({ distance })
                  }
                }}
                max={100}
                step={5}
                className="mb-3"
                disabled={isApplying}
              />
              <div className="flex justify-between text-sm text-gray-400">
                <span>1 mile</span>
                <span>100+ miles</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={clearAllFilters}
              className="flex-1 border-gray-700 text-gray-400 hover:text-white"
              disabled={isApplying}
            >
              Clear All
            </Button>
            <Button
              onClick={handleApplyFilters}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
              disabled={isApplying || !hasChanges}
            >
              {isApplying ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                  Applying...
                </>
              ) : (
                <>Apply Filters{hasChanges && " *"}</>
              )}
            </Button>
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="mt-4 text-xs text-gray-500 text-center">Press Ctrl+Enter to apply • Esc to close</div>
        </div>
      </motion.div>
    </>
  )
}
