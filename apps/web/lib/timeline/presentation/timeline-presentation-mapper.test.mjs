import assert from 'node:assert/strict';
import test from 'node:test';

import { mapTimelineEventToCard } from '../../../components/timeline/timeline-event-card.mapper.ts';
import { liftLegacyTestFixtures } from '../testing/lift-legacy-test-fixtures.ts';
import {
  formatTimelineGlucoseDisplayValue,
  mapTimelineEventCardPresentation,
  mapTimelineEventDetailPresentation,
  mapTimelineSearchPresentation,
  timelinePresentationKindMappers,
} from './timeline-presentation-mapper.ts';
import { createTestTimelinePresentationDependencies } from './testing/create-test-timeline-presentation-dependencies.ts';

const legacyFixtures = liftLegacyTestFixtures([
  {
    context: 'Перед завтраком',
    dateTime: '2026-08-02T07:15:00.000Z',
    id: 'glucose-1015',
    kind: 'glucose',
    title: 'Глюкоза',
    value: '7,3 ммоль/л',
  },
  {
    context: 'Перед едой',
    dateTime: '2026-08-02T05:05:00.000Z',
    id: 'insulin-0805',
    kind: 'insulin',
    title: 'NovoRapid',
    value: '4 ЕД',
  },
  {
    dateTime: '2026-08-02T05:20:00.000Z',
    id: 'nutrition-0820',
    kind: 'nutrition',
    note: 'Без сахара',
    title: 'Завтрак',
    value: '42 г углеводов',
  },
  {
    context: 'После еды',
    dateTime: '2026-08-02T04:30:00.000Z',
    id: 'medication-0730',
    kind: 'medication',
    title: 'Метформин',
    unit: 'мг',
    value: '400',
  },
  {
    dateTime: '2026-08-01T12:00:00.000Z',
    id: 'activity-1200',
    kind: 'activity',
    title: 'Walk',
    unit: 'минут',
    value: '30',
  },
  {
    dateTime: '2026-07-30T09:00:00.000Z',
    id: 'note-0900',
    kind: 'note',
    title: 'Самочувствие',
    value: 'Чувствую усталость',
  },
]);

const [
  glucoseEvent,
  insulinEvent,
  nutritionEvent,
  medicationEvent,
  activityEvent,
  noteEvent,
] = legacyFixtures;

let enGbDependencies;

test.before(async () => {
  enGbDependencies = await createTestTimelinePresentationDependencies();
});

test('timelinePresentationKindMappers covers all six semantic kinds', () => {
  assert.deepEqual(Object.keys(timelinePresentationKindMappers).sort(), [
    'activity',
    'glucose',
    'insulin',
    'medication',
    'note',
    'nutrition',
  ]);
});

test('en-GB glucose presentation uses English labels and dot decimal formatting', () => {
  const card = mapTimelineEventCardPresentation(
    glucoseEvent,
    enGbDependencies,
    '10:15',
  );
  const detail = mapTimelineEventDetailPresentation(
    glucoseEvent,
    enGbDependencies,
  );

  assert.equal(card.title, 'Glucose');
  assert.equal(card.value, '7.3');
  assert.equal(card.unit, 'mmol/L');
  assert.equal(card.context, 'Before meal');
  assert.equal(detail.kindLabel, 'Glucose');
  assert.equal(detail.primaryText, '7.3 mmol/L');
  assert.equal(
    formatTimelineGlucoseDisplayValue(glucoseEvent, enGbDependencies),
    '7.3 mmol/L',
  );
});

test('mg/dL glucose presentation converts from canonical mmol/L without mutating event', () => {
  const mgDependencies = {
    ...enGbDependencies,
    glucoseDisplayUnit: 'mg_per_dl',
  };
  const card = mapTimelineEventCardPresentation(
    glucoseEvent,
    mgDependencies,
    '10:15',
  );

  assert.equal(glucoseEvent.concentrationMmolPerL, 7.3);
  assert.equal(card.value, '132');
  assert.equal(card.unit, 'mg/dL');
  assert.equal(card.context, 'Before meal');
});

test('glucose presentation resolves target boundary semantics via shared foundation', async () => {
  const targetDependencies = await createTestTimelinePresentationDependencies({
    glucoseDisplayUnit: 'mmol_per_l',
    referenceTime: '2026-08-02T10:00:00.000Z',
    targetRange: {
      highMmolPerL: 7.3,
      lowMmolPerL: 4,
      source: 'user_defined',
    },
  });
  const inRange = mapTimelineEventCardPresentation(
    glucoseEvent,
    targetDependencies,
    '10:15',
  );

  assert.equal(inRange.value, '7.3');

  const [aboveEvent] = liftLegacyTestFixtures([
    {
      dateTime: '2026-08-02T07:15:00.000Z',
      id: 'glucose-above',
      kind: 'glucose',
      title: 'Glucose',
      value: '8.1 mmol/L',
    },
  ]);
  const above = timelinePresentationKindMappers.glucose(
    aboveEvent,
    targetDependencies,
  );

  assert.equal(above.rangeLabel, 'Above your range');
});

test('ru-RU runtime uses comma decimal formatting', async () => {
  const ruDependencies = await createTestTimelinePresentationDependencies({
    request: { acceptLanguage: 'ru-RU', cookieTimeZone: 'Europe/Moscow' },
  });
  const card = mapTimelineEventCardPresentation(
    glucoseEvent,
    ruDependencies,
    '10:15',
  );

  assert.equal(card.value, '7,3');
  assert.equal(card.unit, 'ммоль/л');
});

test('presentation dependencies do not hardcode a medical locale formatter', async () => {
  const source = await import('node:fs/promises').then((fs) =>
    fs.readFile(
      new URL('./timeline-presentation-dependencies.ts', import.meta.url),
      'utf8',
    ),
  );

  assert.equal(source.includes('TIMELINE_MEDICAL_VALUE_FORMAT_LOCALE'), false);
  assert.equal(source.includes('valueFormatter'), false);
  assert.equal(source.includes("'ru-RU'"), false);
});

test('maps insulin presentation with user-authored preparation unchanged', () => {
  const card = mapTimelineEventCardPresentation(
    insulinEvent,
    enGbDependencies,
    '08:05',
  );

  assert.equal(card.title, 'NovoRapid');
  assert.equal(card.value, '4');
  assert.equal(card.unit, 'U');
  assert.equal(card.context, 'Before meal');
});

test('maps nutrition enum meal type via localization and preserves custom meal text', () => {
  const enumCard = mapTimelineEventCardPresentation(
    nutritionEvent,
    enGbDependencies,
    '08:20',
  );
  const [customMealEvent] = liftLegacyTestFixtures([
    {
      dateTime: '2026-08-02T06:00:00.000Z',
      id: 'nutrition-custom',
      kind: 'nutrition',
      title: 'Поздний перекус',
      value: '15 г углеводов',
    },
  ]);
  const customCard = mapTimelineEventCardPresentation(
    customMealEvent,
    enGbDependencies,
    '09:00',
  );

  assert.equal(enumCard.title, 'Breakfast');
  assert.equal(enumCard.value, '42');
  assert.equal(enumCard.unit, 'g carbs');
  assert.equal(customCard.title, 'Поздний перекус');
});

test('maps Nutrition v2 without requiring legacy mode or products', () => {
  const card = mapTimelineEventCardPresentation(
    {
      carbohydratesGrams: 12.12,
      createdAt: '2026-09-05T08:00:00.000Z',
      id: 'nutrition-v2-card',
      kind: 'nutrition',
      mealType: 'breakfast',
      occurredAt: '2026-09-05T08:00:00.000Z',
      schemaVersion: 2,
      source: 'manual',
      updatedAt: '2026-09-05T08:00:00.000Z',
    },
    enGbDependencies,
    '08:00',
  );
  const unspecified = mapTimelineEventCardPresentation(
    {
      carbohydratesGrams: 8,
      createdAt: '2026-09-05T08:00:00.000Z',
      id: 'nutrition-v2-unspecified',
      kind: 'nutrition',
      mealType: 'unspecified',
      occurredAt: '2026-09-05T08:00:00.000Z',
      schemaVersion: 2,
      source: 'import',
      updatedAt: '2026-09-05T08:00:00.000Z',
    },
    enGbDependencies,
    '08:00',
  );

  assert.equal(card.title, 'Breakfast');
  assert.equal(card.value, '12');
  assert.equal(card.unit, 'g carbs');
  assert.equal(unspecified.title, 'Not specified');
});

test('maps medication unit presentation from localized labels', () => {
  const card = mapTimelineEventCardPresentation(
    medicationEvent,
    enGbDependencies,
    '07:30',
  );

  assert.equal(card.title, 'Метформин');
  assert.equal(card.value, '400');
  assert.equal(card.unit, 'mg');
});

test('maps activity duration presentation in minutes', () => {
  const card = mapTimelineEventCardPresentation(
    activityEvent,
    enGbDependencies,
    '15:00',
  );

  assert.equal(card.title, 'Walk');
  assert.equal(card.value, '30');
  assert.equal(card.unit, 'min');
});

test('maps note fallback title when title is missing', () => {
  const [untitledNote] = liftLegacyTestFixtures([
    {
      dateTime: '2026-07-30T10:00:00.000Z',
      id: 'note-fallback',
      kind: 'note',
      value: 'Короткая запись',
    },
  ]);
  const card = mapTimelineEventCardPresentation(
    untitledNote,
    enGbDependencies,
    '13:00',
  );

  assert.equal(card.title, 'Note');
  assert.equal(card.value, 'Короткая запись');
});

test('search presentation separates localized labels from user-authored content', () => {
  const insulinSearch = mapTimelineSearchPresentation(
    insulinEvent,
    enGbDependencies,
  );
  const noteSearch = mapTimelineSearchPresentation(noteEvent, enGbDependencies);

  assert.equal(insulinSearch.userContent.includes('NovoRapid'), true);
  assert.equal(insulinSearch.localizedLabels.includes('Insulin'), true);
  assert.equal(noteSearch.userContent.includes('Самочувствие'), true);
  assert.equal(noteSearch.localizedLabels.includes('Note'), true);
});

test('EventCard mapper receives presentation-only props', () => {
  const cardProps = mapTimelineEventToCard(insulinEvent, enGbDependencies);

  assert.equal(cardProps.title, 'NovoRapid');
  assert.equal(cardProps.value, '4');
  assert.equal(cardProps.unit, 'U');
  assert.equal(cardProps.type, 'insulin');
  assert.equal(Object.hasOwn(cardProps, 'kind'), false);
  assert.equal(Object.hasOwn(cardProps, 'occurredAt'), false);
  assert.equal(Object.hasOwn(cardProps, 'doseUnits'), false);
});
