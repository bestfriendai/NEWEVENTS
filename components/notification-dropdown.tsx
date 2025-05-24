"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, Calendar, Heart, MessageSquare, User, X, Settings, Check, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

// Notification type definition
interface Notification {
  id: number
  type: string
  title: string
  message: string
  time: string
  read: boolean
  image: string
  link: string
  actions?: string[]
  actionTaken?: string
}

// Sample notification data
const sampleNotifications = [
  {
    id: 1,
    type: "event_reminder",
    title: "Event Reminder",
    message: "Neon Nights Music Festival starts in 2 hours",
    time: "2 hours ago",
    read: false,
    image: "/vibrant-community-event.png?height=40&width=40&query=neon music festival",
    link: "/events/1",
  },
  {
    id: 2,
    type: "friend_request",
    title: "New Friend Request",
    message: "Sarah Johnson sent you a friend request",
    time: "5 hours ago",
    read: false,
    image: "/avatar-1.png?height=40&width=40&query=woman smiling",
    link: "/profile",
    actions: ["accept", "decline"],
  },
  {
    id: 3,
    type: "message",
    title: "New Message",
    message: "David Wilson: Thanks for the event recommendation!",
    time: "Yesterday",
    read: true,
    image: "/avatar-3.png?height=40&width=40&query=man with glasses",
    link: "/messages",
  },
  {
    id: 4,
    type: "event_invite",
    title: "Event Invitation",
    message: "Emma Thompson invited you to Urban Art Exhibition",
    time: "Yesterday",
    read: true,
    image: "/vibrant-community-event.png?height=40&width=40&query=urban art exhibition",
    link: "/events/2",
    actions: ["accept", "decline"],
  },
  {
    id: 5,
    type: "like",
    title: "New Like",
    message: "Michael Brown liked your event RSVP",
    time: "2 days ago",
    read: true,
    image: "/avatar-4.png?height=40&width=40&query=person",
    link: "/profile",
  },
  {
    id: 6,
    type: "system",
    title: "Account Update",
    message: "Your profile has been successfully updated",
    time: "3 days ago",
    read: true,
    image: "/avatar-1.png?height=40&width=40&query=user",
    link: "/profile",
  },
]

interface NotificationDropdownProps {
  className?: string
}

export function NotificationDropdown({ className }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(sampleNotifications)
  const [activeTab, setActiveTab] = useState("all")
  const [hasNewNotifications, setHasNewNotifications] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Safe function to get next ID
  const getNextId = useCallback(() => {
    try {
      if (notifications.length === 0) return 1
      const maxId = Math.max(...notifications.map((n) => n.id))
      return maxId + 1
    } catch (error) {
      console.error("Error getting next ID:", error)
      return Date.now() // Fallback to timestamp
    }
  }, [notifications])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      try {
        const target = event.target as HTMLElement
        if (isOpen && dropdownRef.current && !dropdownRef.current.contains(target)) {
          setIsOpen(false)
        }
      } catch (error) {
        console.error("Error in click outside handler:", error)
        setError("Failed to handle click outside")
      }
    }

    if (typeof document !== "undefined") {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Simulate receiving a new notification
  useEffect(() => {
    try {
      timerRef.current = setTimeout(() => {
        if (!isOpen) {
          const newNotification = {
            id: getNextId(),
            type: "event_update",
            title: "Event Update",
            message: "The venue for Tech Startup Conference has changed",
            time: "Just now",
            read: false,
            image: "/vibrant-community-event.png?height=40&width=40&query=tech conference",
            link: "/events/4",
          }
          setNotifications((prev) => [newNotification, ...prev])
          setHasNewNotifications(true)
        }
      }, 30000) // Add a new notification after 30 seconds if dropdown is closed

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
      }
    } catch (error) {
      console.error("Error setting up notification timer:", error)
      setError("Failed to set up notifications")
    }
  }, [isOpen, getNextId])

  // Global error handlers
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection in NotificationDropdown:", event.reason)
      setError("An unexpected error occurred")
      event.preventDefault() // Prevent the default browser behavior
    }

    const handleError = (event: ErrorEvent) => {
      console.error("Runtime error in NotificationDropdown:", event.error)
      setError("A runtime error occurred")
    }

    if (typeof window !== "undefined") {
      window.addEventListener("unhandledrejection", handleUnhandledRejection)
      window.addEventListener("error", handleError)

      return () => {
        window.removeEventListener("unhandledrejection", handleUnhandledRejection)
        window.removeEventListener("error", handleError)
      }
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleToggleDropdown = useCallback(() => {
    try {
      setIsOpen(!isOpen)
      if (!isOpen && hasNewNotifications) {
        setHasNewNotifications(false)
      }
      setError(null) // Clear any previous errors
    } catch (error) {
      console.error("Error toggling dropdown:", error)
      setError("Failed to toggle dropdown")
    }
  }, [isOpen, hasNewNotifications])

  const handleMarkAsRead = useCallback((id: number) => {
    try {
      setNotifications((prev) =>
        prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
      )
    } catch (error) {
      console.error("Error marking notification as read:", error)
      setError("Failed to mark notification as read")
    }
  }, [])

  const handleMarkAllAsRead = useCallback(() => {
    try {
      setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      setError("Failed to mark all notifications as read")
    }
  }, [])

  const handleRemoveNotification = useCallback((id: number) => {
    try {
      setNotifications((prev) => prev.filter((notification) => notification.id !== id))
    } catch (error) {
      console.error("Error removing notification:", error)
      setError("Failed to remove notification")
    }
  }, [])

  const handleAction = useCallback((id: number, action: string) => {
    try {
      // In a real app, this would send a request to the server
      // console.log(`Notification ${id}: ${action}`)

      // Mark as read and update UI
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id ? { ...notification, read: true, actionTaken: action } : notification,
        ),
      )
    } catch (error) {
      console.error("Error handling notification action:", error)
      setError("Failed to handle notification action")
    }
  }, [])

  // Validate notification data
  const validateNotification = useCallback((notification: any): notification is Notification => {
    return (
      notification &&
      typeof notification.id === "number" &&
      typeof notification.type === "string" &&
      typeof notification.title === "string" &&
      typeof notification.message === "string" &&
      typeof notification.time === "string" &&
      typeof notification.read === "boolean" &&
      typeof notification.image === "string" &&
      typeof notification.link === "string"
    )
  }, [])

  const filteredNotifications = useMemo(() => {
    try {
      setIsLoading(true)
      const validNotifications = notifications.filter(validateNotification)

      if (validNotifications.length !== notifications.length) {
        console.warn("Some notifications failed validation and were filtered out")
      }

      const filtered = validNotifications.filter((notification) => {
        if (activeTab === "all") return true
        if (activeTab === "unread") return !notification.read
        return notification.type === activeTab
      })

      setIsLoading(false)
      return filtered
    } catch (error) {
      console.error("Error filtering notifications:", error)
      setError("Failed to filter notifications")
      setIsLoading(false)
      return []
    }
  }, [notifications, activeTab, validateNotification])

  const getNotificationIcon = useCallback((type: string) => {
    try {
      switch (type) {
        case "event_reminder":
        case "event_invite":
        case "event_update":
          return <Calendar className="h-4 w-4 text-purple-400" />
        case "friend_request":
          return <User className="h-4 w-4 text-blue-400" />
        case "message":
          return <MessageSquare className="h-4 w-4 text-green-400" />
        case "like":
          return <Heart className="h-4 w-4 text-pink-400" />
        case "system":
          return <Settings className="h-4 w-4 text-gray-400" />
        default:
          return <Bell className="h-4 w-4 text-purple-400" />
      }
    } catch (error) {
      console.error("Error getting notification icon:", error)
      return <Bell className="h-4 w-4 text-purple-400" />
    }
  }, [])

  // Error display component
  const ErrorDisplay = () => {
    if (!error) return null
    return (
      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg m-2">
        <p className="text-red-400 text-sm">{error}</p>
        <Button
          size="sm"
          variant="ghost"
          className="mt-1 h-6 px-2 text-xs text-red-400 hover:text-red-300"
          onClick={() => setError(null)}
        >
          Dismiss
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("relative", className)} data-notification-dropdown ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative text-gray-400 hover:text-gray-200"
        onClick={handleToggleDropdown}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 flex items-center justify-center"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
            </span>
          </motion.div>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 md:w-96 bg-[#1A1D25]/95 backdrop-blur-md border border-gray-800 rounded-xl shadow-lg z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-800/50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">Notifications</h3>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs text-purple-400 hover:text-purple-300 hover:bg-[#22252F]"
                      onClick={handleMarkAllAsRead}
                    >
                      <Check className="mr-1 h-3 w-3" />
                      Mark all as read
                    </Button>
                  )}
                </div>
              </div>
              <ErrorDisplay />
            </div>

            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <div className="px-2 pt-2 border-b border-gray-800/50">
                <TabsList className="bg-[#22252F] p-1 rounded-lg w-full grid grid-cols-4">
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:bg-[#2A2E38] data-[state=active]:text-purple-400 rounded-md transition-all duration-200 text-xs h-8"
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger
                    value="unread"
                    className="data-[state=active]:bg-[#2A2E38] data-[state=active]:text-purple-400 rounded-md transition-all duration-200 text-xs h-8"
                  >
                    Unread
                  </TabsTrigger>
                  <TabsTrigger
                    value="event_reminder"
                    className="data-[state=active]:bg-[#2A2E38] data-[state=active]:text-purple-400 rounded-md transition-all duration-200 text-xs h-8"
                  >
                    Events
                  </TabsTrigger>
                  <TabsTrigger
                    value="message"
                    className="data-[state=active]:bg-[#2A2E38] data-[state=active]:text-purple-400 rounded-md transition-all duration-200 text-xs h-8"
                  >
                    Messages
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="max-h-[60vh] overflow-y-auto">
                <TabsContent value={activeTab} className="m-0 min-h-[200px]">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                      <div className="bg-[#22252F] p-3 rounded-full mb-3 animate-pulse">
                        <Bell className="h-6 w-6 text-gray-500" />
                      </div>
                      <p className="text-gray-400 text-sm">Loading notifications...</p>
                    </div>
                  ) : filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                      <div className="bg-[#22252F] p-3 rounded-full mb-3">
                        <Bell className="h-6 w-6 text-gray-500" />
                      </div>
                      <p className="text-gray-400 text-sm">No notifications to display</p>
                    </div>
                  ) : (
                    <div>
                      {filteredNotifications.map((notification) => (
                        <div key={notification.id} className="relative">
                          <motion.div
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className={cn(
                              "p-4 border-b border-gray-800/30 hover:bg-[#22252F] transition-colors duration-200",
                              !notification.read && "bg-[#22252F]/50",
                            )}
                          >
                            <div className="flex">
                              <div className="relative mr-3 mt-1">
                                <Avatar className="h-10 w-10 border border-gray-800">
                                  <AvatarImage
                                    src={notification.image || "/placeholder.svg"}
                                    alt={notification.title}
                                    onError={(e) => {
                                      console.warn("Failed to load notification image:", notification.image)
                                      // Fallback to placeholder or remove src to show fallback
                                      e.currentTarget.src = "/placeholder.svg"
                                    }}
                                  />
                                  <AvatarFallback className="bg-purple-900 text-purple-200">
                                    {notification.title?.charAt(0) || "N"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="absolute -top-1 -right-1 bg-[#1A1D25] rounded-full p-0.5">
                                  {getNotificationIcon(notification.type)}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p
                                      className={cn(
                                        "text-sm font-medium",
                                        notification.read ? "text-gray-300" : "text-white",
                                      )}
                                    >
                                      {notification.title || "Untitled Notification"}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">{notification.message || "No message"}</p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-gray-500 hover:text-gray-300 -mr-2 -mt-1"
                                    onClick={() => handleRemoveNotification(notification.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                  <div className="flex items-center text-xs text-gray-500">
                                    <Clock className="mr-1 h-3 w-3" />
                                    {notification.time || "Unknown time"}
                                  </div>
                                  {notification.actions && Array.isArray(notification.actions) && !notification.actionTaken && (
                                    <div className="flex space-x-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-6 px-2 text-xs bg-[#2A2E38] hover:bg-[#343842] text-gray-300 border-gray-800"
                                        onClick={() => handleAction(notification.id, "decline")}
                                      >
                                        Decline
                                      </Button>
                                      <Button
                                        size="sm"
                                        className="h-6 px-2 text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                                        onClick={() => handleAction(notification.id, "accept")}
                                      >
                                        Accept
                                      </Button>
                                    </div>
                                  )}
                                  {notification.actionTaken && (
                                    <Badge className="text-xs bg-[#22252F] text-gray-400">
                                      {notification.actionTaken === "accept" ? "Accepted" : "Declined"}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                          {!notification.read && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500 rounded-r-full"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </ScrollArea>

              <div className="p-3 border-t border-gray-800/50 text-center">
                <Button
                  variant="link"
                  className="text-sm text-purple-400 hover:text-purple-300"
                  onClick={() => setIsOpen(false)}
                >
                  View all notifications
                </Button>
              </div>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
