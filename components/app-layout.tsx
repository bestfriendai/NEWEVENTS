"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  MapPin,
  Music,
  Heart,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Plus,
  Compass,
  MessageSquare,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { NotificationDropdown } from "@/components/notification-dropdown"
import { AuthModal } from "@/components/auth/auth-modal"
import { useAuth } from "@/lib/auth/auth-provider"
import { getSupabaseClient } from "@/lib/auth/anonymous-auth"
import { toast } from "sonner"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<{ name: string; email: string; avatar?: string } | null>(null)
  const pathname = usePathname()
  const { userId, isAuthenticated, isSupabaseAuth } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Fetch user profile when authenticated
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (isAuthenticated && isSupabaseAuth) {
        const supabase = getSupabaseClient()
        if (supabase) {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            setUserProfile({
              name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              email: user.email || '',
              avatar: user.user_metadata?.avatar_url
            })
          }
        }
      } else if (isAuthenticated && !isSupabaseAuth) {
        // Anonymous user
        setUserProfile({
          name: 'Guest User',
          email: 'guest@dateai.com'
        })
      } else {
        setUserProfile(null)
      }
    }

    fetchUserProfile()
  }, [isAuthenticated, isSupabaseAuth, userId])

  const handleSignOut = async () => {
    try {
      const supabase = getSupabaseClient()
      if (supabase && isSupabaseAuth) {
        await supabase.auth.signOut()
        toast.success("Signed out successfully")
      }
      setUserProfile(null)
    } catch (error) {
      toast.error("Error signing out")
      console.error("Sign out error:", error)
    }
  }

  // Update the navItems array to include all our created pages
  const navItems = [
    { name: "Discover", href: "/", icon: <Compass className="w-5 h-5" /> },
    { name: "Events", href: "/events", icon: <Calendar className="w-5 h-5" /> },
    { name: "Party", href: "/party", icon: <Music className="w-5 h-5" /> },
    { name: "Favorites", href: "/favorites", icon: <Heart className="w-5 h-5" /> },
    { name: "Messages", href: "/messages", icon: <MessageSquare className="w-5 h-5" /> },
    { name: "Profile", href: "/profile", icon: <User className="w-5 h-5" /> },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0B10] to-[#12141D] text-gray-200">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ x: -80 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed left-0 top-0 bottom-0 w-20 bg-[#12141D]/80 backdrop-blur-md border-r border-gray-800/50 hidden md:flex flex-col items-center py-8 z-40"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white p-3 rounded-xl mb-10 shadow-glow-sm"
        >
          <MapPin className="w-6 h-6" />
        </motion.div>

        <nav className="flex-1 flex flex-col items-center space-y-6 mt-6">
          {navItems.map((item) => (
            <Link key={item.name} href={item.href}>
              <motion.div
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200",
                  pathname === item.href
                    ? "bg-gradient-to-br from-purple-600/20 to-indigo-700/20 text-purple-400 shadow-glow-xs"
                    : "text-gray-500 hover:text-gray-300",
                )}
              >
                {pathname === item.href && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute left-0 w-1 h-6 bg-gradient-to-b from-purple-500 to-indigo-600 rounded-r-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                {item.icon}
              </motion.div>
            </Link>
          ))}
        </nav>

        <div className="mt-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="cursor-pointer">
                <Avatar className="w-12 h-12 border-2 border-gray-800 shadow-glow-sm">
                  <AvatarImage src="/avatar-1.png" alt="User" />
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-indigo-700">DA</AvatarFallback>
                </Avatar>
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-[#1A1D25]/90 backdrop-blur-md border border-gray-800 text-gray-300 shadow-glow-sm"
            >
              <DropdownMenuLabel className="flex items-center space-x-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={userProfile?.avatar || "/avatar-1.png"} alt="User" />
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-indigo-700">
                    {userProfile?.name.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-200">{userProfile?.name || "User"}</p>
                  <p className="text-xs text-gray-400">{userProfile?.email || ""}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-800" />
              <Link href="/profile">
                <DropdownMenuItem className="flex items-center cursor-pointer hover:bg-[#22252F] focus:bg-[#22252F]">
                  <User className="w-4 h-4 mr-2 text-purple-400" />
                  <span>Profile</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/settings">
                <DropdownMenuItem className="flex items-center cursor-pointer hover:bg-[#22252F] focus:bg-[#22252F]">
                  <Settings className="w-4 h-4 mr-2 text-purple-400" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator className="bg-gray-800" />
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="flex items-center cursor-pointer hover:bg-[#22252F] focus:bg-[#22252F]"
              >
                <LogOut className="w-4 h-4 mr-2 text-purple-400" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.aside>

      {/* Mobile Header */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 md:left-20 bg-black backdrop-blur-md z-30 transition-all duration-300 border-b border-gray-800/50",
          scrolled ? "py-3" : "py-4",
        )}
      >
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-gray-200 mr-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white p-2 rounded-xl shadow-glow-sm"
            >
              <MapPin className="w-5 h-5" />
            </motion.div>
          </div>

          <div className="hidden md:block text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
            DateAI
          </div>

          <div className="flex-1 max-w-xl mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input
                className="w-full bg-[#1A1D25]/60 border-gray-800/50 rounded-full pl-10 pr-4 py-2 text-sm focus-visible:ring-purple-500/50 transition-all duration-300 placeholder:text-gray-500"
                placeholder="Search for events, venues, or categories..."
              />
            </div>
          </div>

          <div className="flex items-center space-x-1 md:space-x-3">
            {isAuthenticated && <NotificationDropdown />}

            {isAuthenticated && (
              <Link href="/create-event">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="hidden md:block">
                  <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full shadow-glow-sm transition-all duration-300 px-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Event
                  </Button>
                </motion.div>
              </Link>
            )}

            {!isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="text-gray-300 hover:text-white hidden md:block"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full shadow-glow-sm transition-all duration-300 px-4"
                >
                  Sign Up
                </Button>
              </div>
            ) : userProfile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="cursor-pointer">
                    <Avatar className="w-9 h-9 border-2 border-gray-800 shadow-glow-xs">
                      <AvatarImage src={userProfile.avatar || "/avatar-1.png"} alt="User" />
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-indigo-700">
                        {userProfile.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-[#1A1D25]/90 backdrop-blur-md border border-gray-800 text-gray-300 shadow-glow-sm"
                >
                  <DropdownMenuLabel className="flex items-center space-x-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={userProfile.avatar || "/avatar-1.png"} alt="User" />
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-indigo-700">
                        {userProfile.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-gray-200">{userProfile.name}</p>
                      <p className="text-xs text-gray-400">{userProfile.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-800" />
                  <Link href="/profile">
                    <DropdownMenuItem className="flex items-center cursor-pointer hover:bg-[#22252F] focus:bg-[#22252F]">
                      <User className="w-4 h-4 mr-2 text-purple-400" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/settings">
                    <DropdownMenuItem className="flex items-center cursor-pointer hover:bg-[#22252F] focus:bg-[#22252F]">
                      <Settings className="w-4 h-4 mr-2 text-purple-400" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator className="bg-gray-800" />
                  <DropdownMenuItem 
                    className="flex items-center cursor-pointer hover:bg-[#22252F] focus:bg-[#22252F]"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4 mr-2 text-purple-400" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-[#0A0B10]/90 backdrop-blur-md z-30 md:hidden"
          >
            <div className="flex flex-col h-full pt-20 px-6">
              <nav className="flex-1 py-8">
                <ul className="space-y-6">
                  {navItems.map((item) => (
                    <motion.li key={item.name} whileHover={{ x: 5 }} whileTap={{ scale: 0.98 }}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center space-x-4 py-2 px-4 rounded-lg transition-all duration-200",
                          pathname === item.href
                            ? "bg-gradient-to-r from-purple-600/20 to-indigo-700/20 text-purple-400 shadow-glow-xs"
                            : "text-gray-400 hover:text-gray-200",
                        )}
                      >
                        {item.icon}
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </nav>

              <div className="py-6 border-t border-gray-800/50">
                <Link href="/create-event">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full shadow-glow-sm transition-all duration-300">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Event
                    </Button>
                  </motion.div>
                </Link>
              </div>

              <div className="py-6 border-t border-gray-800/50 text-center text-sm text-gray-500">
                <p>© 2025 DateAI. All rights reserved.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="pt-16 md:pt-20 md:pl-20 min-h-screen">{children}</main>

      {/* Authentication Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  )
}
