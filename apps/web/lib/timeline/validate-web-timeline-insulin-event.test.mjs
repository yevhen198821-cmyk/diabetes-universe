import assert from 'node:assert/strict';
import test from 'node:test';

import {
  INSULIN_CANONICAL_DOSE_TECHNICAL_MAXIMUM,
  validateInsulinCanonicalDose,
} from '@diabetes-universe/medical-domain';

import {
  createWebTimelineSemanticEventValidator,
  validateWebTimelineInsulinEvent,
} from './validate-web-timeline-insulin-event.ts';

const FIXED_NOW = '2026-08-09T19:00:00.000Z';

function insulinEvent(overrides = {}) {
  return {
    createdAt: FIXED_NOW,
    doseUnits: 4,
    id: 'insulin-1',
    kind: 'insulin',
    occurredAt: FIXED_NOW,
    preparation: 'NovoRapid',
    preparationId: 'insulin.prep.aspart_novorapid',
    administrationContext: 'correction',
    schemaVersion: 1,
    source: 'manual',
    updatedAt: FIXED_NOW,
    ...overrides,
  };
}

test('web insulin validator accepts canonical semantic and legacy insulin', () => {
  const validator = createWebTimelineSemanticEventValidator();

  assert.equal(validator(insulinEvent()), true);
  assert.equal(
    validator(
      insulinEvent({
        administrationContext: undefined,
        preparationId: undefined,
      }),
    ),
    true,
  );
  assert.equal(validator(insulinEvent({ doseUnits: 125 })), true);
  assert.equal(validator(insulinEvent({ doseUnits: 12.125 })), true);
  assert.equal(
    validator(
      insulinEvent({
        doseUnits: INSULIN_CANONICAL_DOSE_TECHNICAL_MAXIMUM,
      }),
    ),
    true,
  );
});

test('web insulin validator rejects malformed semantic insulin', () => {
  assert.equal(
    validateWebTimelineInsulinEvent(insulinEvent({ doseUnits: 0 })),
    false,
  );
  assert.equal(
    validateWebTimelineInsulinEvent(insulinEvent({ doseUnits: -1 })),
    false,
  );
  assert.equal(
    validateWebTimelineInsulinEvent(
      insulinEvent({ doseUnits: INSULIN_CANONICAL_DOSE_TECHNICAL_MAXIMUM + 1 }),
    ),
    false,
  );
  assert.equal(
    validateWebTimelineInsulinEvent(
      insulinEvent({ preparationId: 'insulin.prep.unmapped' }),
    ),
    false,
  );
  assert.equal(
    validateWebTimelineInsulinEvent(
      insulinEvent({ preparationId: 'NovoRapid' }),
    ),
    false,
  );
  assert.equal(
    validateWebTimelineInsulinEvent(
      insulinEvent({ administrationContext: 'meal' }),
    ),
    false,
  );
  assert.equal(
    validateWebTimelineInsulinEvent(insulinEvent({ preparation: '   ' })),
    false,
  );
});

test('OpenAPI insulin dose maximum matches the medical-domain canonical bound', () => {
  assert.equal(INSULIN_CANONICAL_DOSE_TECHNICAL_MAXIMUM, 500);
  assert.deepEqual(validateInsulinCanonicalDose(500), {
    ok: true,
    doseUnits: 500,
  });
});
