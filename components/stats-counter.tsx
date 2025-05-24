"use client"

import { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

interface StatsCounterProps {
  value: number
  label: string
  suffix?: string
  delay?: number
}

export function StatsCounter({ value, label, suffix = "", delay = 0 }: StatsCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const counterRef = useRef<HTMLDivElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    // Safely register ScrollTrigger plugin
    try {
      gsap.registerPlugin(ScrollTrigger)
    } catch (error) {
      console.warn("Failed to register ScrollTrigger:", error)
      return
    }

    const counter = counterRef.current
    if (!counter || hasAnimated.current) return

    const triggerAnimation = () => {
      hasAnimated.current = true

      try {
        // Animate the counter value
        const obj = { value: 0 }
        gsap.to(obj, {
          value: value,
          duration: 2,
          delay: delay,
          ease: "power2.out",
          onUpdate: () => {
            setDisplayValue(Math.round(obj.value))
          },
        })

        // Animate the counter appearance
        gsap.fromTo(
          counter,
          {
            y: 20,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            delay: delay,
            ease: "power3.out",
          },
        )
      } catch (error) {
        console.warn("Error creating GSAP animation:", error)
      }
    }

    try {
      ScrollTrigger.create({
        trigger: counter,
        start: "top bottom-=100",
        onEnter: triggerAnimation,
      })
    } catch (error) {
      console.warn("Error creating ScrollTrigger:", error)
    }

    return () => {
      try {
        ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
      } catch (error) {
        console.warn("Error cleaning up ScrollTrigger:", error)
      }
    }
  }, [value, delay])

  return (
    <div ref={counterRef} className="text-center">
      <div className="text-4xl md:text-5xl font-bold text-white mb-2">
        {displayValue}
        {suffix}
      </div>
      <div className="text-gray-400">{label}</div>
    </div>
  )
}
