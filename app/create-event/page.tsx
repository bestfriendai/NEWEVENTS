"use client"

import { useState } from "react"
import { AppLayout } from "@/components/app-layout"
import { ProgressSteps } from "@/components/create-event/progress-steps"
import { BasicInfoStep } from "@/components/create-event/basic-info-step"
import { LocationStep } from "@/components/create-event/location-step"
import { DetailsStep } from "@/components/create-event/details-step"
import { ReviewStep } from "@/components/create-event/review-step"

export default function CreateEventPage() {
  const [activeStep, setActiveStep] = useState(1)
  const [eventLocation, setEventLocation] = useState<{ address: string; lat: number; lng: number } | null>(null)

  const handleLocationSelect = (location: { address: string; lat: number; lng: number }) => {
    setEventLocation(location)
  }

  const handleNextStep = () => {
    setActiveStep((prev) => Math.min(prev + 1, 4))
  }

  const handlePrevStep = () => {
    setActiveStep((prev) => Math.max(prev - 1, 1))
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-6">Create New Event</h1>

        {/* Progress Steps */}
        <ProgressSteps
          activeStep={activeStep}
          handleNextStep={handleNextStep}
          handlePrevStep={handlePrevStep}
          isLastStep={activeStep === 4}
        />

        {/* Form Steps */}
        <div className="max-w-3xl mx-auto">
          {/* Step 1: Basic Info */}
          {activeStep === 1 && <BasicInfoStep handleNextStep={handleNextStep} />}

          {/* Step 2: Location */}
          {activeStep === 2 && <LocationStep eventLocation={eventLocation} onLocationSelect={handleLocationSelect} />}

          {/* Step 3: Details */}
          {activeStep === 3 && <DetailsStep />}

          {/* Step 4: Review */}
          {activeStep === 4 && <ReviewStep />}
        </div>
      </div>
    </AppLayout>
  )
}
