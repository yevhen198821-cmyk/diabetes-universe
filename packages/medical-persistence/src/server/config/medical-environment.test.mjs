import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveMedicalEnvironment } from './medical-environment.ts';

test('resolveMedicalEnvironment fails closed without MEDICAL_DATABASE_URL in production mode', () => {
  assert.throws(
    () =>
      resolveMedicalEnvironment({
        NODE_ENV: 'production',
        MEDICAL_DATABASE_MODE: 'postgres',
      }),
    /Medical database is not configured/,
  );
});

test('resolveMedicalEnvironment requires revision secret for postgres mode', () => {
  assert.throws(
    () =>
      resolveMedicalEnvironment({
        MEDICAL_DATABASE_URL: 'postgres://user:pass@localhost:5432/medical',
      }),
    /MEDICAL_REVISION_TOKEN_SECRET is required/,
  );
});
