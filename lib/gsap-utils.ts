"use client"

import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

// Track if plugins have been registered
let pluginsRegistered = false

/**
 * Safely register GSAP plugins
 * This prevents multiple registrations and handles errors gracefully
 */
export function registerGSAPPlugins() {
  if (typeof window === "undefined") {
    return false
  }

  if (pluginsRegistered) {
    return true
  }

  try {
    gsap.registerPlugin(ScrollTrigger)
    pluginsRegistered = true
    return true
  } catch (error) {
    console.warn("Failed to register GSAP plugins:", error)
    return false
  }
}

/**
 * Safely create a GSAP animation with error handling
 */
export function safeGSAP(callback: () => void) {
  if (!registerGSAPPlugins()) {
    return
  }

  try {
    callback()
  } catch (error) {
    console.warn("Error creating GSAP animation:", error)
  }
}

/**
 * Safely cleanup ScrollTrigger instances
 */
export function cleanupScrollTriggers() {
  if (typeof window === "undefined" || !pluginsRegistered) {
    return
  }

  try {
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
  } catch (error) {
    console.warn("Error cleaning up ScrollTrigger:", error)
  }
}

/**
 * Create a fade in animation with error handling
 */
export function createFadeInAnimation(
  element: HTMLElement,
  options: {
    y?: number
    duration?: number
    delay?: number
    ease?: string
    stagger?: number
  } = {}
) {
  const {
    y = 30,
    duration = 0.8,
    delay = 0,
    ease = "power3.out",
    stagger = 0
  } = options

  safeGSAP(() => {
    gsap.fromTo(
      element,
      { y, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration,
        delay,
        ease,
        stagger
      }
    )
  })
}

/**
 * Create a scroll-triggered animation with error handling
 */
export function createScrollAnimation(
  element: HTMLElement,
  options: {
    y?: number
    duration?: number
    delay?: number
    ease?: string
    start?: string
    toggleActions?: string
  } = {}
) {
  const {
    y = 30,
    duration = 0.8,
    delay = 0,
    ease = "power3.out",
    start = "top bottom-=100",
    toggleActions = "play none none none"
  } = options

  safeGSAP(() => {
    gsap.fromTo(
      element,
      { y, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration,
        delay,
        ease,
        scrollTrigger: {
          trigger: element,
          start,
          toggleActions
        }
      }
    )
  })
}

/**
 * Create a scale animation with error handling
 */
export function createScaleAnimation(
  element: HTMLElement,
  options: {
    scale?: number
    duration?: number
    delay?: number
    ease?: string
  } = {}
) {
  const {
    scale = 0.95,
    duration = 0.6,
    delay = 0,
    ease = "back.out(1.7)"
  } = options

  safeGSAP(() => {
    gsap.fromTo(
      element,
      { scale, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration,
        delay,
        ease
      }
    )
  })
}

/**
 * Create a counter animation with error handling
 */
export function createCounterAnimation(
  _element: HTMLElement,
  targetValue: number,
  onUpdate: (value: number) => void,
  options: {
    duration?: number
    delay?: number
    ease?: string
  } = {}
) {
  const {
    duration = 2,
    delay = 0,
    ease = "power2.out"
  } = options

  safeGSAP(() => {
    const obj = { value: 0 }
    gsap.to(obj, {
      value: targetValue,
      duration,
      delay,
      ease,
      onUpdate: () => {
        onUpdate(Math.round(obj.value))
      }
    })
  })
}

/**
 * Hook for components that need GSAP animations
 */
export function useGSAP() {
  return {
    registerPlugins: registerGSAPPlugins,
    safeGSAP,
    cleanup: cleanupScrollTriggers,
    createFadeIn: createFadeInAnimation,
    createScrollAnimation,
    createScaleAnimation,
    createCounterAnimation
  }
}
