"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/auth/anonymous-auth"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = getSupabaseClient()
        if (!supabase) {
          router.push("/")
          return
        }

        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error("Auth callback error:", error)
          toast.error("Authentication failed")
          router.push("/")
          return
        }

        if (data.session) {
          toast.success("Successfully signed in!")
          router.push("/")
        } else {
          router.push("/")
        }
      } catch (error) {
        console.error("Unexpected auth callback error:", error)
        toast.error("Authentication failed")
        router.push("/")
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-[#0F1116] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-300">Completing authentication...</p>
      </div>
    </div>
  )
}