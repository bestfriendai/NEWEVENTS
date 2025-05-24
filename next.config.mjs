/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    dirs: ['app', 'components', 'lib', 'hooks'],
    ignoreDuringBuilds: false, // ✅ Enable proper ESLint error checking
  },
  typescript: {
    ignoreBuildErrors: false, // ✅ Enable proper TypeScript error checking
  },
  experimental: {
    optimizePackageImports: ['@radix-ui/react-*', 'lucide-react'],
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      { hostname: 'images.unsplash.com' },
      { hostname: '*.supabase.co' },
      { hostname: 'via.placeholder.com' },
    ],
  },
  reactStrictMode: true, // Enable React Strict Mode for better error detection
}

export default nextConfig