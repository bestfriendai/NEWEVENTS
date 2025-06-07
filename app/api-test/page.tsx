import { RapidApiTest } from "@/components/rapid-api-test"

export default function ApiTestPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">RapidAPI Events Integration Test</h1>
      <RapidApiTest />
    </div>
  )
}
