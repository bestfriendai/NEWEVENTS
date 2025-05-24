"use client"

import { useRef, useEffect } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import type { LucideIcon } from "lucide-react"

interface AnimatedFeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  index: number
}

export function AnimatedFeatureCard({ icon: Icon, title, description, index }: AnimatedFeatureCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    // Safely register ScrollTrigger plugin
    try {
      gsap.registerPlugin(ScrollTrigger)
    } catch (error) {
      console.warn("Failed to register ScrollTrigger:", error)
      return
    }

    const card = cardRef.current
    if (!card) return

    try {
      gsap.fromTo(
        card,
        {
          y: 50,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top bottom-=100",
            toggleActions: "play none none none",
          },
          delay: index * 0.15,
        },
      )
    } catch (error) {
      console.warn("Error creating GSAP animation:", error)
    }

    return () => {
      try {
        ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
      } catch (error) {
        console.warn("Error cleaning up ScrollTrigger:", error)
      }
    }
  }, [index])

  return (
    <div
      ref={cardRef}
      className="bg-[#1A1D25]/80 backdrop-blur-md rounded-xl p-6 border border-gray-800 hover:border-purple-500/30 transition-all duration-300 hover:shadow-glow-sm hover:-translate-y-1"
    >
      <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg p-3 w-12 h-12 flex items-center justify-center mb-4">
        <Icon className="text-purple-400 h-6 w-6" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  )
}
