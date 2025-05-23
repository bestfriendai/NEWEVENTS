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

    gsap.registerPlugin(ScrollTrigger)

    const counter = counterRef.current
    if (!counter || hasAnimated.current) return

    const triggerAnimation = () => {
      hasAnimated.current = true

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
    }

    ScrollTrigger.create({
      trigger: counter,
      start: "top bottom-=100",
      onEnter: triggerAnimation,
    })

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
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
