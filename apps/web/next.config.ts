import type { NextConfig } from 'next';

import webPackage from './package.json' with { type: 'json' };

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: webPackage.version,
  },
  reactStrictMode: true,
  serverExternalPackages: [
    '@electric-sql/pglite',
    'better-auth',
    '@better-auth/drizzle-adapter',
    'postgres',
  ],
  transpilePackages: ['@diabetes-universe/identity', '@diabetes-universe/ui'],
};

export default nextConfig;
