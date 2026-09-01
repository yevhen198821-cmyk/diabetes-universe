import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MedicalApiValidationError,
  validateCreateRequestBody,
  validateSemanticEvent,
  validateUpdateRequestBody,
} from './medical-api-validation.ts';
import { MEDICAL_VALIDATION_BOUNDS } from './medical-api-validation-bounds.ts';

function sampleSemanticInsulinEvent(overrides = {}) {
  return {
    occurredAt: '2026-09-01T08:00:00.000Z',
    schemaVersion: 1,
    source: 'manual',
    kind: 'insulin',
    preparationId: 'insulin.prep.aspart_novorapid',
    preparation: 'NovoRapid',
    doseUnits: 12.25,
    administrationContext: 'before_meal',
    ...overrides,
  };
}

function sampleLegacyInsulinEvent(overrides = {}) {
  return {
    occurredAt: '2026-09-01T08:00:00.000Z',
    schemaVersion: 1,
    source: 'manual',
    kind: 'insulin',
    preparation: 'NovoRapid',
    doseUnits: 4,
    context: 'Перед едой',
    ...overrides,
  };
}

test('semantic insulin create payload is accepted unchanged', () => {
  const event = sampleSemanticInsulinEvent();
  const parsed = validateCreateRequestBody({ event });

  assert.equal(parsed.kind, 'insulin');
  assert.equal(parsed.preparationId, 'insulin.prep.aspart_novorapid');
  assert.equal(parsed.preparation, 'NovoRapid');
  assert.equal(parsed.doseUnits, 12.25);
  assert.equal(parsed.administrationContext, 'before_meal');
  assert.equal(Object.hasOwn(parsed, 'context'), false);
});

test('semantic insulin update payload is accepted unchanged', () => {
  const event = sampleSemanticInsulinEvent({
    preparationId: 'insulin.prep.glargine_lantus',
    preparation: 'Lantus',
    doseUnits: 10,
    administrationContext: 'basal',
  });
  const parsed = validateUpdateRequestBody({ event });

  assert.equal(parsed.preparationId, 'insulin.prep.glargine_lantus');
  assert.equal(parsed.preparation, 'Lantus');
  assert.equal(parsed.doseUnits, 10);
  assert.equal(parsed.administrationContext, 'basal');
});

test('legacy insulin payload remains accepted without fabricated preparationId', () => {
  const parsed = validateSemanticEvent(sampleLegacyInsulinEvent(), 'event');

  assert.equal(parsed.preparation, 'NovoRapid');
  assert.equal(parsed.context, 'Перед едой');
  assert.equal(Object.hasOwn(parsed, 'preparationId'), false);
  assert.equal(Object.hasOwn(parsed, 'administrationContext'), false);
});

test('transitional insulin payload keeps both context fields without rewrite', () => {
  const parsed = validateSemanticEvent(
    sampleSemanticInsulinEvent({ context: 'Перед едой' }),
    'event',
  );

  assert.equal(parsed.administrationContext, 'before_meal');
  assert.equal(parsed.context, 'Перед едой');
});

test('rejects invalid preparationId', () => {
  assert.throws(
    () =>
      validateSemanticEvent(
        sampleSemanticInsulinEvent({
          preparationId: 'insulin.prep.unknown',
        }),
        'event',
      ),
    (error) =>
      error instanceof MedicalApiValidationError &&
      error.message === 'event.preparationId is invalid.',
  );
});

test('rejects insulin.prep.unmapped as preparationId', () => {
  assert.throws(
    () =>
      validateSemanticEvent(
        sampleSemanticInsulinEvent({
          preparationId: 'insulin.prep.unmapped',
        }),
        'event',
      ),
    MedicalApiValidationError,
  );
});

test('rejects localized preparation label as preparationId', () => {
  assert.throws(
    () =>
      validateSemanticEvent(
        sampleSemanticInsulinEvent({ preparationId: 'NovoRapid' }),
        'event',
      ),
    MedicalApiValidationError,
  );
});

test('rejects invalid administrationContext', () => {
  assert.throws(
    () =>
      validateSemanticEvent(
        sampleSemanticInsulinEvent({ administrationContext: 'meal' }),
        'event',
      ),
    (error) =>
      error instanceof MedicalApiValidationError &&
      error.message === 'event.administrationContext is invalid.',
  );
});

test('rejects localized administration text as administrationContext', () => {
  assert.throws(
    () =>
      validateSemanticEvent(
        sampleSemanticInsulinEvent({
          administrationContext: 'Перед едой',
        }),
        'event',
      ),
    MedicalApiValidationError,
  );
});

test('rejects preparationCategory as an unknown field', () => {
  assert.throws(
    () =>
      validateSemanticEvent(
        sampleSemanticInsulinEvent({ preparationCategory: 'rapid_acting' }),
        'event',
      ),
    (error) =>
      error instanceof MedicalApiValidationError &&
      error.message === 'Unknown field: preparationCategory.',
  );
});

test('rejects unknown insulin field', () => {
  assert.throws(
    () =>
      validateSemanticEvent(
        sampleSemanticInsulinEvent({ pumpMode: 'auto' }),
        'event',
      ),
    (error) =>
      error instanceof MedicalApiValidationError &&
      error.message === 'Unknown field: pumpMode.',
  );
});

test('rejects empty preparation snapshot', () => {
  assert.throws(
    () =>
      validateSemanticEvent(
        sampleSemanticInsulinEvent({
          preparationId: 'insulin.prep.other',
          preparation: '',
        }),
        'event',
      ),
    MedicalApiValidationError,
  );
});

test('rejects non-finite and out-of-bound doseUnits', () => {
  assert.throws(
    () =>
      validateSemanticEvent(
        sampleSemanticInsulinEvent({ doseUnits: Number.NaN }),
        'event',
      ),
    MedicalApiValidationError,
  );
  assert.throws(
    () =>
      validateSemanticEvent(
        sampleSemanticInsulinEvent({
          doseUnits: MEDICAL_VALIDATION_BOUNDS.INSULIN_DOSE_MAX + 1,
        }),
        'event',
      ),
    MedicalApiValidationError,
  );
});

test('accepts doseUnits with more than two decimals without rounding', () => {
  const parsed = validateSemanticEvent(
    sampleSemanticInsulinEvent({ doseUnits: 12.125 }),
    'event',
  );

  assert.equal(parsed.doseUnits, 12.125);
});

test('medication nutrition activity and note payloads remain valid', () => {
  assert.equal(
    validateSemanticEvent(
      {
        occurredAt: '2026-09-01T08:00:00.000Z',
        schemaVersion: 1,
        source: 'manual',
        kind: 'medication',
        medicationName: 'Metformin',
        dose: 500,
        doseUnit: 'mg',
      },
      'event',
    ).kind,
    'medication',
  );
  assert.equal(
    validateSemanticEvent(
      {
        occurredAt: '2026-09-01T08:00:00.000Z',
        schemaVersion: 1,
        source: 'manual',
        kind: 'nutrition',
        mode: 'quick',
        mealType: 'breakfast',
        carbohydratesGrams: 45,
      },
      'event',
    ).kind,
    'nutrition',
  );
  assert.equal(
    validateSemanticEvent(
      {
        occurredAt: '2026-09-01T08:00:00.000Z',
        schemaVersion: 1,
        source: 'manual',
        kind: 'activity',
        activityType: 'walk',
        durationSeconds: 1800,
      },
      'event',
    ).kind,
    'activity',
  );
  assert.equal(
    validateSemanticEvent(
      {
        occurredAt: '2026-09-01T08:00:00.000Z',
        schemaVersion: 1,
        source: 'manual',
        kind: 'note',
        body: 'Felt well',
      },
      'event',
    ).kind,
    'note',
  );
});
