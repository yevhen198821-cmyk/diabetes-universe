import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const turboConfig = JSON.parse(
  readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '../../../../turbo.json'),
    'utf8',
  ),
);

const REQUIRED_PRODUCTION_AUTH_BUILD_ENV = [
  'DATABASE_URL',
  'BETTER_AUTH_URL',
  'BETTER_AUTH_SECRET',
  'RESEND_API_KEY',
  'AUTH_EMAIL_FROM',
];

test('turbo build task declares production auth environment variables', () => {
  const buildEnv = turboConfig.tasks?.build?.env ?? [];

  for (const variable of REQUIRED_PRODUCTION_AUTH_BUILD_ENV) {
    assert.equal(
      buildEnv.includes(variable),
      true,
      `expected turbo.json build.env to include ${variable}`,
    );
  }
});
