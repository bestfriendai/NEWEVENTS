"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import {
  Search,
  Edit,
  Phone,
  Video,
  Info,
  Send,
  ImageIcon,
  Paperclip,
  Smile,
  Loader2,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AppLayout } from "@/components/app-layout"
import { cn } from "@/lib/utils"

// Sample conversations data
const conversations = [
  {
    id: 1,
    name: "Sarah Johnson",
    avatar: "/avatar-1.png?height=40&width=40&query=woman smiling",
    lastMessage: "Are you going to the concert tonight?",
    time: "10:30 AM",
    unread: 2,
    online: true,
    typing: false,
  },
  {
    id: 2,
    name: "Tech Conference Group",
    avatar: "/avatar-2.png?height=40&width=40&query=group of people",
    lastMessage: "Michael: I'll be presenting at 2 PM",
    time: "Yesterday",
    unread: 0,
    online: false,
    typing: false,
    isGroup: true,
    members: 8,
  },
  {
    id: 3,
    name: "David Wilson",
    avatar: "/avatar-3.png?height=40&width=40&query=man with glasses",
    lastMessage: "Thanks for the event recommendation!",
    time: "Yesterday",
    unread: 0,
    online: true,
    typing: true,
  },
  {
    id: 4,
    name: "Yoga Class",
    avatar: "/avatar-4.png?height=40&width=40&query=yoga group",
    lastMessage: "Instructor: Don't forget to bring your mats tomorrow",
    time: "Monday",
    unread: 0,
    online: false,
    typing: false,
    isGroup: true,
    members: 12,
  },
  {
    id: 5,
    name: "Emma Thompson",
    avatar: "/avatar-5.png?height=40&width=40&query=woman professional",
    lastMessage: "I'm interested in the art exhibition you shared",
    time: "Monday",
    unread: 0,
    online: false,
    typing: false,
  },
  {
    id: 6,
    name: "Festival Organizers",
    avatar: "/avatar-6.png?height=40&width=40&query=event organizers",
    lastMessage: "Alex: Final schedule has been uploaded",
    time: "Last week",
    unread: 0,
    online: false,
    typing: false,
    isGroup: true,
    members: 5,
  },
]

// Sample messages for a conversation
const sampleMessages = [
  {
    id: 1,
    senderId: 3, // David
    text: "Hey! I saw you're attending the tech conference next week.",
    time: "Yesterday, 2:30 PM",
    status: "read",
  },
  {
    id: 2,
    senderId: "me",
    text: "Yes! I'm really looking forward to it. Are you going too?",
    time: "Yesterday, 2:35 PM",
    status: "read",
  },
  {
    id: 3,
    senderId: 3,
    text: "I'm actually presenting a session on AI in event planning. Would love for you to attend if you're interested.",
    time: "Yesterday, 2:40 PM",
    status: "read",
  },
  {
    id: 4,
    senderId: "me",
    text: "That sounds fascinating! I'll definitely be there. What time is your session?",
    time: "Yesterday, 2:45 PM",
    status: "read",
  },
  {
    id: 5,
    senderId: 3,
    text: "It's at 2 PM on Thursday in Hall B. I'll send you the full details.",
    time: "Yesterday, 2:50 PM",
    status: "read",
  },
  {
    id: 6,
    senderId: 3,
    text: "By the way, there's also an interesting workshop on event networking that I think you might enjoy. It's right after my session.",
    time: "Yesterday, 3:00 PM",
    status: "read",
  },
  {
    id: 7,
    senderId: "me",
    text: "Thanks for the recommendation! I'll check it out for sure.",
    time: "Yesterday, 3:05 PM",
    status: "sent",
  },
]

export default function MessagesPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [activeConversation, setActiveConversation] = useState<number | null>(3) // Default to David's conversation
  const [searchQuery, setSearchQuery] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [messages, setMessages] = useState(sampleMessages)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Scroll to bottom of messages
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    setIsSending(true)
    // Simulate sending delay
    setTimeout(() => {
      const newMsg = {
        id: messages.length + 1,
        senderId: "me",
        text: newMessage,
        time: "Just now",
        status: "sending",
      }
      setMessages([...messages, newMsg])
      setNewMessage("")
      setIsSending(false)

      // Simulate received message after a delay
      if (Math.random() > 0.5) {
        setTimeout(() => {
          const receivedMsg = {
            id: messages.length + 2,
            senderId: 3, // David
            text: "Thanks for your message! I'll get back to you soon.",
            time: "Just now",
            status: "received",
          }
          setMessages((prev) => [...prev, receivedMsg])
        }, 3000)
      }
    }, 500)
  }

  const filteredConversations = conversations.filter((convo) =>
    convo.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const selectedConversation = conversations.find((convo) => convo.id === activeConversation)

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-80px)]">
        {/* Conversations Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full md:w-80 lg:w-96 border-r border-gray-800/50 bg-[#12141D]/80 backdrop-blur-md flex flex-col"
        >
          <div className="p-4 border-b border-gray-800/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Messages</h2>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-[#1A1D25]/60 hover:bg-[#22252F] text-gray-300"
                >
                  <Edit className="h-4 w-4 text-purple-400" />
                </Button>
              </motion.div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input
                className="w-full bg-[#1A1D25]/60 border-gray-800/50 rounded-full pl-10 text-sm focus-visible:ring-purple-500/50 transition-all duration-300 placeholder:text-gray-500"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Tabs defaultValue="all" className="flex-1 flex flex-col">
            <div className="px-4 pt-2">
              <TabsList className="bg-[#1A1D25]/60 p-1 rounded-lg w-full grid grid-cols-3">
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-[#22252F] data-[state=active]:text-purple-400 rounded-md transition-all duration-200"
                >
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="unread"
                  className="data-[state=active]:bg-[#22252F] data-[state=active]:text-purple-400 rounded-md transition-all duration-200"
                >
                  Unread
                </TabsTrigger>
                <TabsTrigger
                  value="groups"
                  className="data-[state=active]:bg-[#22252F] data-[state=active]:text-purple-400 rounded-md transition-all duration-200"
                >
                  Groups
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1 px-2 py-4">
              <TabsContent value="all" className="m-0">
                <div className="space-y-1">
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        className="w-8 h-8 border-t-2 border-purple-500 rounded-full"
                      ></motion.div>
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No conversations found</div>
                  ) : (
                    filteredConversations.map((convo) => (
                      <motion.div
                        key={convo.id}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "p-2 rounded-lg cursor-pointer transition-colors duration-200",
                          activeConversation === convo.id ? "bg-[#22252F]" : "hover:bg-[#1A1D25]/60 backdrop-blur-sm",
                        )}
                        onClick={() => setActiveConversation(convo.id)}
                      >
                        <div className="flex items-center">
                          <div className="relative">
                            <Avatar className="h-12 w-12 border border-gray-800">
                              <AvatarImage src={convo.avatar || "/placeholder.svg"} alt={convo.name} />
                              <AvatarFallback className="bg-purple-900 text-purple-200">
                                {convo.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            {convo.online && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#12141D]"></span>
                            )}
                          </div>
                          <div className="ml-3 flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={cn("font-medium truncate", convo.unread ? "text-white" : "text-gray-300")}>
                                {convo.name}
                              </p>
                              <p className="text-xs text-gray-500">{convo.time}</p>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <p className={cn("text-sm truncate", convo.unread ? "text-gray-300" : "text-gray-500")}>
                                {convo.typing ? (
                                  <span className="text-purple-400 text-xs">typing...</span>
                                ) : (
                                  convo.lastMessage
                                )}
                              </p>
                              {convo.unread > 0 && (
                                <Badge className="bg-purple-500 text-white border-0 h-5 min-w-5 flex items-center justify-center rounded-full text-xs">
                                  {convo.unread}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="unread" className="m-0">
                <div className="space-y-1">
                  {filteredConversations
                    .filter((convo) => convo.unread > 0)
                    .map((convo) => (
                      <motion.div
                        key={convo.id}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "p-2 rounded-lg cursor-pointer transition-colors duration-200",
                          activeConversation === convo.id ? "bg-[#22252F]" : "hover:bg-[#1A1D25]/60 backdrop-blur-sm",
                        )}
                        onClick={() => setActiveConversation(convo.id)}
                      >
                        <div className="flex items-center">
                          <Avatar className="h-12 w-12 border border-gray-800">
                            <AvatarImage src={convo.avatar || "/placeholder.svg"} alt={convo.name} />
                            <AvatarFallback className="bg-purple-900 text-purple-200">
                              {convo.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-3 flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-white truncate">{convo.name}</p>
                              <p className="text-xs text-gray-500">{convo.time}</p>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-sm text-gray-300 truncate">{convo.lastMessage}</p>
                              <Badge className="bg-purple-500 text-white border-0 h-5 min-w-5 flex items-center justify-center rounded-full text-xs">
                                {convo.unread}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="groups" className="m-0">
                <div className="space-y-1">
                  {filteredConversations
                    .filter((convo) => convo.isGroup)
                    .map((convo) => (
                      <motion.div
                        key={convo.id}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "p-2 rounded-lg cursor-pointer transition-colors duration-200",
                          activeConversation === convo.id ? "bg-[#22252F]" : "hover:bg-[#1A1D25]/60 backdrop-blur-sm",
                        )}
                        onClick={() => setActiveConversation(convo.id)}
                      >
                        <div className="flex items-center">
                          <Avatar className="h-12 w-12 border border-gray-800">
                            <AvatarImage src={convo.avatar || "/placeholder.svg"} alt={convo.name} />
                            <AvatarFallback className="bg-purple-900 text-purple-200">
                              {convo.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-3 flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <p
                                  className={cn("font-medium truncate", convo.unread ? "text-white" : "text-gray-300")}
                                >
                                  {convo.name}
                                </p>
                                <Badge className="ml-2 bg-[#1A1D25] text-gray-400 border-gray-800/50 text-xs">
                                  {convo.members} members
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500">{convo.time}</p>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <p className={cn("text-sm truncate", convo.unread ? "text-gray-300" : "text-gray-500")}>
                                {convo.lastMessage}
                              </p>
                              {convo.unread > 0 && (
                                <Badge className="bg-purple-500 text-white border-0 h-5 min-w-5 flex items-center justify-center rounded-full text-xs">
                                  {convo.unread}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </motion.div>

        {/* Chat Area */}
        {activeConversation ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex-1 flex flex-col bg-[#0A0B10]"
          >
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-800/50 bg-[#12141D]/80 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 border border-gray-800">
                    <AvatarImage
                      src={selectedConversation?.avatar || "/placeholder.svg"}
                      alt={selectedConversation?.name}
                    />
                    <AvatarFallback className="bg-purple-900 text-purple-200">
                      {selectedConversation?.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <div className="flex items-center">
                      <p className="font-medium text-white">{selectedConversation?.name}</p>
                      {selectedConversation?.online && (
                        <Badge className="ml-2 bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                          Online
                        </Badge>
                      )}
                    </div>
                    {selectedConversation?.typing ? (
                      <p className="text-xs text-purple-400">typing...</p>
                    ) : selectedConversation?.isGroup ? (
                      <p className="text-xs text-gray-500">{selectedConversation.members} members</p>
                    ) : (
                      <p className="text-xs text-gray-500">Last active 10 min ago</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full bg-[#1A1D25]/60 hover:bg-[#22252F] text-gray-300"
                    >
                      <Phone className="h-4 w-4 text-purple-400" />
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full bg-[#1A1D25]/60 hover:bg-[#22252F] text-gray-300"
                    >
                      <Video className="h-4 w-4 text-purple-400" />
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full bg-[#1A1D25]/60 hover:bg-[#22252F] text-gray-300"
                    >
                      <Info className="h-4 w-4 text-purple-400" />
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn("flex", message.senderId === "me" ? "justify-end" : "justify-start")}
                  >
                    {message.senderId !== "me" && (
                      <Avatar className="h-8 w-8 mr-2 mt-1 border border-gray-800">
                        <AvatarImage
                          src={conversations.find((c) => c.id === message.senderId)?.avatar || "/placeholder.svg"}
                          alt="Sender"
                        />
                        <AvatarFallback className="bg-purple-900 text-purple-200">
                          {conversations.find((c) => c.id === message.senderId)?.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={cn("max-w-[70%]", message.senderId === "me" ? "items-end" : "items-start")}>
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-2 mb-1",
                          message.senderId === "me"
                            ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-none"
                            : "bg-[#1A1D25] text-gray-200 rounded-tl-none",
                        )}
                      >
                        <p className="text-sm">{message.text}</p>
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <span>{message.time}</span>
                        {message.senderId === "me" && (
                          <span className="ml-2">
                            {message.status === "sending" ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : message.status === "sent" ? (
                              "✓"
                            ) : (
                              "✓✓"
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-800/50 bg-[#12141D]/80 backdrop-blur-md">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full bg-[#1A1D25]/60 hover:bg-[#22252F] text-gray-300 h-9 w-9"
                    >
                      <ImageIcon className="h-4 w-4 text-purple-400" />
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full bg-[#1A1D25]/60 hover:bg-[#22252F] text-gray-300 h-9 w-9"
                    >
                      <Paperclip className="h-4 w-4 text-purple-400" />
                    </Button>
                  </motion.div>
                </div>
                <Input
                  className="flex-1 bg-[#1A1D25]/60 border-gray-800/50 rounded-full text-sm focus-visible:ring-purple-500/50 transition-all duration-300 placeholder:text-gray-500"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                />
                <div className="flex space-x-1">
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full bg-[#1A1D25]/60 hover:bg-[#22252F] text-gray-300 h-9 w-9"
                    >
                      <Smile className="h-4 w-4 text-purple-400" />
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-glow-sm h-9 w-9 p-0"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isSending}
                    >
                      {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[#0A0B10]">
            <div className="text-center">
              <div className="bg-[#1A1D25]/60 backdrop-blur-sm p-6 rounded-full mb-4 mx-auto w-20 h-20 flex items-center justify-center">
                <MessageSquare className="h-10 w-10 text-purple-400" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">Your Messages</h3>
              <p className="text-gray-400 max-w-md">
                Select a conversation from the sidebar to start chatting or create a new message.
              </p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="mt-4">
                <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full shadow-glow-sm transition-all duration-300">
                  <Edit className="mr-2 h-4 w-4" />
                  New Message
                </Button>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
