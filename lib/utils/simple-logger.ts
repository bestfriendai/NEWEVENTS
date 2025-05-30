// Simple logger that won't cause issues
export const simpleLogger = {
  info: (message: string, data?: any) => {
    if (typeof window !== "undefined") {
      console.log(`[INFO] ${message}`, data || "")
    }
  },
  error: (message: string, data?: any) => {
    if (typeof window !== "undefined") {
      console.error(`[ERROR] ${message}`, data || "")
    }
  },
  warn: (message: string, data?: any) => {
    if (typeof window !== "undefined") {
      console.warn(`[WARN] ${message}`, data || "")
    }
  },
}
