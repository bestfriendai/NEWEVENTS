"use client";

import { AppLayout } from "@/components/app-layout";
import { EventsExplorer } from "@/components/events/EventsExplorer"; // The new master component
import { EventsErrorBoundary } from "@/components/events-error-boundary";
import { LocationProvider } from "@/contexts/LocationContext";
import { QueryProvider } from "@/providers/query-provider";

export default function EventsPage() {
  return (
    <AppLayout>
      <EventsErrorBoundary>
         {/* The providers are essential for the hooks to work */}
         <QueryProvider>
           <LocationProvider>
              <EventsExplorer />
           </LocationProvider>
         </QueryProvider>
      </EventsErrorBoundary>
    </AppLayout>
  );
}
