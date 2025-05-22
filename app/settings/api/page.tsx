import { ApiKeyForm } from "@/components/api-key-form"
import { AppLayout } from "@/components/app-layout"

export default function ApiSettingsPage() {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-6">API Settings</h1>
        <div className="max-w-2xl mx-auto">
          <ApiKeyForm />
        </div>
      </div>
    </AppLayout>
  )
}
