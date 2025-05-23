"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

export function FavoritesFooter() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8, duration: 0.5 }}
      className="bg-[#0A0B0E] border-t border-gray-800 p-4 text-center text-sm text-gray-500"
    >
      <div className="flex justify-center space-x-4 mb-2">
        <motion.div whileHover={{ y: -2 }} whileTap={{ y: 0 }}>
          <Button
            variant="link"
            className="text-gray-500 hover:text-purple-400 p-0 h-auto transition-colors duration-300"
          >
            Help Center
          </Button>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} whileTap={{ y: 0 }}>
          <Button
            variant="link"
            className="text-gray-500 hover:text-purple-400 p-0 h-auto transition-colors duration-300"
          >
            Privacy Policy
          </Button>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} whileTap={{ y: 0 }}>
          <Button
            variant="link"
            className="text-gray-500 hover:text-purple-400 p-0 h-auto transition-colors duration-300"
          >
            Terms of Service
          </Button>
        </motion.div>
      </div>
      <p>© 2025 DateAI. All rights reserved.</p>
    </motion.footer>
  )
}
