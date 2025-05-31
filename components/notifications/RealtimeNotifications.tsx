"use client"

/**
 * Real-time Notifications Component
 * Displays live notifications for new events, updates, and user activities
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, 
  X, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  Star,
  Users,
  Wifi,
  WifiOff,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useRealtimeEvents } from '@/hooks/use-realtime-events'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface RealtimeNotificationsProps {
  userLocation?: { lat: number; lng: number }
  radius?: number
  className?: string
  maxNotifications?: number
  autoHide?: boolean
  autoHideDelay?: number
}

export function RealtimeNotifications({
  userLocation,
  radius = 25,
  className,
  maxNotifications = 5,
  autoHide = true,
  autoHideDelay = 8000
}: RealtimeNotificationsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [settings, setSettings] = useState({
    enabled: true,
    newEvents: true,
    popularEvents: true,
    nearbyEvents: true,
    eventUpdates: true,
    sound: false
  })

  const {
    isConnected,
    stats,
    notifications,
    clearNotifications,
    clearNotification,
    liveEvents
  } = useRealtimeEvents({
    enabled: settings.enabled,
    userLocation,
    radius,
    autoReconnect: true
  })

  // Auto-hide notifications
  useEffect(() => {
    if (autoHide && notifications.length > 0) {
      const timer = setTimeout(() => {
        const oldestNotification = notifications[notifications.length - 1]
        if (oldestNotification && Date.now() - oldestNotification.timestamp > autoHideDelay) {
          clearNotification(oldestNotification.id)
        }
      }, autoHideDelay)

      return () => clearTimeout(timer)
    }
  }, [notifications, autoHide, autoHideDelay, clearNotification])

  // Play notification sound
  useEffect(() => {
    if (settings.sound && notifications.length > 0) {
      const latestNotification = notifications[0]
      if (Date.now() - latestNotification.timestamp < 1000) {
        // Play a subtle notification sound
        try {
          const audio = new Audio('/notification-sound.mp3')
          audio.volume = 0.3
          audio.play().catch(() => {
            // Ignore audio play errors (user interaction required)
          })
        } catch (error) {
          // Ignore audio errors
        }
      }
    }
  }, [notifications, settings.sound])

  // Filter notifications based on settings
  const filteredNotifications = notifications.filter(notification => {
    switch (notification.type) {
      case 'new_event':
        return settings.newEvents
      case 'popular_event':
        return settings.popularEvents
      case 'nearby_event':
        return settings.nearbyEvents
      case 'event_updated':
        return settings.eventUpdates
      default:
        return true
    }
  }).slice(0, maxNotifications)

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_event':
        return <Calendar className="h-4 w-4" />
      case 'popular_event':
        return <TrendingUp className="h-4 w-4" />
      case 'nearby_event':
        return <MapPin className="h-4 w-4" />
      case 'event_updated':
        return <Star className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  // Get notification color
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_event':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950'
      case 'popular_event':
        return 'border-l-purple-500 bg-purple-50 dark:bg-purple-950'
      case 'nearby_event':
        return 'border-l-green-500 bg-green-50 dark:bg-green-950'
      case 'event_updated':
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-950'
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-950'
    }
  }

  if (!settings.enabled) {
    return null
  }

  return (
    <div className={cn("fixed top-4 right-4 z-50 w-80", className)}>
      {/* Connection Status */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2"
      >
        <Card className="p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm font-medium">
                {isConnected ? 'Live Updates' : 'Disconnected'}
              </span>
              {isConnected && (
                <Badge variant="secondary" className="text-xs">
                  {stats.updateCount} updates
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0"
              >
                <Settings className="h-3 w-3" />
              </Button>
              {filteredNotifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearNotifications}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Connection Stats */}
          {isConnected && (
            <div className="mt-2 text-xs text-gray-500 flex justify-between">
              <span>Latency: {stats.latency}ms</span>
              <span>Errors: {stats.errors}</span>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Settings Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2"
          >
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">Notification Settings</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Enable Notifications</span>
                  <Switch
                    checked={settings.enabled}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, enabled: checked }))
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm">New Events</span>
                  <Switch
                    checked={settings.newEvents}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, newEvents: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Popular Events</span>
                  <Switch
                    checked={settings.popularEvents}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, popularEvents: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Nearby Events</span>
                  <Switch
                    checked={settings.nearbyEvents}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, nearbyEvents: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Event Updates</span>
                  <Switch
                    checked={settings.eventUpdates}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, eventUpdates: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Sound Alerts</span>
                  <Switch
                    checked={settings.sound}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, sound: checked }))
                    }
                  />
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {filteredNotifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              transition={{ 
                duration: 0.3,
                delay: index * 0.1,
                type: "spring",
                stiffness: 100
              }}
              layout
            >
              <Card className={cn(
                "p-3 border-l-4 cursor-pointer transition-all hover:shadow-md",
                getNotificationColor(notification.type)
              )}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-gray-600 dark:text-gray-400">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                      </span>
                      {notification.event && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Users className="h-3 w-3" />
                          {notification.event.attendees}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      clearNotification(notification.id)
                    }}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Live Events Counter */}
      {liveEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2"
        >
          <Card className="p-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
            <div className="flex items-center justify-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium">
                {liveEvents.length} live events nearby
              </span>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Empty State */}
      {filteredNotifications.length === 0 && isConnected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <Card className="p-4">
            <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              No new notifications
            </p>
            <p className="text-xs text-gray-400 mt-1">
              We'll notify you of new events and updates
            </p>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
