"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Filter, Calendar, MapPin, DollarSign, Clock, Users, Star, X, ChevronDown, Sliders } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

interface FilterOption {
  id: string
  label: string
  value: any
  count?: number
}

interface FilterGroup {
  id: string
  label: string
  type: "checkbox" | "range" | "select" | "toggle" | "date"
  options?: FilterOption[]
  min?: number
  max?: number
  step?: number
  defaultValue?: any
}

interface AdvancedFiltersProps {
  filters: FilterGroup[]
  activeFilters: Record<string, any>
  onFiltersChange: (filters: Record<string, any>) => void
  onClearAll: () => void
  className?: string
}

export function AdvancedFilters({
  filters,
  activeFilters,
  onFiltersChange,
  onClearAll,
  className,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState(activeFilters)

  useEffect(() => {
    setLocalFilters(activeFilters)
  }, [activeFilters])

  const handleFilterChange = (groupId: string, value: any) => {
    const newFilters = { ...localFilters, [groupId]: value }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleClearFilter = (groupId: string) => {
    const newFilters = { ...localFilters }
    delete newFilters[groupId]
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const activeFilterCount = Object.keys(activeFilters).length

  const renderFilterControl = (group: FilterGroup) => {
    const value = localFilters[group.id]

    switch (group.type) {
      case "checkbox":
        return (
          <div className="space-y-3">
            {group.options?.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={option.id}
                  checked={value?.includes(option.value) || false}
                  onCheckedChange={(checked) => {
                    const currentValues = value || []
                    const newValues = checked
                      ? [...currentValues, option.value]
                      : currentValues.filter((v: any) => v !== option.value)
                    handleFilterChange(group.id, newValues.length > 0 ? newValues : undefined)
                  }}
                />
                <Label htmlFor={option.id} className="text-sm font-normal cursor-pointer">
                  {option.label}
                  {option.count && <span className="text-gray-500 ml-1">({option.count})</span>}
                </Label>
              </div>
            ))}
          </div>
        )

      case "range":
        return (
          <div className="space-y-4">
            <div className="px-2">
              <Slider
                value={value || [group.min || 0, group.max || 100]}
                onValueChange={(newValue) => handleFilterChange(group.id, newValue)}
                min={group.min || 0}
                max={group.max || 100}
                step={group.step || 1}
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>${value?.[0] || group.min || 0}</span>
              <span>${value?.[1] || group.max || 100}</span>
            </div>
          </div>
        )

      case "toggle":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={value || false}
              onCheckedChange={(checked) => handleFilterChange(group.id, checked || undefined)}
            />
            <Label className="text-sm font-normal">{group.label}</Label>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={cn("relative", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("relative", activeFilterCount > 0 && "border-purple-500 bg-purple-50 dark:bg-purple-900/20")}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2 bg-purple-600 text-white text-xs">
                {activeFilterCount}
              </Badge>
            )}
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-96 p-0" align="start" side="bottom">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sliders className="h-5 w-5" />
                  Advanced Filters
                </CardTitle>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearAll}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6 max-h-96 overflow-y-auto">
              {filters.map((group, index) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        {group.id === "price" && <DollarSign className="h-4 w-4" />}
                        {group.id === "date" && <Calendar className="h-4 w-4" />}
                        {group.id === "location" && <MapPin className="h-4 w-4" />}
                        {group.id === "time" && <Clock className="h-4 w-4" />}
                        {group.id === "capacity" && <Users className="h-4 w-4" />}
                        {group.id === "rating" && <Star className="h-4 w-4" />}
                        {group.label}
                      </Label>
                      {localFilters[group.id] && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleClearFilter(group.id)}
                          className="h-6 w-6 p-0 text-gray-500 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    {renderFilterControl(group)}
                  </div>

                  {index < filters.length - 1 && <Separator />}
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>

      {/* Active Filters Display */}
      <AnimatePresence>
        {activeFilterCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 flex flex-wrap gap-2"
          >
            {Object.entries(activeFilters).map(([key, value]) => {
              const group = filters.find((f) => f.id === key)
              if (!group || !value) return null

              let displayValue = value
              if (Array.isArray(value)) {
                displayValue = value.join(", ")
              } else if (group.type === "range") {
                displayValue = `$${value[0]} - $${value[1]}`
              }

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200 pr-1">
                    <span className="mr-1">{group.label}:</span>
                    <span className="font-medium">{displayValue}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleClearFilter(key)}
                      className="h-4 w-4 p-0 ml-1 hover:bg-purple-200"
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
