import assert from 'node:assert/strict';
import test from 'node:test';

import { isMedicalApiTestAuthAllowed } from './is-medical-api-test-auth-allowed.ts';

test('production NODE_ENV disables test auth even when the enable flag is 1', () => {
  assert.equal(
    isMedicalApiTestAuthAllowed({
      enableTestAuth: '1',
      nodeEnv: 'production',
    }),
    false,
  );
});

test('production NODE_ENV disables test auth when the flag is 0 or missing', () => {
  assert.equal(
    isMedicalApiTestAuthAllowed({
      enableTestAuth: '0',
      nodeEnv: 'production',
    }),
    false,
  );
  assert.equal(
    isMedicalApiTestAuthAllowed({
      nodeEnv: 'production',
    }),
    false,
  );
});

test('VERCEL_ENV=production disables test auth even when NODE_ENV is test', () => {
  assert.equal(
    isMedicalApiTestAuthAllowed({
      enableTestAuth: '1',
      nodeEnv: 'test',
      vercelEnv: 'production',
    }),
    false,
  );
});

test('AUTH_RUNTIME_ENV=production disables test auth unconditionally', () => {
  assert.equal(
    isMedicalApiTestAuthAllowed({
      authRuntimeEnv: 'production',
      enableTestAuth: '1',
      nodeEnv: 'development',
    }),
    false,
  );
});

test('NODE_ENV=test allows test auth without the enable flag', () => {
  assert.equal(
    isMedicalApiTestAuthAllowed({
      nodeEnv: 'test',
    }),
    true,
  );
});

test('development allows test auth only with the explicit enable flag', () => {
  assert.equal(
    isMedicalApiTestAuthAllowed({
      enableTestAuth: '1',
      nodeEnv: 'development',
    }),
    true,
  );
  assert.equal(
    isMedicalApiTestAuthAllowed({
      nodeEnv: 'development',
    }),
    false,
  );
});
