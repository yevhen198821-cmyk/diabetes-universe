import { createHash } from 'node:crypto';

import { themeInitScript } from '../theme/theme-config';

export const THEME_INIT_SCRIPT_SHA256 = createHash('sha256')
  .update(themeInitScript)
  .digest('base64');

export const SECURITY_HEADER_NAMES = {
  contentSecurityPolicy: 'Content-Security-Policy',
  permissionsPolicy: 'Permissions-Policy',
  referrerPolicy: 'Referrer-Policy',
  strictTransportSecurity: 'Strict-Transport-Security',
  xContentTypeOptions: 'X-Content-Type-Options',
  xFrameOptions: 'X-Frame-Options',
} as const;

export const SECURITY_NONCE_HEADER = 'x-nonce';

export interface ContentSecurityPolicyOptions {
  readonly includeVercelLive?: boolean;
  readonly isDevelopment?: boolean;
  readonly nonce?: string;
}

export function buildContentSecurityPolicy(
  options: ContentSecurityPolicyOptions = {},
): string {
  const scriptSources = ["'self'"];
  if (options.nonce) {
    scriptSources.push(`'nonce-${options.nonce}'`);
  }
  scriptSources.push(`'sha256-${THEME_INIT_SCRIPT_SHA256}'`);
  if (options.includeVercelLive) {
    scriptSources.push('https://vercel.live');
  }
  if (options.isDevelopment) {
    scriptSources.push("'unsafe-inline'", "'unsafe-eval'");
  } else if (options.nonce) {
    scriptSources.push("'strict-dynamic'");
  }

  const connectSources = ["'self'"];
  if (options.isDevelopment) {
    connectSources.push('ws:', 'wss:');
  }
  if (options.includeVercelLive) {
    connectSources.push('https://vercel.live', 'wss://*.pusher.com');
  }

  return [
    "default-src 'self'",
    `script-src ${scriptSources.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self'",
    `connect-src ${connectSources.join(' ')}`,
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    "worker-src 'self' blob:",
  ].join('; ');
}

export function buildProductionContentSecurityPolicy(
  options: ContentSecurityPolicyOptions = {},
): string {
  return buildContentSecurityPolicy({
    ...options,
    isDevelopment: false,
  });
}

export function buildPermissionsPolicy(): string {
  return [
    'accelerometer=()',
    'bluetooth=()',
    'camera=()',
    'geolocation=()',
    'gyroscope=()',
    'microphone=()',
    'payment=()',
    'usb=()',
  ].join(', ');
}

export function shouldAttachHsts(nodeEnv = process.env.NODE_ENV): boolean {
  return nodeEnv === 'production';
}

export function resolveContentSecurityPolicyRuntime(
  env: Record<string, string | undefined> = process.env,
): Pick<ContentSecurityPolicyOptions, 'includeVercelLive' | 'isDevelopment'> {
  return {
    includeVercelLive: env.VERCEL_ENV === 'preview',
    isDevelopment: env.NODE_ENV !== 'production',
  };
}

export function buildApplicationSecurityHeaders(options?: {
  readonly includeContentSecurityPolicy?: boolean;
  readonly includeHsts?: boolean;
  readonly includeVercelLive?: boolean;
  readonly isDevelopment?: boolean;
  readonly nonce?: string;
}): ReadonlyArray<{ readonly key: string; readonly value: string }> {
  const headers: Array<{ key: string; value: string }> = [
    {
      key: SECURITY_HEADER_NAMES.xContentTypeOptions,
      value: 'nosniff',
    },
    {
      key: SECURITY_HEADER_NAMES.referrerPolicy,
      value: 'strict-origin-when-cross-origin',
    },
    {
      key: SECURITY_HEADER_NAMES.permissionsPolicy,
      value: buildPermissionsPolicy(),
    },
    {
      key: SECURITY_HEADER_NAMES.xFrameOptions,
      value: 'DENY',
    },
  ];

  if (options?.includeContentSecurityPolicy ?? true) {
    headers.unshift({
      key: SECURITY_HEADER_NAMES.contentSecurityPolicy,
      value: buildContentSecurityPolicy({
        includeVercelLive: options?.includeVercelLive,
        isDevelopment: options?.isDevelopment,
        nonce: options?.nonce,
      }),
    });
  }

  if (options?.includeHsts ?? shouldAttachHsts()) {
    headers.push({
      key: SECURITY_HEADER_NAMES.strictTransportSecurity,
      value: 'max-age=15552000',
    });
  }

  return headers;
}
