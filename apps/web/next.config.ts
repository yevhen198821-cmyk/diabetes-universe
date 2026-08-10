import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
