import assert from 'node:assert/strict';
import test from 'node:test';

import { liftLegacyToSemantic } from '../migration/lift-legacy-to-semantic.ts';

const MIGRATED_AT = '2026-08-09T08:30:00.000Z';

function createContext(overrides = {}) {
  return {
    migratedAt: MIGRATED_AT,
    ...overrides,
  };
}

function assertOk(result) {
  assert.equal(result.status, 'ok');
  return result;
}

function assertQuarantined(result, reason) {
  assert.equal(result.status, 'quarantined');
  assert.equal(result.quarantine.reason, reason);
  return result;
}

const glucoseLegacy = {
  context: 'Перед завтраком',
  dateTime: '2026-08-02T05:00:00.000Z',
  id: 'glucose-0800',
  kind: 'glucose',
  source: 'demo',
  title: 'Глюкоза',
  value: '6,4 ммоль/л',
};

const insulinLegacy = {
  context: 'Перед едой',
  dateTime: '2026-08-02T05:05:00.000Z',
  id: 'insulin-0805',
  kind: 'insulin',
  source: 'demo',
  title: 'NovoRapid',
  value: '4 ЕД',
};

const nutritionLegacy = {
  context: 'После инсулина',
  dateTime: '2026-08-02T05:20:00.000Z',
  id: 'nutrition-0820',
  kind: 'nutrition',
  source: 'demo',
  title: 'Завтрак',
  value: '42 г углеводов',
};

const medicationLegacy = {
  context: 'После еды',
  dateTime: '2026-08-02T08:30:00.000Z',
  id: 'medication-1130',
  kind: 'medication',
  source: 'demo',
  title: 'Метформин',
  unit: 'мг',
  value: '400',
};

const activityLegacy = {
  context: 'После обеда',
  dateTime: '2026-08-01T12:00:00.000Z',
  id: 'activity-1500',
  kind: 'activity',
  source: 'demo',
  title: 'Прогулка',
  unit: 'минут',
  value: '30',
};

const noteLegacy = {
  dateTime: '2026-07-30T09:00:00.000Z',
  id: 'note-1200',
  kind: 'note',
  source: 'demo',
  title: 'Самочувствие',
  value: 'Чувствую усталость после обеда',
};

test('lifts glucose legacy events with comma decimals', () => {
  const result = assertOk(liftLegacyToSemantic(glucoseLegacy, createContext()));

  assert.equal(result.event.kind, 'glucose');
  assert.equal(result.event.id, 'glucose-0800');
  assert.equal(result.event.source, 'demo');
  assert.equal(result.event.occurredAt, glucoseLegacy.dateTime);
  assert.equal(result.event.schemaVersion, 1);
  assert.equal(result.event.concentrationMmolPerL, 6.4);
  assert.equal(result.event.context, 'before_meal');
  assert.equal(result.migration.sourceSchemaVersion, 0);
  assert.equal(result.migration.preservedLegacy.value, '6,4 ммоль/л');
});

test('lifts insulin legacy events', () => {
  const result = assertOk(liftLegacyToSemantic(insulinLegacy, createContext()));

  assert.equal(result.event.kind, 'insulin');
  assert.equal(result.event.preparation, 'NovoRapid');
  assert.equal(result.event.doseUnits, 4);
  assert.equal(result.event.context, 'Перед едой');
});

test('lifts nutrition legacy events with known meal mapping', () => {
  const result = assertOk(
    liftLegacyToSemantic(nutritionLegacy, createContext()),
  );

  assert.equal(result.event.kind, 'nutrition');
  assert.equal(result.event.carbohydratesGrams, 42);
  assert.equal(result.event.mealType, 'breakfast');
  assert.equal(result.event.mode, 'manual');
  assert.equal(result.migration.preservedLegacy.title, 'Завтрак');
});

test('lifts medication legacy events with approved units', () => {
  const result = assertOk(
    liftLegacyToSemantic(medicationLegacy, createContext()),
  );

  assert.equal(result.event.kind, 'medication');
  assert.equal(result.event.medicationName, 'Метформин');
  assert.equal(result.event.dose, 400);
  assert.equal(result.event.doseUnit, 'mass.mg');
});

test('lifts activity legacy events converting minutes to seconds', () => {
  const result = assertOk(
    liftLegacyToSemantic(activityLegacy, createContext()),
  );

  assert.equal(result.event.kind, 'activity');
  assert.equal(result.event.activityType, 'Прогулка');
  assert.equal(result.event.durationSeconds, 1800);
});

test('lifts note legacy events without medical inference', () => {
  const result = assertOk(liftLegacyToSemantic(noteLegacy, createContext()));

  assert.equal(result.event.kind, 'note');
  assert.equal(result.event.title, 'Самочувствие');
  assert.equal(result.event.body, 'Чувствую усталость после обеда');
  assert.equal(Object.hasOwn(result.event, 'doseUnit'), false);
});

test('preserves valid legacy lifecycle timestamps', () => {
  const legacy = {
    ...glucoseLegacy,
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-02T11:00:00.000Z',
  };

  const result = assertOk(liftLegacyToSemantic(legacy, createContext()));

  assert.equal(result.event.createdAt, legacy.createdAt);
  assert.equal(result.event.updatedAt, legacy.updatedAt);
});

test('uses deterministic migration fallback timestamps when lifecycle fields are absent', () => {
  const result = assertOk(liftLegacyToSemantic(glucoseLegacy, createContext()));

  assert.equal(result.event.createdAt, MIGRATED_AT);
  assert.equal(result.event.updatedAt, MIGRATED_AT);
});

test('maps known glucose contexts and records unknown contexts in migration evidence', () => {
  const known = assertOk(
    liftLegacyToSemantic(
      {
        ...glucoseLegacy,
        context: 'Натощак',
        id: 'glucose-fasting',
      },
      createContext(),
    ),
  );

  assert.equal(known.event.context, 'fasting');

  const unknown = assertOk(
    liftLegacyToSemantic(
      {
        ...glucoseLegacy,
        context: 'После тренировки',
        id: 'glucose-unknown-context',
      },
      createContext(),
    ),
  );

  assert.equal(unknown.event.context, undefined);
  assert.deepEqual(unknown.migration.unmappable, [
    {
      field: 'context',
      rawValue: 'После тренировки',
      reason: 'ambiguous_context',
    },
  ]);
});

test('keeps unmapped nutrition meal text as user-authored mealType', () => {
  const result = assertOk(
    liftLegacyToSemantic(
      {
        ...nutritionLegacy,
        id: 'nutrition-custom-meal',
        title: 'Поздний перекус',
      },
      createContext(),
    ),
  );

  assert.equal(result.event.mealType, 'Поздний перекус');
  assert.deepEqual(result.migration.unmappable, [
    {
      field: 'mealType',
      rawValue: 'Поздний перекус',
      reason: 'unknown_meal_type',
    },
  ]);
});

test('parses dot decimal legacy glucose values', () => {
  const result = assertOk(
    liftLegacyToSemantic(
      {
        ...glucoseLegacy,
        id: 'glucose-dot',
        value: '7.3 ммоль/л',
      },
      createContext(),
    ),
  );

  assert.equal(result.event.concentrationMmolPerL, 7.3);
});

test('quarantines unknown medication units', () => {
  const result = assertQuarantined(
    liftLegacyToSemantic(
      {
        ...medicationLegacy,
        id: 'medication-tablet',
        unit: 'таблетка',
      },
      createContext(),
    ),
    'unknown_medication_unit',
  );

  assert.equal(result.quarantine.raw.unit, 'таблетка');
  assert.equal(result.quarantine.preservedLegacy.unit, 'таблетка');
});

test('quarantines invalid numeric activity values', () => {
  assertQuarantined(
    liftLegacyToSemantic(
      {
        ...activityLegacy,
        id: 'activity-invalid',
        value: '0',
      },
      createContext(),
    ),
    'invalid_numeric',
  );
});

test('quarantines unparseable glucose values', () => {
  assertQuarantined(
    liftLegacyToSemantic(
      {
        ...glucoseLegacy,
        id: 'glucose-invalid',
        value: 'не число',
      },
      createContext(),
    ),
    'unparseable_value',
  );
});

test('quarantines unknown kinds', () => {
  assertQuarantined(
    liftLegacyToSemantic(
      {
        ...glucoseLegacy,
        id: 'unknown-kind',
        kind: 'meal',
      },
      createContext(),
    ),
    'unknown_kind',
  );
});

test('quarantines malformed required envelope data', () => {
  assertQuarantined(
    liftLegacyToSemantic(
      {
        ...glucoseLegacy,
        dateTime: 'not-a-date',
        id: 'glucose-bad-date',
      },
      createContext(),
    ),
    'unparseable_value',
  );

  assertQuarantined(
    liftLegacyToSemantic(
      {
        ...glucoseLegacy,
        id: '   ',
      },
      createContext(),
    ),
    'unparseable_value',
  );
});

test('uses deterministic quarantine id generation from context', () => {
  const result = assertQuarantined(
    liftLegacyToSemantic(
      {
        ...medicationLegacy,
        id: 'medication-custom-quarantine',
        unit: 'капсула',
      },
      createContext({
        createQuarantineId: (raw) => `custom-${raw.id}`,
      }),
    ),
    'unknown_medication_unit',
  );

  assert.equal(
    result.quarantine.quarantineId,
    'custom-medication-custom-quarantine',
  );
});

test('does not mutate the input legacy record', () => {
  const legacy = {
    ...glucoseLegacy,
    value: '6,4 ммоль/л',
  };
  const snapshot = structuredClone(legacy);

  liftLegacyToSemantic(legacy, createContext());

  assert.deepEqual(legacy, snapshot);
});

test('produces deterministic output for deterministic migration context', () => {
  const first = liftLegacyToSemantic(glucoseLegacy, createContext());
  const second = liftLegacyToSemantic(glucoseLegacy, createContext());

  assert.deepEqual(first, second);
});

test('does not embed migration evidence on semantic events', () => {
  const result = assertOk(liftLegacyToSemantic(glucoseLegacy, createContext()));

  assert.equal(Object.hasOwn(result.event, 'migration'), false);
  assert.equal(Object.hasOwn(result.event, 'preservedLegacy'), false);
});

test('does not generate localized presentation output during migration', () => {
  const fixtures = [
    glucoseLegacy,
    insulinLegacy,
    nutritionLegacy,
    medicationLegacy,
    activityLegacy,
    noteLegacy,
  ];

  for (const legacy of fixtures) {
    const result = assertOk(liftLegacyToSemantic(legacy, createContext()));
    const serialized = JSON.stringify(result.event);

    assert.doesNotMatch(serialized, /ммоль\/л/u);
    assert.doesNotMatch(serialized, /углеводов/u);
    assert.doesNotMatch(serialized, /ЕД/u);
    assert.doesNotMatch(serialized, /минут/u);
    assert.doesNotMatch(serialized, /Глюкоза/u);
  }
});

test('maps approved medication units mass.g and volume.ml', () => {
  const grams = assertOk(
    liftLegacyToSemantic(
      {
        ...medicationLegacy,
        id: 'medication-grams',
        unit: 'г',
        value: '2.5',
      },
      createContext(),
    ),
  );

  assert.equal(grams.event.doseUnit, 'mass.g');
  assert.equal(grams.event.dose, 2.5);

  const milliliters = assertOk(
    liftLegacyToSemantic(
      {
        ...medicationLegacy,
        id: 'medication-ml',
        unit: 'мл',
        value: '5',
      },
      createContext(),
    ),
  );

  assert.equal(milliliters.event.doseUnit, 'volume.ml');
});

test('infers nutrition mode from known legacy context labels', () => {
  const manual = assertOk(
    liftLegacyToSemantic(
      {
        ...nutritionLegacy,
        context: 'Введено вручную',
        id: 'nutrition-manual',
      },
      createContext(),
    ),
  );

  assert.equal(manual.event.mode, 'manual');

  const products = assertOk(
    liftLegacyToSemantic(
      {
        ...nutritionLegacy,
        context: 'Рассчитано по продуктам',
        id: 'nutrition-products',
      },
      createContext(),
    ),
  );

  assert.equal(products.event.mode, 'products');
});
