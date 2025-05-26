"use client"

import { motion } from "framer-motion"
import { X, SlidersHorizontal, Tag, Calendar, DollarSign, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { DateRangePicker } from "@/components/date-range-picker"
import { Separator } from "@/components/ui/separator"
import type { EventFilters } from "@/components/events/EventFilters"

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
  const updateFilters = (updates: Partial<EventFilters>) => {
    onFiltersChange({ ...filters, ...updates })
  }

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter((id) => id !== categoryId)
      : [...filters.categories, categoryId]

    updateFilters({ categories: newCategories })
  }

  const clearAllFilters = () => {
    const defaultFilters: EventFilters = {
      categories: [],
      dateRange: null,
      priceRange: { min: 0, max: 500 },
      distance: 25,
      searchQuery: "",
      sortBy: "date",
      sortOrder: "asc",
    }
    onFiltersChange(defaultFilters)
  }

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
              <h2 className="text-xl font-bold text-white">Filters</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Results Count */}
          <div className="mb-6 p-3 bg-purple-600/10 border border-purple-500/20 rounded-lg">
            <p className="text-purple-400 text-sm text-center">{eventCount} events found</p>
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
                    checked={filters.categories.includes(category.id)}
                    onCheckedChange={() => handleCategoryToggle(category.id)}
                    className="border-gray-600"
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
              {...(filters.dateRange
                ? {
                    dateRange: {
                      from: filters.dateRange.start,
                      to: filters.dateRange.end,
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
                value={[filters.priceRange.min, filters.priceRange.max]}
                onValueChange={([min, max]) => {
                  if (min !== undefined && max !== undefined) {
                    updateFilters({ priceRange: { min, max } })
                  }
                }}
                max={500}
                step={10}
                className="mb-3"
              />
              <div className="flex justify-between text-sm text-gray-400">
                <span>${filters.priceRange.min}</span>
                <span>${filters.priceRange.max}+</span>
              </div>
            </div>
          </div>

          <Separator className="my-6 bg-gray-700" />

          {/* Distance */}
          <div className="mb-6">
            <Label className="text-white mb-3 block flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Distance ({filters.distance} miles)
            </Label>
            <div className="px-2">
              <Slider
                value={[filters.distance]}
                onValueChange={([distance]) => {
                  if (distance !== undefined) {
                    updateFilters({ distance })
                  }
                }}
                max={100}
                step={5}
                className="mb-3"
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
            >
              Clear All
            </Button>
            <Button onClick={onClose} className="flex-1 bg-purple-600 hover:bg-purple-700">
              Apply Filters
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  )
}
