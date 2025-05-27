import type { Metadata } from "next"
import ClientPage from "./ClientPage"

export const metadata: Metadata = {
  title: "DateAI - Discover Amazing Events",
  description: "Find the perfect events for your next date or social gathering",
}

export default function Home() {
  return <ClientPage />
}
