"use client"

import { Check, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ProgressStepsProps {
  activeStep: number
  handleNextStep: () => void
  handlePrevStep: () => void
  isLastStep?: boolean
}

export function ProgressSteps({ activeStep, handleNextStep, handlePrevStep, isLastStep = false }: ProgressStepsProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                step < activeStep
                  ? "bg-green-500 text-white"
                  : step === activeStep
                    ? "bg-purple-600 text-white"
                    : "bg-gray-800 text-gray-400"
              }`}
            >
              {step < activeStep ? <Check className="h-5 w-5" /> : step}
            </div>
            <span className={`text-sm ${step === activeStep ? "text-purple-400" : "text-gray-400"}`}>
              {step === 1 && "Basic Info"}
              {step === 2 && "Location"}
              {step === 3 && "Details"}
              {step === 4 && "Review"}
            </span>
          </div>
        ))}
      </div>

      {/* Progress Line */}
      <div className="relative max-w-2xl mx-auto mt-4">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800 rounded-full"></div>
        <div
          className="absolute top-0 left-0 h-1 bg-purple-600 rounded-full transition-all duration-300"
          style={{ width: `${(activeStep - 1) * 33.33}%` }}
        ></div>
      </div>

      {/* Navigation Buttons */}
      {activeStep > 1 && (
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={handlePrevStep} className="border-gray-700 text-gray-300">
            Back
          </Button>
          <Button
            onClick={handleNextStep}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
          >
            {isLastStep ? (
              "Create Event"
            ) : (
              <>
                Next Step <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
