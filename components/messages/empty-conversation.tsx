"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { MessageSquare, Edit } from "lucide-react"

export function EmptyConversation() {
  return (
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
  )
}
