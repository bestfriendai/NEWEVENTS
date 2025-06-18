"use client"

import type React from "react"

import { useState, useCallback, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Filter, Loader2, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { logger } from "@/lib/utils/logger"

interface AdvancedFiltersProps {
  isFiltering: boolean
  handleFilter: () => void | Promise<void>
  onFiltersChange?: (filters: any) => void
}

interface FilterState {
  dateRange: { start: string; end: string }
  priceRange: [number, number]
  eventTypes: string[]
}

export function AdvancedFilters({ isFiltering, handleFilter, onFiltersChange }: AdvancedFiltersProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>({
    dateRange: { start: "", end: "" },
    priceRange: [0, 100],
    eventTypes: [],
  })
  const [isApplying, setIsApplying] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [lastApplied, setLastApplied] = useState<FilterState | null>(null)
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

  // Check for changes
  useEffect(() => {
    const filtersChanged = JSON.stringify(localFilters) !== JSON.stringify(lastApplied)
    setHasChanges(filtersChanged)
  }, [localFilters, lastApplied])

  // Sync with external filtering state
  useEffect(() => {
    setIsApplying(isFiltering)
  }, [isFiltering])

  const updateLocalFilters = useCallback((updates: Partial<FilterState>) => {
    if (!mountedRef.current) return

    setLocalFilters((prev) => {
      const newFilters = { ...prev, ...updates }
      logger.info("Party filters updated locally", {
        component: "AdvancedFilters",
        updates,
        newFilters,
      })
      return newFilters
    })
  }, [])

  const toggleEventType = useCallback(
    (type: string) => {
      const newTypes = localFilters.eventTypes.includes(type)
        ? localFilters.eventTypes.filter((t) => t !== type)
        : [...localFilters.eventTypes, type]

      updateLocalFilters({ eventTypes: newTypes })
    },
    [localFilters.eventTypes, updateLocalFilters],
  )

  const handleApplyFilters = useCallback(
    async (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault()
        e.stopPropagation()
      }

      if (isApplying || !hasChanges) {
        logger.warn("Party filters apply blocked", {
          component: "AdvancedFilters",
          isApplying,
          hasChanges,
          reason: isApplying ? "already_applying" : "no_changes",
        })
        return
      }

      try {
        setIsApplying(true)

        logger.info("Applying party filters", {
          component: "AdvancedFilters",
          filters: localFilters,
        })

        // Notify parent of filter changes
        if (onFiltersChange) {
          onFiltersChange(localFilters)
        }

        // Apply filters with visual feedback
        await new Promise((resolve) => {
          applyTimeoutRef.current = setTimeout(async () => {
            if (mountedRef.current) {
              try {
                await handleFilter()
                setLastApplied({ ...localFilters })
                setHasChanges(false)
                resolve(void 0)
              } catch (error) {
                logger.error("Filter application failed", {
                  component: "AdvancedFilters",
                  error: error instanceof Error ? error.message : "Unknown error",
                })
                resolve(void 0)
              }
            }
          }, 200)
        })
      } catch (error) {
        logger.error("Failed to apply party filters", {
          component: "AdvancedFilters",
          error: error instanceof Error ? error.message : "Unknown error",
        })
      } finally {
        if (mountedRef.current) {
          setIsApplying(false)
        }
      }
    },
    [isApplying, hasChanges, localFilters, handleFilter, onFiltersChange],
  )

  const handleReset = useCallback(() => {
    const defaultFilters: FilterState = {
      dateRange: { start: "", end: "" },
      priceRange: [0, 100],
      eventTypes: [],
    }

    setLocalFilters(defaultFilters)
    setLastApplied(null)
    setHasChanges(false)

    logger.info("Party filters reset", {
      component: "AdvancedFilters",
    })
  }, [])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleApplyFilters()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleApplyFilters])

  const eventTypes = [
    { id: "nightclub", label: "Nightclub" },
    { id: "festival", label: "Festival" },
    { id: "concert", label: "Concert" },
    { id: "warehouse", label: "Warehouse" },
    { id: "rooftop", label: "Rooftop" },
  ]

  return (
    <motion.div
      id="filter-section"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      className="mb-8"
    >
      <Card className="bg-[#1A1D25] border-gray-800 rounded-xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-100">Advanced Filters</h2>
            {hasChanges && <Badge className="bg-yellow-600 text-white text-xs">Modified</Badge>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3">Date Range</h3>
              <div className="flex space-x-2">
                <Input
                  type="date"
                  value={localFilters.dateRange.start}
                  onChange={(e) =>
                    updateLocalFilters({
                      dateRange: { ...localFilters.dateRange, start: e.target.value },
                    })
                  }
                  className="bg-[#22252F] border-gray-800 rounded-lg text-gray-300 text-sm focus-visible:ring-purple-500"
                  disabled={isApplying}
                />
                <Input
                  type="date"
                  value={localFilters.dateRange.end}
                  onChange={(e) =>
                    updateLocalFilters({
                      dateRange: { ...localFilters.dateRange, end: e.target.value },
                    })
                  }
                  className="bg-[#22252F] border-gray-800 rounded-lg text-gray-300 text-sm focus-visible:ring-purple-500"
                  disabled={isApplying}
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3">
                Price Range (${localFilters.priceRange[0]} - ${localFilters.priceRange[1]})
              </h3>
              <div className="px-2">
                <Slider
                  value={localFilters.priceRange}
                  onValueChange={(value) => updateLocalFilters({ priceRange: value as [number, number] })}
                  max={200}
                  step={5}
                  className="mb-2"
                  disabled={isApplying}
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>$0</span>
                  <span>$200+</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3">Event Type</h3>
              <div className="flex flex-wrap gap-2">
                {eventTypes.map((type) => (
                  <Badge
                    key={type.id}
                    className={cn(
                      "cursor-pointer border-0 transition-colors",
                      localFilters.eventTypes.includes(type.id)
                        ? "bg-purple-600 hover:bg-purple-700 text-white"
                        : "bg-[#22252F] hover:bg-[#2A2E38] text-gray-300",
                    )}
                    onClick={() => !isApplying && toggleEventType(type.id)}
                  >
                    {type.label}
                    {localFilters.eventTypes.includes(type.id) && <CheckCircle className="w-3 h-3 ml-1" />}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Separator className="my-6 bg-gray-800" />

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              {hasChanges ? "Filters modified - click Apply to update results" : "Filters applied"}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="bg-[#22252F] hover:bg-[#2A2E38] text-gray-300 border-gray-800 rounded-lg"
                onClick={handleReset}
                disabled={isApplying}
              >
                Reset
              </Button>
              <Button
                className={cn(
                  "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg shadow-glow-sm transition-all duration-300 disabled:opacity-50",
                  isApplying && "opacity-90",
                )}
                onClick={handleApplyFilters}
                disabled={isApplying || !hasChanges}
              >
                {isApplying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Filter className="mr-2 h-4 w-4" />
                    Apply Filters{hasChanges && " *"}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="mt-4 text-xs text-gray-500 text-center">Press Ctrl+Enter to apply filters</div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
