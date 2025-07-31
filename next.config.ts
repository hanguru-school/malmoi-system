import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Enable SWC minification for faster builds
  swcMinify: true,
  
  // Configure images for production
  images: {
    domains: [
      'malmoi-system-files.s3.ap-northeast-1.amazonaws.com',
      'app.hanguru.school'
    ],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Configure experimental features
  experimental: {
    // Enable typed routes
    typedRoutes: true,
  },
  
  // Configure webpack for production optimization
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      }
    }
    
    return config
  },
  
  // Configure headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
  
  // Configure redirects
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: true,
      },
      {
        source: '/student',
        destination: '/student/dashboard',
        permanent: true,
      },
      {
        source: '/teacher',
        destination: '/teacher/dashboard',
        permanent: true,
      },
    ]
  },
  
  // Configure environment variables
  env: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_NODE_ENV: process.env.NODE_ENV,
  },
}

export default nextConfig 