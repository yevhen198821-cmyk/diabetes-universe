import { expect, test } from './support/test';

const REQUIRED_HEADERS = {
  'content-security-policy': /default-src 'self'/,
  'permissions-policy': /camera=\(\)/,
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
} as const;

type HeaderReadable = {
  headers(): Record<string, string>;
};

async function expectSecurityHeaders(response: HeaderReadable) {
  for (const [name, expected] of Object.entries(REQUIRED_HEADERS)) {
    const value = response.headers()[name];
    expect(value, name).toBeTruthy();
    if (expected instanceof RegExp) {
      expect(value).toMatch(expected);
    } else {
      expect(value).toBe(expected);
    }
  }

  const csp = response.headers()['content-security-policy'];
  expect(csp).toMatch(/frame-ancestors 'none'/);
  expect(csp).toMatch(/script-src 'self'/);
  expect(csp).not.toMatch(/script-src \*/);
  expect(csp).toMatch(/nonce-/);
  expect(response.headers()['strict-transport-security']).toBe(
    'max-age=15552000',
  );
}

test('home page sends production security headers', async ({ page }) => {
  const response = await page.goto('/');
  expect(response).toBeTruthy();
  await expectSecurityHeaders(response!);
});

test('timeline and auth pages send production security headers', async ({
  page,
}) => {
  const timeline = await page.goto('/timeline');
  await expectSecurityHeaders(timeline!);

  const auth = await page.goto('/auth');
  await expectSecurityHeaders(auth!);
});

test('medical API error responses inherit global security headers', async ({
  request,
}) => {
  const response = await request.get('/api/v1/medical/me/diabetes-settings');
  expect([401, 200]).toContain(response.status());
  expect(response.status()).not.toBe(503);
  await expectSecurityHeaders(response);
});
