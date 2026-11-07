/** @type {import('next').NextConfig} */
const isStaticExport = process.env.STATIC_EXPORT === 'true';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  {
    key: 'Permissions-Policy',
    value: 'geolocation=(self), camera=(self), microphone=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
];

const nextConfig = {
  ...(isStaticExport ? { output: 'export', trailingSlash: true } : {}),
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
  // `headers()` is not supported by static export, so the Capacitor builds
  // simply omit them (the native shell does not need HTTP headers).
  async headers() {
    if (isStaticExport) return [];
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default nextConfig;
