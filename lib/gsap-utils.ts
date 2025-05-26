"use client"

import { useCallback, useRef } from "react"

export function useGSAP() {
  const timelineRef = useRef<any>(null)

  const safeGSAP = useCallback((callback: () => void) => {
    if (typeof window !== "undefined") {
      try {
        callback()
      } catch (error) {
        console.warn("GSAP animation failed:", error)
      }
    }
  }, [])

  const createFadeIn = useCallback(
    (element: HTMLElement, options: any = {}) => {
      if (typeof window === "undefined" || !element) return

      safeGSAP(() => {
        import("gsap").then(({ gsap }) => {
          gsap.fromTo(
            element,
            { opacity: 0, y: options.y || 20 },
            {
              opacity: 1,
              y: 0,
              duration: options.duration || 1,
              delay: options.delay || 0,
              ease: options.ease || "power2.out",
            },
          )
        })
      })
    },
    [safeGSAP],
  )

  const createScaleAnimation = useCallback(
    (element: HTMLElement, options: any = {}) => {
      if (typeof window === "undefined" || !element) return

      safeGSAP(() => {
        import("gsap").then(({ gsap }) => {
          gsap.fromTo(
            element,
            { scale: options.scale || 0.8, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              duration: options.duration || 0.8,
              delay: options.delay || 0,
              ease: options.ease || "back.out(1.7)",
            },
          )
        })
      })
    },
    [safeGSAP],
  )

  const cleanup = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.kill()
    }
  }, [])

  return {
    safeGSAP,
    createFadeIn,
    createScaleAnimation,
    cleanup,
  }
}
