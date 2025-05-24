"use client"

import type React from "react"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { useIsMobile } from "@/hooks/use-mobile"
import { logger } from "@/lib/utils/logger"

interface AnimatedTextProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function AnimatedText({ children, className = "", delay = 0 }: AnimatedTextProps) {
  const textRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

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
      logger.warn("Error creating GSAP animation", {
        component: "AnimatedText",
        action: "gsap_animation_error",
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }, [delay, isMobile])

  return (
    <div ref={textRef} className={className}>
      {children}
    </div>
  )
}
