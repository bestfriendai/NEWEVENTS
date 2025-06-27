export default function TestStyles() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Style Test Page</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Tailwind Classes Test</h2>
          
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">This is a paragraph with Tailwind classes.</p>
            
            <div className="flex gap-4">
              <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                Blue Button
              </button>
              <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
                Green Button
              </button>
              <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
                Red Button
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-purple-100 dark:bg-purple-900 p-4 rounded">
                <p className="text-purple-800 dark:text-purple-200">Purple Box</p>
              </div>
              <div className="bg-indigo-100 dark:bg-indigo-900 p-4 rounded">
                <p className="text-indigo-800 dark:text-indigo-200">Indigo Box</p>
              </div>
              <div className="bg-pink-100 dark:bg-pink-900 p-4 rounded">
                <p className="text-pink-800 dark:text-pink-200">Pink Box</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-lg">
          <h3 className="text-white text-xl font-bold">Gradient Background</h3>
          <p className="text-white/90">This should have a gradient background.</p>
        </div>
      </div>
    </div>
  )
}