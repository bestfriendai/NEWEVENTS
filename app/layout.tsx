import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { QueryProvider } from "@/providers/query-provider"
import { Toaster } from "@/components/ui/toaster"
// Import the AuthProvider
import { AuthProvider } from "@/lib/auth/auth-provider"
import { ErrorBoundary } from "@/components/error-boundary"

const inter = Inter({ subsets: ["latin"] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: "DateAI - Discover Amazing Events",
  description: "Find the perfect events for your next date or social gathering with AI-powered recommendations",
  keywords: ["events", "dating", "social", "activities", "concerts", "festivals", "AI", "recommendations"],
  authors: [{ name: "DateAI Team" }],
  generator: "v0.dev",
  robots: "index, follow",
  openGraph: {
    title: "DateAI - Discover Amazing Events",
    description: "Find the perfect events for your next date or social gathering with AI-powered recommendations",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "DateAI - Discover Amazing Events",
    description: "Find the perfect events for your next date or social gathering with AI-powered recommendations",
  },
}

// Wrap the QueryProvider with the AuthProvider
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Performance optimizations */}
        <meta name="theme-color" content="#6366f1" />
        <meta name="color-scheme" content="dark light" />

        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider>
            <QueryProvider>
              <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                <div className="min-h-screen bg-background">{children}</div>
                <Toaster />
              </ThemeProvider>
            </QueryProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
