"use client"

import { ArrowLeft } from "lucide-react"
import { Button } from "./button"

export function BackButton() {
  return (
    <Button 
      variant="outline" 
      className="border-gray-600 text-gray-300 hover:bg-gray-800"
      onClick={() => window.history.back()}
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      Go Back
    </Button>
  )
}