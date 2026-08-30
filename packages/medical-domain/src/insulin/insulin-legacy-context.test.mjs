import assert from 'node:assert/strict';
import test from 'node:test';

import { mapLegacyInsulinAdministrationContext } from './insulin-legacy-context.ts';

test('legacy mapping accepts exact stored Russian demo strings', () => {
  assert.deepEqual(mapLegacyInsulinAdministrationContext('Перед едой'), {
    matched: true,
    administrationContext: 'before_meal',
  });
  assert.deepEqual(mapLegacyInsulinAdministrationContext('После еды'), {
    matched: true,
    administrationContext: 'after_meal',
  });
  assert.deepEqual(mapLegacyInsulinAdministrationContext('Коррекция'), {
    matched: true,
    administrationContext: 'correction',
  });
  assert.deepEqual(mapLegacyInsulinAdministrationContext('Базальный'), {
    matched: true,
    administrationContext: 'basal',
  });
  assert.deepEqual(mapLegacyInsulinAdministrationContext('Другое'), {
    matched: true,
    administrationContext: 'other',
  });
});

test('legacy mapping leaves blank, partial, cased, and unknown strings unmatched', () => {
  assert.deepEqual(mapLegacyInsulinAdministrationContext(undefined), {
    matched: false,
  });
  assert.deepEqual(mapLegacyInsulinAdministrationContext(null), {
    matched: false,
  });
  assert.deepEqual(mapLegacyInsulinAdministrationContext(''), {
    matched: false,
  });
  assert.deepEqual(mapLegacyInsulinAdministrationContext('   '), {
    matched: false,
  });
  assert.deepEqual(mapLegacyInsulinAdministrationContext('Перед'), {
    matched: false,
  });
  assert.deepEqual(mapLegacyInsulinAdministrationContext('перед едой'), {
    matched: false,
  });
  assert.deepEqual(mapLegacyInsulinAdministrationContext('Before meal'), {
    matched: false,
  });
  assert.deepEqual(mapLegacyInsulinAdministrationContext(' Перед едой'), {
    matched: false,
  });
});
