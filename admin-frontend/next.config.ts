import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
      {
        source: '/auth/:path*',
        destination: 'http://localhost:3001/auth/:path*',
      },
      {
        source: '/admin-auth/:path*',
        destination: 'http://localhost:3001/admin-auth/:path*',
      },
      {
        source: '/profile/:path*',
        destination: 'http://localhost:3001/profile/:path*',
      },
    ];
  },
};

export default nextConfig;
