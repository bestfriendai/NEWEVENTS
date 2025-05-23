"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Phone, Video, Info } from "lucide-react"

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

interface ConversationHeaderProps {
  conversation: Conversation | undefined
}

export function ConversationHeader({ conversation }: ConversationHeaderProps) {
  if (!conversation) return null

  return (
    <div className="p-4 border-b border-gray-800/50 bg-[#12141D]/80 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Avatar className="h-10 w-10 border border-gray-800">
            <AvatarImage src={conversation.avatar || "/placeholder.svg"} alt={conversation.name} />
            <AvatarFallback className="bg-purple-900 text-purple-200">{conversation.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <div className="flex items-center">
              <p className="font-medium text-white">{conversation.name}</p>
              {conversation.online && (
                <Badge className="ml-2 bg-green-500/20 text-green-300 border-green-500/30 text-xs">Online</Badge>
              )}
            </div>
            {conversation.typing ? (
              <p className="text-xs text-purple-400">typing...</p>
            ) : conversation.isGroup ? (
              <p className="text-xs text-gray-500">{conversation.members} members</p>
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
  )
}
