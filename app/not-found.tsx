import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BackButton } from '@/components/ui/back-button'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0F1116] flex items-center justify-center p-4">
      <div className="w-full max-w-lg text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-white mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-white mb-2">Page Not Found</h2>
          <p className="text-gray-300 mb-8">
            Sorry, we couldn&apos;t find the page you&apos;re looking for.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link href="/">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </Link>
          <BackButton />
        </div>
      </div>
    </div>
  )
}
