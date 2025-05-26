import { SupabaseConnectionTest } from "@/components/supabase-connection-test"

export default function SupabaseTestPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Supabase Connection Test</h1>
          <p className="text-muted-foreground">
            Verify that your application is properly connected to the Supabase database
          </p>
        </div>
        
        <div className="flex justify-center">
          <SupabaseConnectionTest />
        </div>
      </div>
    </div>
  )
}
