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
