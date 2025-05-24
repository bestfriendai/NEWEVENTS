"use client"

import { useRef, useEffect } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

interface TestimonialCardProps {
  avatar: string
  name: string
  location: string
  quote: string
  index: number
}

export function TestimonialCard({ avatar, name, location, quote, index }: TestimonialCardProps) {
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
          y: 30,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top bottom-=50",
            toggleActions: "play none none none",
          },
          delay: index * 0.2,
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
      className="bg-[#1A1D25]/80 backdrop-blur-md rounded-xl p-6 border border-gray-800 hover:border-purple-500/30 transition-all duration-300 hover:shadow-glow-sm"
    >
      <div className="flex items-center mb-4">
        <img src={avatar || "/placeholder.svg"} alt={name} className="w-12 h-12 rounded-full mr-4" />
        <div>
          <h4 className="text-white font-medium">{name}</h4>
          <p className="text-gray-400 text-sm">{location}</p>
        </div>
      </div>
      <p className="text-gray-300">{quote}</p>
    </div>
  )
}
