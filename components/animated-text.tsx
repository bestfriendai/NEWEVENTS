"use client"

import type React from "react"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { useMobile } from "@/hooks/use-mobile"

interface AnimatedTextProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function AnimatedText({ children, className = "", delay = 0 }: AnimatedTextProps) {
  const textRef = useRef<HTMLDivElement>(null)
  const isMobile = useMobile()

  useEffect(() => {
    if (typeof window === "undefined") return

    const element = textRef.current
    if (!element) return

    try {
      // Simple animation for mobile
      if (isMobile) {
        gsap.fromTo(
          element,
          {
            y: 20,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            delay: delay,
          },
        )
        return
      }

      // More complex animation for desktop
      gsap.fromTo(
        element,
        {
          y: 30,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power4.out",
          delay: delay,
        },
      )
    } catch (error) {
      console.warn("Error creating GSAP animation:", error)
    }
  }, [delay, isMobile])

  return (
    <div ref={textRef} className={className}>
      {children}
    </div>
  )
}
