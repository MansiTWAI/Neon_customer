import type { NextConfig } from 'next';

const apiUrl = process.env.API_URL ?? 'http://localhost:4000';

// Sent with every page. Framing is refused outright, so clickjacking is not possible.
const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(self), payment=()' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }];
  },
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
