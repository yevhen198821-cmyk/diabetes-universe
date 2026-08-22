import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MedicalApiValidationError,
  parseJsonBody,
  validateCreateRequestBody,
  validateListLimit,
  validateSemanticEvent,
} from './medical-api-validation.ts';
import { MEDICAL_VALIDATION_BOUNDS } from './medical-api-validation-bounds.ts';

function sampleGlucoseEvent(overrides = {}) {
  return {
    occurredAt: '2026-08-14T10:00:00.000Z',
    schemaVersion: 1,
    source: 'manual',
    kind: 'glucose',
    concentrationMmolPerL: 5.4,
    ...overrides,
  };
}

test('rejects glucose values outside transport bounds', () => {
  assert.throws(
    () =>
      validateSemanticEvent(
        sampleGlucoseEvent({ concentrationMmolPerL: 0 }),
        'event',
      ),
    MedicalApiValidationError,
  );
  assert.throws(
    () =>
      validateSemanticEvent(
        sampleGlucoseEvent({
          concentrationMmolPerL: MEDICAL_VALIDATION_BOUNDS.GLUCOSE_MMOL_MAX + 1,
        }),
        'event',
      ),
    MedicalApiValidationError,
  );
});

test('rejects excessive object nesting depth', () => {
  let nested = { value: 1 };
  for (
    let index = 0;
    index < MEDICAL_VALIDATION_BOUNDS.MAX_OBJECT_DEPTH;
    index += 1
  ) {
    nested = { nested };
  }

  assert.throws(
    () => parseJsonBody(JSON.stringify(nested)),
    MedicalApiValidationError,
  );
});

test('rejects unknown top-level create fields', () => {
  assert.throws(
    () =>
      validateCreateRequestBody({
        event: sampleGlucoseEvent(),
        accountId: 'client-chosen',
      }),
    MedicalApiValidationError,
  );
});

test('rejects list limit above maximum', () => {
  assert.throws(
    () =>
      validateListLimit(String(MEDICAL_VALIDATION_BOUNDS.MAX_LIST_LIMIT + 1)),
    MedicalApiValidationError,
  );
});

test('rejects oversized note body strings', () => {
  assert.throws(
    () =>
      validateSemanticEvent(
        {
          occurredAt: '2026-08-14T10:00:00.000Z',
          schemaVersion: 1,
          source: 'manual',
          kind: 'note',
          body: 'x'.repeat(MEDICAL_VALIDATION_BOUNDS.MAX_STRING_LENGTH + 1),
        },
        'event',
      ),
    MedicalApiValidationError,
  );
});
