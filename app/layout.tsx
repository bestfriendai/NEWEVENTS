import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { ErrorBoundary } from "@/components/error-boundary"
import { LocationProvider } from "@/contexts/LocationContext"
import { FavoritesProvider } from "@/contexts/FavoritesContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DateAI - Discover Events Near You",
  description: "Find and join events in your area with DateAI",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <LocationProvider>
              <FavoritesProvider>
                {children}
              </FavoritesProvider>
            </LocationProvider>
          </ThemeProvider>
        </ErrorBoundary>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress clipboard errors and other non-critical errors
              const originalConsoleError = console.error;
              console.error = function(...args) {
                const message = args.join(' ');
                if (message.includes('Copy to clipboard is not supported') ||
                    message.includes('clipboard') ||
                    message.includes('ResizeObserver loop limit exceeded')) {
                  return; // Suppress these errors
                }
                originalConsoleError.apply(console, args);
              };

              // Suppress hydration warnings for known issues
              const originalConsoleWarn = console.warn;
              console.warn = function(...args) {
                const message = args.join(' ');
                if (message.includes('Hydration failed') &&
                    (message.includes('Math.random') || message.includes('Date.now'))) {
                  return; // Suppress hydration warnings for random values
                }
                originalConsoleWarn.apply(console, args);
              };
            `
          }}
        />
      </body>
    </html>
  )
}
