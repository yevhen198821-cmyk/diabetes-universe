import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MedicalApiValidationError,
  validateCreateRequestBody,
  validateSemanticEvent,
  validateUpdateRequestBody,
} from './medical-api-validation.ts';
import { validateAdoptionBatchBody } from './medical-adoption-validation.ts';
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

test('adoption validation accepts semantic and legacy insulin payloads', () => {
  const semantic = validateAdoptionBatchBody({
    items: [
      {
        sourceNamespace: 'ns_semantic_insulin',
        localEventId: 'local-semantic-insulin',
        sourceSchemaVersion: 1,
        event: sampleSemanticInsulinEvent(),
      },
    ],
  });
  assert.deepEqual(semantic[0].event, sampleSemanticInsulinEvent());
  assert.equal(Object.hasOwn(semantic[0].event, 'context'), false);

  const legacy = validateAdoptionBatchBody({
    items: [
      {
        sourceNamespace: 'ns_legacy_insulin',
        localEventId: 'local-legacy-insulin',
        sourceSchemaVersion: 1,
        event: sampleLegacyInsulinEvent(),
      },
    ],
  });
  assert.deepEqual(legacy[0].event, sampleLegacyInsulinEvent());
  assert.equal(Object.hasOwn(legacy[0].event, 'preparationId'), false);
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

test('rejects zero, negative, and non-finite doseUnits', () => {
  for (const [doseUnits, message] of [
    [0, 'event.doseUnits must be positive.'],
    [-1, 'event.doseUnits must be positive.'],
    [Number.NaN, 'event.doseUnits must be a finite number.'],
    [Number.POSITIVE_INFINITY, 'event.doseUnits must be a finite number.'],
  ]) {
    assert.throws(
      () =>
        validateSemanticEvent(
          sampleSemanticInsulinEvent({ doseUnits }),
          'event',
        ),
      (error) =>
        error instanceof MedicalApiValidationError && error.message === message,
    );
  }
});

test('accepts the canonical 500 IU ceiling and rejects 500.001', () => {
  const accepted = validateSemanticEvent(
    sampleSemanticInsulinEvent({ doseUnits: 500 }),
    'event',
  );
  assert.equal(accepted.doseUnits, 500);

  assert.throws(
    () =>
      validateSemanticEvent(
        sampleSemanticInsulinEvent({
          doseUnits: MEDICAL_VALIDATION_BOUNDS.INSULIN_DOSE_MAX + 0.001,
        }),
        'event',
      ),
    (error) =>
      error instanceof MedicalApiValidationError &&
      error.message === 'event.doseUnits is out of allowed range.',
  );
});

test('accepts doseUnits with more than two decimals without rounding', () => {
  const parsed = validateSemanticEvent(
    sampleSemanticInsulinEvent({ doseUnits: 12.125 }),
    'event',
  );

  assert.equal(parsed.doseUnits, 12.125);
  assert.equal(Object.is(parsed.doseUnits, 12.125), true);
});

test('PATCH rejects insulin-only fields on a glucose event', () => {
  assert.throws(
    () =>
      validateUpdateRequestBody({
        event: {
          occurredAt: '2026-09-01T08:00:00.000Z',
          schemaVersion: 1,
          source: 'manual',
          kind: 'glucose',
          concentrationMmolPerL: 5.4,
          administrationContext: 'before_meal',
        },
      }),
    (error) =>
      error instanceof MedicalApiValidationError &&
      error.message ===
        'event.administrationContext is only valid for insulin events.',
  );
});

test('rejects new insulin semantic fields on non-insulin kinds', () => {
  const envelope = {
    occurredAt: '2026-09-01T08:00:00.000Z',
    schemaVersion: 1,
    source: 'manual',
  };

  assert.throws(
    () =>
      validateSemanticEvent(
        {
          ...envelope,
          kind: 'glucose',
          concentrationMmolPerL: 5.4,
          preparationId: 'insulin.prep.aspart_novorapid',
        },
        'event',
      ),
    (error) =>
      error instanceof MedicalApiValidationError &&
      error.message === 'event.preparationId is only valid for insulin events.',
  );
  assert.throws(
    () =>
      validateSemanticEvent(
        {
          ...envelope,
          kind: 'glucose',
          concentrationMmolPerL: 5.4,
          administrationContext: 'before_meal',
        },
        'event',
      ),
    MedicalApiValidationError,
  );
  assert.throws(
    () =>
      validateSemanticEvent(
        {
          ...envelope,
          kind: 'nutrition',
          mode: 'quick',
          mealType: 'breakfast',
          carbohydratesGrams: 45,
          preparationId: 'insulin.prep.aspart_novorapid',
        },
        'event',
      ),
    MedicalApiValidationError,
  );
  assert.throws(
    () =>
      validateSemanticEvent(
        {
          ...envelope,
          kind: 'activity',
          activityType: 'walk',
          durationSeconds: 900,
          administrationContext: 'before_meal',
        },
        'event',
      ),
    MedicalApiValidationError,
  );
  assert.throws(
    () =>
      validateSemanticEvent(
        {
          ...envelope,
          kind: 'note',
          body: 'Felt well',
          preparationId: 'insulin.prep.other',
        },
        'event',
      ),
    MedicalApiValidationError,
  );
});

test('adoption rejects insulin-only fields on the wrong kind', () => {
  assert.throws(
    () =>
      validateAdoptionBatchBody({
        items: [
          {
            sourceNamespace: 'ns_wrong_kind',
            localEventId: 'local-wrong-kind',
            sourceSchemaVersion: 1,
            event: {
              occurredAt: '2026-09-01T08:00:00.000Z',
              schemaVersion: 1,
              source: 'manual',
              kind: 'glucose',
              concentrationMmolPerL: 5.4,
              preparationId: 'insulin.prep.aspart_novorapid',
            },
          },
        ],
      }),
    (error) =>
      error instanceof Error &&
      error.message ===
        'items[0].event.preparationId is only valid for insulin events.',
  );
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
