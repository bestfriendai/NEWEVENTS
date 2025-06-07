export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0F1116] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading events...</p>
      </div>
    </div>
  )
}
