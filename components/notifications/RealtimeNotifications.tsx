"use client"

interface RealtimeNotificationsProps {
  userLocation?: { lat: number; lng: number }
  radius?: number
  maxNotifications?: number
  autoHide?: boolean
  autoHideDelay?: number
}

export function RealtimeNotifications({
  userLocation,
  radius = 25,
  maxNotifications = 5,
  autoHide = true,
  autoHideDelay = 8000,
}: RealtimeNotificationsProps) {
  // For now, return null to prevent errors
  // This can be implemented later with actual real-time functionality
  return null
}
