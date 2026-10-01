import type { NextConfig } from 'next';

const apiUrl = process.env.API_URL ?? 'http://localhost:4000';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    return [{ source: '/v1/:path*', destination: `${apiUrl}/v1/:path*` }];
  },
  // Konva's Node entry optionally requires `canvas`; the studio only ever renders client-side.
  webpack: (config) => {
    config.externals = [...(config.externals ?? []), { canvas: 'canvas' }];
    return config;
  },
};

export default nextConfig;
