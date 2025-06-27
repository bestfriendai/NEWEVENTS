/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Production optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://api.mapbox.com https://*.supabase.co; style-src 'self' 'unsafe-inline' https://api.mapbox.com; img-src 'self' data: blob: https: http:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.mapbox.com https://*.mapbox.com https://api.ticketmaster.com https://www.eventbriteapi.com https://api.predicthq.com https://api.tomtom.com wss://*.supabase.co; frame-src 'self' https://*.supabase.co; media-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;",
          },
        ],
      },
    ]
  },
  
  // Image optimization
  images: {
    domains: [
      's1.ticketm.net',
      'img.evbuc.com',
      'cdn.evbuc.com',
      'img.evbstatic.com',
      'images.unsplash.com',
      'ejsllpjzxnbndrrfpjkz.supabase.co',
    ],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Enable CORS for API routes
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ]
  },
  
  // Environment variables validation
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  
  // Production error handling
  onError: (error) => {
    console.error('Next.js error:', error)
  },
}

module.exports = nextConfig