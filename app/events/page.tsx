import { AppLayout } from "@/components/app-layout"
import { EventsClient } from "./events-client"
import { ErrorBoundary } from "@/components/error-boundary"

export const metadata = {
  title: "Events | DateAI",
  description: "Discover events happening near you",
}

export default function EventsPage() {
  return (
    <AppLayout>
      <ErrorBoundary>
        <EventsClient />
      </ErrorBoundary>
    </AppLayout>
  )
}
