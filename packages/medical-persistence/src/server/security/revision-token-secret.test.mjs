import assert from 'node:assert/strict';
import test from 'node:test';

import {
  validateRevisionTokenSecret,
  WeakRevisionTokenSecretError,
} from './revision-token-secret.ts';
import { createRevisionTokenService } from './revision-token-service.ts';

const STRONG_SECRET = 'production-grade-medical-revision-token-secret-value-32';

test('validateRevisionTokenSecret rejects empty and weak secrets', () => {
  assert.throws(
    () => validateRevisionTokenSecret(''),
    WeakRevisionTokenSecretError,
  );
  assert.throws(
    () => validateRevisionTokenSecret('short-secret'),
    WeakRevisionTokenSecretError,
  );
  assert.throws(
    () => validateRevisionTokenSecret('test-medical-revision-token-secret'),
    WeakRevisionTokenSecretError,
  );
  assert.throws(
    () => validateRevisionTokenSecret('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
    WeakRevisionTokenSecretError,
  );
});

test('validateRevisionTokenSecret allows test default only when explicitly permitted', () => {
  validateRevisionTokenSecret('test-medical-revision-token-secret', {
    allowTestDefault: true,
  });
  assert.throws(
    () => validateRevisionTokenSecret('test-medical-revision-token-secret'),
    WeakRevisionTokenSecretError,
  );
});

test('createRevisionTokenService rejects weak production secrets', () => {
  assert.throws(
    () => createRevisionTokenService('weak'),
    WeakRevisionTokenSecretError,
  );
});

test('revision token service accepts strong secrets and bigint revisions', () => {
  const service = createRevisionTokenService(STRONG_SECRET);
  const token = service.createToken(
    '11111111-1111-4111-8111-111111111111',
    9007199254740990n,
  );
  const parsed = service.verifyAndParse(
    token,
    '11111111-1111-4111-8111-111111111111',
  );

  assert.equal(parsed.revision, 9007199254740990n);
});
