"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Filter, X, Calendar, MapPin, DollarSign, Tag, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { DateRangePicker } from "@/components/date-range-picker"
import { Separator } from "@/components/ui/separator"
import { logger } from "@/lib/utils/logger"

export interface EventFilters {
  categories: string[]
  dateRange: { start: Date; end: Date } | null
  priceRange: { min: number; max: number }
  distance: number
  searchQuery: string
  sortBy: 'date' | 'distance' | 'popularity' | 'price'
  sortOrder: 'asc' | 'desc'
}

interface EventFiltersProps {
  filters: EventFilters
  onFiltersChange: (filters: EventFilters) => void
  isOpen: boolean
  onToggle: () => void
  className?: string
}

const CATEGORIES = [
  { id: 'Music', label: 'Music', icon: '🎵' },
  { id: 'Arts', label: 'Arts & Culture', icon: '🎨' },
  { id: 'Sports', label: 'Sports', icon: '⚽' },
  { id: 'Food', label: 'Food & Drink', icon: '🍽️' },
  { id: 'Business', label: 'Business', icon: '💼' },
  { id: 'Event', label: 'Other Events', icon: '🎪' }
]

const SORT_OPTIONS = [
  { value: 'date', label: 'Date' },
  { value: 'distance', label: 'Distance' },
  { value: 'popularity', label: 'Popularity' },
  { value: 'price', label: 'Price' }
]

export function EventFilters({ filters, onFiltersChange, isOpen, onToggle, className }: EventFiltersProps) {
  const [localFilters, setLocalFilters] = useState<EventFilters>(filters)

  const updateFilters = (updates: Partial<EventFilters>) => {
    const newFilters = { ...localFilters, ...updates }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
    
    logger.info("Filters updated", {
      component: "EventFilters",
      action: "filters_update",
      metadata: { updates, newFilters }
    })
  }

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = localFilters.categories.includes(categoryId)
      ? localFilters.categories.filter(id => id !== categoryId)
      : [...localFilters.categories, categoryId]
    
    updateFilters({ categories: newCategories })
  }

  const clearAllFilters = () => {
    const defaultFilters: EventFilters = {
      categories: [],
      dateRange: null,
      priceRange: { min: 0, max: 500 },
      distance: 50,
      searchQuery: '',
      sortBy: 'date',
      sortOrder: 'asc'
    }
    
    setLocalFilters(defaultFilters)
    onFiltersChange(defaultFilters)
    
    logger.info("All filters cleared", {
      component: "EventFilters",
      action: "clear_all_filters"
    })
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (localFilters.categories.length > 0) count++
    if (localFilters.dateRange) count++
    if (localFilters.priceRange.min > 0 || localFilters.priceRange.max < 500) count++
    if (localFilters.distance < 50) count++
    if (localFilters.searchQuery.trim()) count++
    return count
  }

  return (
    <>
      {/* Filter Toggle Button */}
      <Button
        variant="outline"
        onClick={onToggle}
        className="border-gray-700 text-gray-400 hover:text-white relative"
      >
        <Filter className="h-4 w-4 mr-2" />
        Filter Events
        {getActiveFilterCount() > 0 && (
          <Badge className="ml-2 bg-purple-600 text-white text-xs px-1.5 py-0.5 min-w-[1.25rem] h-5">
            {getActiveFilterCount()}
          </Badge>
        )}
      </Button>

      {/* Filter Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={onToggle}
            />

            {/* Filter Sidebar */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-80 bg-[#1A1D25] border-l border-gray-800 z-50 overflow-y-auto"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <SlidersHorizontal className="h-5 w-5 text-purple-400 mr-2" />
                    <h2 className="text-xl font-bold text-white">Filters</h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggle}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Search */}
                <div className="mb-6">
                  <Label className="text-white mb-2 block">Search Events</Label>
                  <Input
                    placeholder="Search by title, location, or description..."
                    value={localFilters.searchQuery}
                    onChange={(e) => updateFilters({ searchQuery: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <Separator className="my-6 bg-gray-700" />

                {/* Categories */}
                <div className="mb-6">
                  <Label className="text-white mb-3 block flex items-center">
                    <Tag className="h-4 w-4 mr-2" />
                    Categories
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIES.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={category.id}
                          checked={localFilters.categories.includes(category.id)}
                          onCheckedChange={() => handleCategoryToggle(category.id)}
                          className="border-gray-600"
                        />
                        <Label
                          htmlFor={category.id}
                          className="text-sm text-gray-300 cursor-pointer flex items-center"
                        >
                          <span className="mr-1">{category.icon}</span>
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
                    dateRange={localFilters.dateRange ? {
                      from: localFilters.dateRange.start,
                      to: localFilters.dateRange.end
                    } : undefined}
                    onDateRangeChange={(dateRange) => {
                      const newDateRange = dateRange && dateRange.from && dateRange.to ? {
                        start: dateRange.from,
                        end: dateRange.to
                      } : null
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
                      value={[localFilters.priceRange.min, localFilters.priceRange.max]}
                      onValueChange={([min, max]) => updateFilters({ priceRange: { min, max } })}
                      max={500}
                      step={10}
                      className="mb-3"
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
                      onValueChange={([distance]) => updateFilters({ distance })}
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

                <Separator className="my-6 bg-gray-700" />

                {/* Sort Options */}
                <div className="mb-6">
                  <Label className="text-white mb-3 block">Sort By</Label>
                  <div className="flex gap-2">
                    <Select
                      value={localFilters.sortBy}
                      onValueChange={(sortBy: any) => updateFilters({ sortBy })}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SORT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={localFilters.sortOrder}
                      onValueChange={(sortOrder: any) => updateFilters({ sortOrder })}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">↑</SelectItem>
                        <SelectItem value="desc">↓</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={clearAllFilters}
                    className="flex-1 border-gray-700 text-gray-400 hover:text-white"
                  >
                    Clear All
                  </Button>
                  <Button
                    onClick={onToggle}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
