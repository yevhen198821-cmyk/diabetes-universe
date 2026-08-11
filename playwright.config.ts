import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  expect: {
    timeout: 10_000,
  },
  testDir: './apps/web/e2e',
  reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:3010',
    timezoneId: 'UTC',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'pnpm --dir apps/web exec next start -p 3010',
    env: {
      AUTH_DATABASE_MODE: 'pglite',
      AUTH_E2E_FIXTURES: 'true',
      AUTH_PGLITE_DATA_DIR: '/tmp/du-auth-pglite-e2e',
      AUTH_RUNTIME_ENV: 'e2e',
      AUTH_USE_PGLITE: 'true',
      AUTH_WEBAUTHN_ORIGIN: 'http://127.0.0.1:3010',
      AUTH_WEBAUTHN_RP_ID: '127.0.0.1',
      AUTH_WEBAUTHN_RP_NAME: 'Diabetes Universe E2E',
      BETTER_AUTH_SECRET: 'test-secret-should-be-at-least-32-characters',
      BETTER_AUTH_URL: 'http://127.0.0.1:3010',
    },
    reuseExistingServer: false,
    timeout: 120_000,
    url: 'http://127.0.0.1:3010',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
