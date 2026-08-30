import assert from 'node:assert/strict';
import test from 'node:test';

import {
  INSULIN_ADMINISTRATION_CONTEXTS,
  isInsulinAdministrationContext,
  resolveInsulinNewWriteAdministrationContext,
} from './insulin-administration-context.ts';

test('every approved administration context is accepted', () => {
  for (const context of INSULIN_ADMINISTRATION_CONTEXTS) {
    assert.equal(isInsulinAdministrationContext(context), true);
    assert.deepEqual(resolveInsulinNewWriteAdministrationContext(context), {
      ok: true,
      administrationContext: context,
    });
  }
});

test('missing or no-choice new-write context becomes unspecified', () => {
  assert.deepEqual(resolveInsulinNewWriteAdministrationContext(undefined), {
    ok: true,
    administrationContext: 'unspecified',
  });
  assert.deepEqual(resolveInsulinNewWriteAdministrationContext(null), {
    ok: true,
    administrationContext: 'unspecified',
  });
  assert.deepEqual(resolveInsulinNewWriteAdministrationContext(''), {
    ok: true,
    administrationContext: 'unspecified',
  });
});

test('invalid administration context tokens are rejected', () => {
  assert.equal(isInsulinAdministrationContext('Перед едой'), false);
  assert.equal(isInsulinAdministrationContext('meal'), false);
  assert.deepEqual(resolveInsulinNewWriteAdministrationContext('meal'), {
    ok: false,
    error: 'insulin.administration_context.invalid',
  });
  assert.deepEqual(resolveInsulinNewWriteAdministrationContext(' '), {
    ok: false,
    error: 'insulin.administration_context.invalid',
  });
});
