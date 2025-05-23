"use client"

import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

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

interface ConversationListProps {
  conversations: Conversation[]
  activeConversation: number | null
  setActiveConversation: (id: number) => void
  isLoading: boolean
}

export function ConversationList({
  conversations,
  activeConversation,
  setActiveConversation,
  isLoading,
}: ConversationListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          className="w-8 h-8 border-t-2 border-purple-500 rounded-full"
        ></motion.div>
      </div>
    )
  }

  if (conversations.length === 0) {
    return <div className="text-center py-8 text-gray-500">No conversations found</div>
  }

  return (
    <div className="space-y-1">
      {conversations.map((convo) => (
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
                <AvatarFallback className="bg-purple-900 text-purple-200">{convo.name.charAt(0)}</AvatarFallback>
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
                  {convo.typing ? <span className="text-purple-400 text-xs">typing...</span> : convo.lastMessage}
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
  )
}
