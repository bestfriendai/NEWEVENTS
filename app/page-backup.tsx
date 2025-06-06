import type { Metadata } from "next"
import SimpleHome from "./page-simple"

export const metadata: Metadata = {
  title: "DateAI - Discover Amazing Events",
  description: "Find the perfect events for your next date or social gathering",
}

export default function Home() {
  return <SimpleHome />
}
