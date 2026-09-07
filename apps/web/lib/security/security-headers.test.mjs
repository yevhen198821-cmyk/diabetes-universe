import assert from 'node:assert/strict';
import test from 'node:test';

import { themeInitScript } from '../theme/theme-config.ts';
import {
  THEME_INIT_SCRIPT_SHA256,
  buildApplicationSecurityHeaders,
  buildContentSecurityPolicy,
  buildProductionContentSecurityPolicy,
  resolveContentSecurityPolicyRuntime,
  shouldAttachHsts,
} from './security-headers.ts';

test('production CSP includes hashed theme script, nonce, and clickjacking protection', () => {
  const csp = buildProductionContentSecurityPolicy({ nonce: 'test-nonce' });

  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /script-src 'self' 'nonce-test-nonce'/);
  assert.equal(csp.includes(`'sha256-${THEME_INIT_SCRIPT_SHA256}'`), true);
  assert.doesNotMatch(csp, /'strict-dynamic'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /object-src 'none'/);
  assert.doesNotMatch(csp, /script-src \*/);
  assert.doesNotMatch(csp, /unsafe-eval/);
  assert.match(themeInitScript, /du-ui-theme/);
});

test('development CSP allows Next.js tooling without wildcard script-src', () => {
  const csp = buildContentSecurityPolicy({
    isDevelopment: true,
    nonce: 'dev-nonce',
  });

  assert.match(csp, /unsafe-eval/);
  assert.match(csp, /unsafe-inline/);
  assert.match(csp, /connect-src 'self' ws: wss:/);
  assert.doesNotMatch(csp, /script-src \*/);
});

test('Vercel preview CSP allows the preview toolbar without opening production', () => {
  const preview = buildContentSecurityPolicy({
    includeVercelLive: true,
    nonce: 'preview-nonce',
  });
  const production = buildProductionContentSecurityPolicy({
    nonce: 'prod-nonce',
  });

  assert.match(preview, /https:\/\/vercel\.live/);
  assert.doesNotMatch(production, /vercel\.live/);
  assert.deepEqual(
    resolveContentSecurityPolicyRuntime({
      NODE_ENV: 'production',
      VERCEL_ENV: 'preview',
    }),
    { includeVercelLive: true, isDevelopment: false },
  );
});

test('application headers include required production hardening', () => {
  const headers = buildApplicationSecurityHeaders({
    includeHsts: true,
    nonce: 'header-nonce',
  });
  const map = Object.fromEntries(
    headers.map((header) => [header.key, header.value]),
  );

  assert.equal(map['X-Content-Type-Options'], 'nosniff');
  assert.equal(map['Referrer-Policy'], 'strict-origin-when-cross-origin');
  assert.match(map['Permissions-Policy'], /camera=\(\)/);
  assert.match(map['Permissions-Policy'], /geolocation=\(\)/);
  assert.equal(map['X-Frame-Options'], 'DENY');
  assert.equal(map['Strict-Transport-Security'], 'max-age=15552000');
  assert.match(map['Content-Security-Policy'], /frame-ancestors 'none'/);
  assert.match(map['Content-Security-Policy'], /nonce-header-nonce/);
});

test('next.config static headers omit CSP so proxy can set a nonce policy', () => {
  const headers = buildApplicationSecurityHeaders({
    includeContentSecurityPolicy: false,
    includeHsts: true,
  });

  assert.equal(
    headers.some((header) => header.key === 'Content-Security-Policy'),
    false,
  );
  assert.equal(
    headers.some((header) => header.key === 'X-Content-Type-Options'),
    true,
  );
});

test('HSTS is production-only', () => {
  assert.equal(shouldAttachHsts('production'), true);
  assert.equal(shouldAttachHsts('development'), false);
  assert.equal(shouldAttachHsts('test'), false);

  const developmentHeaders = buildApplicationSecurityHeaders({
    includeHsts: false,
  });
  assert.equal(
    developmentHeaders.some(
      (header) => header.key === 'Strict-Transport-Security',
    ),
    false,
  );
});
