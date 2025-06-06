"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

interface CSSGlobeProps {
  size?: number
  className?: string
}

export default function CSSGlobe({ size = 600, className = "" }: CSSGlobeProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  const markers = [
    { top: "20%", left: "30%", delay: 0 },
    { top: "35%", left: "70%", delay: 0.5 },
    { top: "50%", left: "15%", delay: 1 },
    { top: "65%", left: "80%", delay: 1.5 },
    { top: "40%", left: "45%", delay: 2 },
    { top: "75%", left: "25%", delay: 2.5 },
    { top: "25%", left: "85%", delay: 3 },
    { top: "60%", left: "60%", delay: 3.5 },
  ]

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size, maxWidth: "100%" }}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: isLoaded ? 1 : 0, scale: isLoaded ? 1 : 0.8 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative w-full h-full"
      >
        {/* Globe Base */}
        <div 
          className="relative w-full h-full rounded-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 shadow-2xl overflow-hidden"
          style={{
            background: `
              radial-gradient(circle at 30% 30%, rgba(139, 92, 246, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 70% 70%, rgba(59, 130, 246, 0.2) 0%, transparent 50%),
              linear-gradient(135deg, #1e293b 0%, #0f172a 100%)
            `,
            boxShadow: `
              inset 0 0 100px rgba(139, 92, 246, 0.1),
              0 0 100px rgba(139, 92, 246, 0.2),
              0 0 200px rgba(139, 92, 246, 0.1)
            `
          }}
        >
          {/* Grid Lines */}
          <div className="absolute inset-0 opacity-20">
            {/* Horizontal lines */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`h-${i}`}
                className="absolute w-full border-t border-purple-400/30"
                style={{ top: `${(i + 1) * 12.5}%` }}
              />
            ))}
            {/* Vertical lines */}
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={`v-${i}`}
                className="absolute h-full border-l border-purple-400/30"
                style={{ 
                  left: `${(i + 1) * 8.33}%`,
                  transform: `skew(${Math.sin((i * Math.PI) / 6) * 20}deg)`
                }}
              />
            ))}
          </div>

          {/* Continents Simulation */}
          <div className="absolute inset-0 opacity-40">
            {/* North America */}
            <div 
              className="absolute bg-green-600/60 rounded-full"
              style={{
                top: "15%",
                left: "10%",
                width: "25%",
                height: "30%",
                clipPath: "polygon(0% 20%, 60% 0%, 100% 40%, 80% 100%, 20% 80%)"
              }}
            />
            {/* Europe */}
            <div 
              className="absolute bg-green-600/60 rounded-full"
              style={{
                top: "20%",
                left: "45%",
                width: "15%",
                height: "20%",
                clipPath: "polygon(0% 0%, 100% 20%, 80% 100%, 20% 80%)"
              }}
            />
            {/* Asia */}
            <div 
              className="absolute bg-green-600/60"
              style={{
                top: "10%",
                left: "60%",
                width: "35%",
                height: "40%",
                clipPath: "polygon(0% 30%, 70% 0%, 100% 60%, 60% 100%, 0% 70%)"
              }}
            />
            {/* Africa */}
            <div 
              className="absolute bg-green-600/60"
              style={{
                top: "35%",
                left: "48%",
                width: "12%",
                height: "35%",
                clipPath: "polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)"
              }}
            />
            {/* South America */}
            <div 
              className="absolute bg-green-600/60"
              style={{
                top: "50%",
                left: "25%",
                width: "10%",
                height: "30%",
                clipPath: "polygon(0% 0%, 100% 20%, 80% 100%, 20% 100%)"
              }}
            />
            {/* Australia */}
            <div 
              className="absolute bg-green-600/60 rounded-full"
              style={{
                top: "70%",
                left: "75%",
                width: "8%",
                height: "6%"
              }}
            />
          </div>

          {/* Event Markers */}
          {markers.map((marker, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                delay: marker.delay,
                duration: 0.5,
                repeat: Infinity,
                repeatType: "reverse",
                repeatDelay: 4
              }}
              className="absolute w-3 h-3 bg-purple-400 rounded-full shadow-lg"
              style={{
                top: marker.top,
                left: marker.left,
                boxShadow: "0 0 10px rgba(139, 92, 246, 0.8), 0 0 20px rgba(139, 92, 246, 0.4)"
              }}
            >
              {/* Pulse effect */}
              <div className="absolute inset-0 bg-purple-400 rounded-full animate-ping opacity-75"></div>
            </motion.div>
          ))}

          {/* Rotating highlight */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 opacity-30"
            style={{
              background: `conic-gradient(from 0deg, transparent 0deg, rgba(139, 92, 246, 0.3) 45deg, transparent 90deg)`
            }}
          />

          {/* Glow overlay */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 70%)`
            }}
          />
        </div>

        {/* Orbital rings */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border-2 border-purple-400/20 rounded-full"
          style={{ transform: "rotateX(75deg)" }}
        />
        
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute inset-4 border border-blue-400/20 rounded-full"
          style={{ transform: "rotateY(75deg)" }}
        />
      </motion.div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -20, 0],
              x: [0, Math.sin(i) * 10, 0],
              opacity: [0.3, 0.8, 0.3]
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              delay: i * 0.5
            }}
            className="absolute w-1 h-1 bg-purple-400 rounded-full"
            style={{
              top: `${20 + i * 10}%`,
              left: `${15 + i * 12}%`
            }}
          />
        ))}
      </div>

      {/* Info tooltip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
        className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-gray-300 px-3 py-2 rounded-lg text-xs pointer-events-none"
      >
        Global Events Network
      </motion.div>
    </div>
  )
}
