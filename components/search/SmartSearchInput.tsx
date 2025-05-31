"use client"

import type React from "react"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface SmartSearchInputProps {
  onSearch: (query: string) => void
  placeholder?: string
  className?: string
  showInsights?: boolean
  autoFocus?: boolean
}

export function SmartSearchInput({
  onSearch,
  placeholder = "Search...",
  className,
  showInsights = false,
  autoFocus = false,
}: SmartSearchInputProps) {
  const [query, setQuery] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    onSearch(value)
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn("pl-10", className)}
          autoFocus={autoFocus}
        />
      </div>
    </form>
  )
}
