import assert from 'node:assert/strict';
import test from 'node:test';

import { classifyMagicLinkError } from './classify-magic-link-error.ts';

test('classifies a schema failure without leaking database URL or email', () => {
  const error = new Error(
    'relation "verification" does not exist for user@example.com at postgres://secret',
  );
  error.code = '42P01';
  const diagnostic = classifyMagicLinkError(error);

  assert.deepEqual(diagnostic, { category: 'database_schema', code: '42P01' });
  assert.doesNotMatch(JSON.stringify(diagnostic), /user@|postgres:\/\/|secret/);
});

test('classifies nested connection errors and rejects unsafe codes', () => {
  const error = new Error('Internal auth failure', {
    cause: new Error('fetch failed for user@example.com'),
  });
  error.code = 'secret@example.com';
  assert.deepEqual(classifyMagicLinkError(error), { category: 'connection' });
});

test('retains only bounded numeric HTTP status', () => {
  const error = new Error('invalid origin for user@example.com');
  error.status = 403;
  assert.deepEqual(classifyMagicLinkError(error), {
    category: 'auth_origin',
    status: 403,
  });
});
