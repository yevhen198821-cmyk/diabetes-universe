import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@diabetes-universe/ui'],
};

export default nextConfig;
