// Production-ready logger
export const simpleLogger = {
  info: (message: string, data?: any) => {
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      console.log(`[INFO] ${message}`, data || "")
    }
  },
  error: (message: string, data?: any) => {
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      console.error(`[ERROR] ${message}`, data || "")
    }
  },
  warn: (message: string, data?: any) => {
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      console.warn(`[WARN] ${message}`, data || "")
    }
  },
}
