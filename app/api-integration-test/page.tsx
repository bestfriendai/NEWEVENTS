import { AppLayout } from "@/components/app-layout"
import { ApiIntegrationTester } from "@/components/api-integration-tester"

export default function ApiIntegrationTestPage() {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">API Integration Testing</h1>
          <p className="text-gray-400">
            Comprehensive testing suite for all API integrations in the NEWEVENTS platform.
            This page tests connectivity, authentication, and core functionality for each API service.
          </p>
        </div>

        <ApiIntegrationTester />

        <div className="mt-12 space-y-6">
          <h2 className="text-2xl font-bold text-white">API Integration Guide</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Event APIs</h3>
              <ul className="space-y-2 text-gray-300">
                <li><strong>Ticketmaster:</strong> Primary event discovery platform</li>
                <li><strong>Eventbrite:</strong> Community and professional events</li>
                <li><strong>RapidAPI Events:</strong> Real-time event aggregation</li>
                <li><strong>PredictHQ:</strong> Event intelligence and predictions</li>
              </ul>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Location APIs</h3>
              <ul className="space-y-2 text-gray-300">
                <li><strong>Mapbox:</strong> Primary mapping and geocoding service</li>
                <li><strong>TomTom:</strong> Alternative mapping and location services</li>
                <li><strong>Supabase:</strong> Database and user authentication</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-300 mb-3">Testing Information</h3>
            <div className="space-y-3 text-gray-300">
              <p>
                <strong>Connectivity Test:</strong> Verifies that the API key is valid and the service is reachable.
              </p>
              <p>
                <strong>Event Search Test:</strong> Tests the core functionality of finding events with location and keyword filters.
              </p>
              <p>
                <strong>Response Validation:</strong> Ensures that returned data has the expected structure and required fields.
              </p>
            </div>
          </div>

          <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-300 mb-3">Environment Variables Required</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
              <div>
                <h4 className="font-medium text-white mb-2">Event APIs:</h4>
                <ul className="space-y-1 font-mono">
                  <li>TICKETMASTER_API_KEY</li>
                  <li>EVENTBRITE_PRIVATE_TOKEN</li>
                  <li>RAPIDAPI_KEY</li>
                  <li>PREDICTHQ_API_KEY</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-white mb-2">Location & Database:</h4>
                <ul className="space-y-1 font-mono">
                  <li>NEXT_PUBLIC_MAPBOX_API_KEY</li>
                  <li>TOMTOM_API_KEY</li>
                  <li>NEXT_PUBLIC_SUPABASE_URL</li>
                  <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-green-900/20 border border-green-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-300 mb-3">Expected Results</h3>
            <div className="space-y-3 text-gray-300">
              <p>
                <strong>Success:</strong> All APIs should return valid responses with event data or location information.
              </p>
              <p>
                <strong>Rate Limits:</strong> Some APIs may have rate limits. The tests include appropriate timeouts and error handling.
              </p>
              <p>
                <strong>Data Quality:</strong> Returned events should include essential fields like ID, name, date, and location.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
