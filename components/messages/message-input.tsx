"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ImageIcon, Paperclip, Smile, Loader2, Send } from "lucide-react"

interface MessageInputProps {
  onSendMessage: (text: string) => void
  isSending: boolean
}

export function MessageInput({ onSendMessage, isSending }: MessageInputProps) {
  const [newMessage, setNewMessage] = useState("")

  const handleSend = () => {
    if (!newMessage.trim()) return
    onSendMessage(newMessage)
    setNewMessage("")
  }

  return (
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
              handleSend()
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
              onClick={handleSend}
              disabled={!newMessage.trim() || isSending}
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
