"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonHover, fastTransition } from "@/lib/animations"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        gradient: "bg-gradient-to-r from-primary-600 to-secondary-600 text-white hover:from-primary-700 hover:to-secondary-700 shadow-lg hover:shadow-xl",
        glassmorphism: "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20",
        neon: "bg-transparent border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white shadow-[0_0_10px_rgba(var(--color-primary-500),0.3)] hover:shadow-[0_0_20px_rgba(var(--color-primary-500),0.6)]",
        success: "bg-green-600 text-white hover:bg-green-700",
        warning: "bg-yellow-600 text-white hover:bg-yellow-700",
        info: "bg-blue-600 text-white hover:bg-blue-700",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-12 rounded-lg px-10 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
      animation: {
        none: "",
        hover: "hover:scale-105 transition-transform duration-200",
        bounce: "hover:animate-bounce",
        pulse: "animate-pulse",
        wiggle: "hover:animate-wiggle",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "hover",
    },
  }
)

export interface EnhancedButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "size">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

const EnhancedButton = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  (
    {
      className,
      variant,
      size,
      animation,
      asChild = false,
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    const buttonContent = (
      <>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
        )}
        
        <span className={cn("flex-1", fullWidth && "text-center")}>
          {loading && loadingText ? loadingText : children}
        </span>
        
        {!loading && rightIcon && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </>
    )

    if (asChild) {
      return (
        <Slot
          className={cn(
            buttonVariants({ variant, size, animation, className }),
            fullWidth && "w-full",
            isDisabled && "opacity-50 cursor-not-allowed"
          )}
          ref={ref}
        >
          {buttonContent}
        </Slot>
      )
    }

    return (
      <motion.button
        className={cn(
          buttonVariants({ variant, size, animation, className }),
          fullWidth && "w-full"
        )}
        ref={ref}
        disabled={isDisabled}
        variants={animation === "hover" ? buttonHover : undefined}
        initial="initial"
        whileHover={!isDisabled ? "hover" : undefined}
        whileTap={!isDisabled ? "tap" : undefined}
        transition={fastTransition}
        {...(props as any)}
      >
        {buttonContent}
      </motion.button>
    )
  }
)
EnhancedButton.displayName = "EnhancedButton"

// Button Group Component
interface ButtonGroupProps {
  children: React.ReactNode
  className?: string
  orientation?: "horizontal" | "vertical"
  size?: "sm" | "default" | "lg"
  variant?: "default" | "outline" | "ghost"
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ children, className, orientation = "horizontal", size = "default", variant = "default" }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex",
          orientation === "horizontal" ? "flex-row" : "flex-col",
          "[&>button]:rounded-none [&>button:first-child]:rounded-l-md [&>button:last-child]:rounded-r-md",
          orientation === "vertical" && "[&>button:first-child]:rounded-t-md [&>button:first-child]:rounded-l-none [&>button:last-child]:rounded-b-md [&>button:last-child]:rounded-r-none",
          "[&>button:not(:first-child)]:border-l-0",
          orientation === "vertical" && "[&>button:not(:first-child)]:border-l [&>button:not(:first-child)]:border-t-0",
          className
        )}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              size,
              variant,
              ...(child.props as any),
            })
          }
          return child
        })}
      </div>
    )
  }
)
ButtonGroup.displayName = "ButtonGroup"

// Floating Action Button
interface FABProps extends EnhancedButtonProps {
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"
}

const FloatingActionButton = React.forwardRef<HTMLButtonElement, FABProps>(
  ({ className, position = "bottom-right", size = "icon-lg", variant = "default", ...props }, ref) => {
    const positionClasses = {
      "bottom-right": "fixed bottom-6 right-6",
      "bottom-left": "fixed bottom-6 left-6",
      "top-right": "fixed top-6 right-6",
      "top-left": "fixed top-6 left-6",
    }

    return (
      <EnhancedButton
        ref={ref}
        className={cn(
          positionClasses[position],
          "rounded-full shadow-lg hover:shadow-xl z-50",
          className
        )}
        size={size}
        variant={variant}
        {...props}
      />
    )
  }
)
FloatingActionButton.displayName = "FloatingActionButton"

// Icon Button with Tooltip
interface IconButtonProps extends EnhancedButtonProps {
  tooltip?: string
  tooltipSide?: "top" | "right" | "bottom" | "left"
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ tooltip, tooltipSide = "top", size = "icon", variant = "ghost", ...props }, ref) => {
    const button = (
      <EnhancedButton
        ref={ref}
        size={size}
        variant={variant}
        {...props}
      />
    )

    if (tooltip) {
      // Note: You would need to import and use your Tooltip component here
      return button // For now, just return the button
    }

    return button
  }
)
IconButton.displayName = "IconButton"

export {
  EnhancedButton,
  ButtonGroup,
  FloatingActionButton,
  IconButton,
  buttonVariants
}
export type { ButtonGroupProps, FABProps, IconButtonProps }
