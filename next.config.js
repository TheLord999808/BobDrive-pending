/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    serverRuntimeConfig: {
      // Will only be available on the server side
      backendUrl: process.env.BACKEND_URL || 'http://localhost:5000',
    },
    publicRuntimeConfig: {
      // Will be available on both server and client
      apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
    },
    async rewrites() {
      return [
        // Rewrite API requests to the backend server in development
        {
          source: '/api/v1/:path*',
          destination: 'http://localhost:5000/api/v1/:path*',
        },
      ];
    },
    // Handle image optimization for file previews
    images: {
      domains: ['localhost'],
      remotePatterns: [
        {
          protocol: 'http',
          hostname: 'localhost',
          port: '5000',
          pathname: '/storage/**',
        },
      ],
    },
  };
  
  module.exports = nextConfig;