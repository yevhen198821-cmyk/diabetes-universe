import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  createSemanticActivityTimelineEvent,
  createSemanticGlucoseTimelineEvent,
  createSemanticInsulinTimelineEvent,
  createSemanticMedicationTimelineEvent,
  createSemanticNoteTimelineEvent,
  createSemanticNutritionTimelineEvent,
} from './index.ts';

const fixedClock = {
  now: () => new Date('2026-08-02T10:15:00.000Z'),
};

function assertNoLegacyPresentationFields(event) {
  assert.equal(Object.hasOwn(event, 'title'), false);
  assert.equal(Object.hasOwn(event, 'value'), false);
  assert.equal(Object.hasOwn(event, 'unit'), false);
  assert.equal(Object.hasOwn(event, 'dateTime'), false);
}

test('semantic glucose creator preserves numeric value and timestamps', () => {
  const event = createSemanticGlucoseTimelineEvent(
    {
      context: 'fasting',
      time: '08:30',
      valueMmol: 7.3,
    },
    { clock: fixedClock },
  );

  assertNoLegacyPresentationFields(event);
  assert.equal(event.kind, 'glucose');
  assert.equal(event.concentrationMmolPerL, 7.3);
  assert.equal(event.context, 'fasting');
  assert.equal(event.source, 'manual');
  assert.equal(event.createdAt, '2026-08-02T10:15:00.000Z');
  assert.equal(event.updatedAt, event.createdAt);
  assert.match(event.occurredAt, /T08:30:00/);
});

test('semantic insulin creator preserves dose units and semantic fields', () => {
  const event = createSemanticInsulinTimelineEvent(
    {
      administrationContext: 'before_meal',
      doseUnits: 4,
      preparation: 'NovoRapid',
      preparationId: 'insulin.prep.aspart_novorapid',
      time: '09:00',
    },
    { clock: fixedClock },
  );

  assertNoLegacyPresentationFields(event);
  assert.equal(event.doseUnits, 4);
  assert.equal(event.preparation, 'NovoRapid');
  assert.equal(event.preparationId, 'insulin.prep.aspart_novorapid');
  assert.equal(event.administrationContext, 'before_meal');
  assert.equal(Object.hasOwn(event, 'context'), false);
});

test('semantic nutrition creator writes canonical v2 without legacy UI fields', () => {
  const event = createSemanticNutritionTimelineEvent(
    {
      carbohydratesGrams: 42,
      mealType: 'breakfast',
      time: '09:30',
    },
    { clock: fixedClock },
  );

  assertNoLegacyPresentationFields(event);
  assert.equal(event.kind, 'nutrition');
  assert.equal(event.schemaVersion, 2);
  assert.equal(event.mealType, 'breakfast');
  assert.equal(event.carbohydratesGrams, 42);
  assert.equal(event.source, 'manual');
  assert.equal(Object.hasOwn(event, 'mode'), false);
  assert.equal(Object.hasOwn(event, 'products'), false);
  assert.equal(Object.hasOwn(event, 'calculatedCarbsGrams'), false);
  assert.equal(Object.hasOwn(event, 'items'), false);
});

test('semantic medication creator maps canonical units', () => {
  const event = createSemanticMedicationTimelineEvent(
    {
      context: 'После еды',
      dose: 400,
      medication: { id: 'metformin', name: 'Метформин' },
      note: 'С едой',
      time: '10:00',
      unit: 'мг',
    },
    { clock: fixedClock },
  );

  assert.equal(event.dose, 400);
  assert.equal(event.doseUnit, 'mass.mg');
  assert.equal(event.medicationName, 'Метформин');
});

test('semantic activity creator converts minutes to seconds', () => {
  const event = createSemanticActivityTimelineEvent(
    {
      activityType: 'Ходьба',
      durationMinutes: 30,
      time: '11:00',
    },
    { clock: fixedClock },
  );

  assert.equal(event.durationSeconds, 1800);
  assert.equal(event.activityType, 'Ходьба');
});

test('semantic note creator leaves title undefined when omitted', () => {
  const event = createSemanticNoteTimelineEvent(
    {
      text: 'E2E заметка',
      time: '12:00',
    },
    { clock: fixedClock },
  );

  assert.equal(event.title, undefined);
  assert.equal(event.body, 'E2E заметка');
});

test('semantic creators do not hardcode locale formatters', () => {
  const source = readFileSync(
    new URL('./create-semantic-glucose-timeline-event.ts', import.meta.url),
    'utf8',
  );

  assert.equal(source.includes('ru-RU'), false);
  assert.equal(source.includes('toLocaleString'), false);
  assert.equal(source.includes('Intl.NumberFormat'), false);
});
