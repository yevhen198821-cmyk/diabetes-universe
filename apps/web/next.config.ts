import type { NextConfig } from 'next';

import webPackage from './package.json' with { type: 'json' };
import { buildApplicationSecurityHeaders } from './lib/security/security-headers';

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: webPackage.version,
  },
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: [
    '@electric-sql/pglite',
    'better-auth',
    '@better-auth/drizzle-adapter',
    'postgres',
  ],
  transpilePackages: ['@diabetes-universe/identity', '@diabetes-universe/ui'],
  async headers() {
    return [
      {
        source: '/:path*',
        // CSP is attached per request in proxy.ts so Next.js can use a nonce.
        headers: [
          ...buildApplicationSecurityHeaders({
            includeContentSecurityPolicy: false,
          }),
        ],
      },
    ];
  },
};

export default nextConfig;
