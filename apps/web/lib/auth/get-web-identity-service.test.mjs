import assert from 'node:assert/strict';
import test from 'node:test';

import { AUTH_UNAVAILABLE_MESSAGE } from '@diabetes-universe/identity';

import {
  getAuthUnavailableMessage,
  getWebAuthConfigurationDiagnostic,
  isWebAuthConfigured,
} from './get-web-identity-service.ts';

const originalEnv = { ...process.env };

test.afterEach(() => {
  process.env = { ...originalEnv };
});

test('getAuthUnavailableMessage never exposes configuration diagnostics', () => {
  process.env = {
    AUTH_DATABASE_MODE: 'pglite',
    BETTER_AUTH_SECRET: 'x'.repeat(32),
  };

  assert.equal(isWebAuthConfigured(), false);
  assert.match(
    getWebAuthConfigurationDiagnostic() ?? '',
    /BETTER_AUTH_URL|Missing required auth environment/,
  );

  const message = getAuthUnavailableMessage();

  assert.equal(message, AUTH_UNAVAILABLE_MESSAGE);
  assert.doesNotMatch(
    message,
    /BETTER_AUTH|DATABASE_URL|RESEND_API_KEY|AUTH_EMAIL_FROM/,
  );
});

test('getAuthUnavailableMessage stays generic when postgres email delivery is missing', () => {
  process.env = {
    AUTH_DATABASE_MODE: 'postgres',
    BETTER_AUTH_SECRET: 'x'.repeat(32),
    BETTER_AUTH_URL: 'https://example.com',
    DATABASE_URL: 'postgres://user:pass@localhost:5432/app',
  };

  assert.equal(isWebAuthConfigured(), false);
  assert.match(
    getWebAuthConfigurationDiagnostic() ?? '',
    /RESEND_API_KEY and AUTH_EMAIL_FROM/,
  );
  assert.equal(getAuthUnavailableMessage(), AUTH_UNAVAILABLE_MESSAGE);
});
