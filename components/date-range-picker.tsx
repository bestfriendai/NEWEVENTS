"use client"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DateRangePickerProps {
  className?: string
  dateRange?: DateRange
  onDateRangeChange?: (dateRange: DateRange | undefined) => void
  // Additional props for compatibility
  value?: { start: Date; end: Date } | null
  onChange?: (value: { start: Date; end: Date } | null) => void
  placeholder?: string
}

export function DateRangePicker({
  className,
  dateRange,
  onDateRangeChange,
  value,
  onChange,
  placeholder = "Pick a date range"
}: DateRangePickerProps) {
  // Handle both prop patterns for compatibility
  const currentRange = dateRange || (value ? { from: value.start, to: value.end } : undefined)

  const handleDateChange = (range: DateRange | undefined) => {
    // Call the original handler if provided
    onDateRangeChange?.(range)

    // Call the new handler if provided
    if (onChange) {
      if (range?.from && range?.to) {
        onChange({ start: range.from, end: range.to })
      } else {
        onChange(null)
      }
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal bg-[#22252F] border-gray-800/50 hover:bg-[#2A2E38] text-gray-300 rounded-lg",
              !dateRange && "text-gray-500",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-purple-400" />
            {currentRange?.from ? (
              currentRange.to ? (
                <>
                  {format(currentRange.from, "LLL dd, y")} - {format(currentRange.to, "LLL dd, y")}
                </>
              ) : (
                format(currentRange.from, "LLL dd, y")
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-[#1A1D25] border-gray-800" align="start">
          <Calendar
            initialFocus
            mode="range"
            {...(currentRange?.from && { defaultMonth: currentRange.from })}
            selected={currentRange}
            onSelect={handleDateChange}
            numberOfMonths={2}
            className="bg-[#1A1D25] text-gray-300"
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

// For backward compatibility, also export as DatePickerWithRange
export { DateRangePicker as DatePickerWithRange }
