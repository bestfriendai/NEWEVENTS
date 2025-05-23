"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { AppLayout } from "@/components/app-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ConversationList } from "@/components/messages/conversation-list"
import { ConversationHeader } from "@/components/messages/conversation-header"
import { MessageList } from "@/components/messages/message-list"
import { MessageInput } from "@/components/messages/message-input"
import { EmptyConversation } from "@/components/messages/empty-conversation"
import { SidebarHeader } from "@/components/messages/sidebar-header"

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
  const [messages, setMessages] = useState(sampleMessages)
  const [isSending, setIsSending] = useState(false)
  const [filteredConversations, setFilteredConversations] = useState(conversations)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  // Filter conversations when search query changes
  useEffect(() => {
    if (searchQuery) {
      const filtered = conversations.filter(
        (convo) =>
          convo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          convo.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredConversations(filtered)
    } else {
      setFilteredConversations(conversations)
    }
  }, [searchQuery])

  const handleSendMessage = (text: string) => {
    setIsSending(true)
    // Simulate sending delay
    setTimeout(() => {
      const newMsg = {
        id: messages.length + 1,
        senderId: "me",
        text,
        time: "Just now",
        status: "sending",
      }
      setMessages([...messages, newMsg])
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
          <SidebarHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

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
                <ConversationList
                  conversations={filteredConversations}
                  activeConversation={activeConversation}
                  setActiveConversation={setActiveConversation}
                  isLoading={isLoading}
                />
              </TabsContent>

              <TabsContent value="unread" className="m-0">
                <ConversationList
                  conversations={filteredConversations.filter((convo) => convo.unread > 0)}
                  activeConversation={activeConversation}
                  setActiveConversation={setActiveConversation}
                  isLoading={isLoading}
                />
              </TabsContent>

              <TabsContent value="groups" className="m-0">
                <ConversationList
                  conversations={filteredConversations.filter((convo) => convo.isGroup)}
                  activeConversation={activeConversation}
                  setActiveConversation={setActiveConversation}
                  isLoading={isLoading}
                />
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
            <ConversationHeader conversation={selectedConversation} />

            {/* Messages */}
            <MessageList messages={messages} conversations={conversations} />

            {/* Message Input */}
            <MessageInput onSendMessage={handleSendMessage} isSending={isSending} />
          </motion.div>
        ) : (
          <EmptyConversation />
        )}
      </div>
    </AppLayout>
  )
}
