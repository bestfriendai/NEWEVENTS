"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, Calendar, Heart, MessageSquare, User, X, Settings, Check, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

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
  const [notifications, setNotifications] = useState(sampleNotifications)
  const [activeTab, setActiveTab] = useState("all")
  const [hasNewNotifications, setHasNewNotifications] = useState(true)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isOpen && !target.closest("[data-notification-dropdown]")) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  // Simulate receiving a new notification
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isOpen) {
        const newNotification = {
          id: Math.max(...notifications.map((n) => n.id)) + 1,
          type: "event_update",
          title: "Event Update",
          message: "The venue for Tech Startup Conference has changed",
          time: "Just now",
          read: false,
          image: "/vibrant-community-event.png?height=40&width=40&query=tech conference",
          link: "/events/4",
        }
        setNotifications([newNotification, ...notifications])
        setHasNewNotifications(true)
      }
    }, 30000) // Add a new notification after 30 seconds if dropdown is closed

    return () => clearTimeout(timer)
  }, [notifications, isOpen])

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen)
    if (!isOpen && hasNewNotifications) {
      setHasNewNotifications(false)
    }
  }

  const handleMarkAsRead = (id: number) => {
    setNotifications(
      notifications.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map((notification) => ({ ...notification, read: true })))
  }

  const handleRemoveNotification = (id: number) => {
    setNotifications(notifications.filter((notification) => notification.id !== id))
  }

  const handleAction = (id: number, action: string) => {
    // In a real app, this would send a request to the server
    console.log(`Notification ${id}: ${action}`)

    // Mark as read and update UI
    setNotifications(
      notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true, actionTaken: action } : notification,
      ),
    )
  }

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "all") return true
    if (activeTab === "unread") return !notification.read
    return notification.type === activeTab
  })

  const getNotificationIcon = (type: string) => {
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
  }

  return (
    <div className={cn("relative", className)} data-notification-dropdown>
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
                  {filteredNotifications.length === 0 ? (
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
                                  />
                                  <AvatarFallback className="bg-purple-900 text-purple-200">
                                    {notification.title.charAt(0)}
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
                                      {notification.title}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">{notification.message}</p>
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
                                    {notification.time}
                                  </div>
                                  {notification.actions && !notification.actionTaken && (
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
