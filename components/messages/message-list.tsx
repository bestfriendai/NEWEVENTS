"use client"

import { useRef, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface Message {
  id: number
  senderId: number | string
  text: string
  time: string
  status: string
}

interface Conversation {
  id: number
  name: string
  avatar: string
  lastMessage: string
  time: string
  unread: number
  online: boolean
  typing: boolean
  isGroup?: boolean
  members?: number
}

interface MessageListProps {
  messages: Message[]
  conversations: Conversation[]
}

export function MessageList({ messages, conversations }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll to bottom of messages
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={cn("flex", message.senderId === "me" ? "justify-end" : "justify-start")}>
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
  )
}
