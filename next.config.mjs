/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Temporarily disable ESLint error checking
  },
  typescript: {
    ignoreBuildErrors: true, // Temporarily disable TypeScript error checking
  },
  images: {
    unoptimized: true,
  },
  reactStrictMode: true, // Enable React Strict Mode for better error detection
}

export default nextConfig