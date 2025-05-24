// Animation variants and utilities for consistent animations across the app

import type { Variants } from "framer-motion"

// Common easing functions
export const easings = {
  easeOut: [0.0, 0.0, 0.2, 1],
  easeIn: [0.4, 0.0, 1, 1],
  easeInOut: [0.4, 0.0, 0.2, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
  spring: { type: "spring", damping: 25, stiffness: 120 },
  springBounce: { type: "spring", damping: 15, stiffness: 100 },
} as const

// Fade animations
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
}

export const fadeInLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
}

export const fadeInRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
}

// Scale animations
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
}

export const scaleInBounce: Variants = {
  initial: { opacity: 0, scale: 0.3 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: easings.springBounce
  },
  exit: { opacity: 0, scale: 0.95 },
}

// Slide animations
export const slideInUp: Variants = {
  initial: { y: "100%" },
  animate: { y: 0 },
  exit: { y: "100%" },
}

export const slideInDown: Variants = {
  initial: { y: "-100%" },
  animate: { y: 0 },
  exit: { y: "-100%" },
}

export const slideInLeft: Variants = {
  initial: { x: "-100%" },
  animate: { x: 0 },
  exit: { x: "-100%" },
}

export const slideInRight: Variants = {
  initial: { x: "100%" },
  animate: { x: 0 },
  exit: { x: "100%" },
}

// Stagger animations
export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: easings.easeOut }
  },
}

// Card animations
export const cardHover: Variants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.02,
    transition: { duration: 0.2, ease: easings.easeOut }
  },
  tap: { scale: 0.98 },
}

export const cardFloat: Variants = {
  initial: { y: 0 },
  animate: { 
    y: [-5, 5, -5],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }
  },
}

// Button animations
export const buttonHover: Variants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.05,
    transition: { duration: 0.2, ease: easings.easeOut }
  },
  tap: { scale: 0.95 },
}

export const buttonPulse: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  },
}

// Loading animations
export const spinner: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear"
    }
  },
}

export const pulse: Variants = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  },
}

export const bounce: Variants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  },
}

// Page transitions
export const pageTransition: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.4, ease: easings.easeOut }
  },
  exit: { 
    opacity: 0, 
    x: -20,
    transition: { duration: 0.3, ease: easings.easeIn }
  },
}

// Modal animations
export const modalBackdrop: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const modalContent: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { duration: 0.3, ease: easings.easeOut }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: 20,
    transition: { duration: 0.2, ease: easings.easeIn }
  },
}

// Notification animations
export const notificationSlide: Variants = {
  initial: { x: "100%", opacity: 0 },
  animate: { 
    x: 0, 
    opacity: 1,
    transition: { duration: 0.3, ease: easings.easeOut }
  },
  exit: { 
    x: "100%", 
    opacity: 0,
    transition: { duration: 0.2, ease: easings.easeIn }
  },
}

// Globe animations
export const globeFloat: Variants = {
  animate: {
    y: [0, -10, 0],
    rotateY: [0, 360],
    transition: {
      y: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      },
      rotateY: {
        duration: 20,
        repeat: Infinity,
        ease: "linear"
      }
    }
  },
}

// Utility functions
export const createStaggerVariants = (staggerDelay = 0.1, childDelay = 0) => ({
  animate: {
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: childDelay,
    },
  },
})

export const createFadeInVariant = (direction: 'up' | 'down' | 'left' | 'right' = 'up', distance = 20) => {
  const getInitialPosition = () => {
    switch (direction) {
      case 'up': return { y: distance }
      case 'down': return { y: -distance }
      case 'left': return { x: -distance }
      case 'right': return { x: distance }
      default: return { y: distance }
    }
  }

  return {
    initial: { opacity: 0, ...getInitialPosition() },
    animate: { opacity: 1, x: 0, y: 0 },
    exit: { opacity: 0, ...getInitialPosition() },
  }
}

export const createScaleVariant = (initialScale = 0.95, animateScale = 1) => ({
  initial: { opacity: 0, scale: initialScale },
  animate: { opacity: 1, scale: animateScale },
  exit: { opacity: 0, scale: initialScale },
})

// Animation presets for common components
export const animationPresets = {
  card: cardHover,
  button: buttonHover,
  modal: modalContent,
  page: pageTransition,
  stagger: staggerContainer,
  fadeIn: fadeInUp,
  scaleIn: scaleIn,
  slideIn: slideInUp,
} as const

// Default transition settings
export const defaultTransition = {
  duration: 0.3,
  ease: easings.easeOut,
}

export const fastTransition = {
  duration: 0.15,
  ease: easings.easeOut,
}

export const slowTransition = {
  duration: 0.6,
  ease: easings.easeOut,
}
