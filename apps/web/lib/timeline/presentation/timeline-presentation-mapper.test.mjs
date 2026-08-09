import assert from 'node:assert/strict';
import test from 'node:test';

import { mapTimelineEventToCard } from '../../../components/timeline/timeline-event-card.mapper.ts';
import { liftLegacyTestFixtures } from '../testing/lift-legacy-test-fixtures.ts';
import {
  formatTimelineGlucoseDisplayValue,
  mapTimelineEventCardPresentation,
  mapTimelineEventDetailPresentation,
  mapTimelineLegacyRepositoryProjection,
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

let dependencies;

test.before(async () => {
  dependencies = await createTestTimelinePresentationDependencies();
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

test('maps glucose card and detail presentation with localized labels and ru-RU numeric formatting', () => {
  const card = mapTimelineEventCardPresentation(
    glucoseEvent,
    dependencies,
    '10:15',
  );
  const detail = mapTimelineEventDetailPresentation(glucoseEvent, dependencies);

  assert.equal(card.title, 'Глюкоза');
  assert.equal(card.value, '7,3');
  assert.equal(card.unit, 'ммоль/л');
  assert.equal(card.context, 'Перед едой');
  assert.equal(detail.kindLabel, 'Глюкоза');
  assert.equal(detail.primaryText, '7,3 ммоль/л');
  assert.equal(
    formatTimelineGlucoseDisplayValue(glucoseEvent, dependencies),
    '7,3 ммоль/л',
  );
});

test('maps insulin presentation with user-authored preparation unchanged', () => {
  const card = mapTimelineEventCardPresentation(
    insulinEvent,
    dependencies,
    '08:05',
  );

  assert.equal(card.title, 'NovoRapid');
  assert.equal(card.value, '4');
  assert.equal(card.unit, 'ЕД');
  assert.equal(card.context, 'Перед едой');
});

test('maps nutrition enum meal type via localization and preserves custom meal text', () => {
  const enumCard = mapTimelineEventCardPresentation(
    nutritionEvent,
    dependencies,
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
    dependencies,
    '09:00',
  );

  assert.equal(enumCard.title, 'Завтрак');
  assert.equal(enumCard.value, '42');
  assert.equal(enumCard.unit, 'г углеводов');
  assert.equal(customCard.title, 'Поздний перекус');
});

test('maps medication unit presentation from canonical dose unit', () => {
  const card = mapTimelineEventCardPresentation(
    medicationEvent,
    dependencies,
    '07:30',
  );

  assert.equal(card.title, 'Метформин');
  assert.equal(card.value, '400');
  assert.equal(card.unit, 'мг');
});

test('maps activity duration presentation in minutes', () => {
  const card = mapTimelineEventCardPresentation(
    activityEvent,
    dependencies,
    '15:00',
  );

  assert.equal(card.title, 'Walk');
  assert.equal(card.value, '30');
  assert.equal(card.unit, 'мин');
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
    dependencies,
    '13:00',
  );

  assert.equal(card.title, 'Заметка');
  assert.equal(card.value, 'Короткая запись');
});

test('search presentation separates localized labels from user-authored content', () => {
  const insulinSearch = mapTimelineSearchPresentation(
    insulinEvent,
    dependencies,
  );
  const noteSearch = mapTimelineSearchPresentation(noteEvent, dependencies);

  assert.equal(insulinSearch.userContent.includes('NovoRapid'), true);
  assert.equal(insulinSearch.localizedLabels.includes('Инсулин'), true);
  assert.equal(noteSearch.userContent.includes('Самочувствие'), true);
  assert.equal(noteSearch.localizedLabels.includes('Заметка'), true);
  assert.equal(
    Object.hasOwn(insulinSearch, 'title') &&
      Object.hasOwn(insulinSearch, 'value'),
    false,
  );
});

test('legacy repository projection uses presentation mapper output', () => {
  const projection = mapTimelineLegacyRepositoryProjection(
    glucoseEvent,
    dependencies,
  );

  assert.equal(projection.title, 'Глюкоза');
  assert.equal(projection.value, '7,3 ммоль/л');
  assert.equal(projection.unit, 'ммоль/л');
  assert.equal(projection.context, 'Перед едой');
});

test('EventCard mapper receives presentation-only props', () => {
  const cardProps = mapTimelineEventToCard(insulinEvent, dependencies);

  assert.equal(cardProps.title, 'NovoRapid');
  assert.equal(cardProps.value, '4');
  assert.equal(cardProps.unit, 'ЕД');
  assert.equal(cardProps.type, 'insulin');
  assert.equal(Object.hasOwn(cardProps, 'kind'), false);
  assert.equal(Object.hasOwn(cardProps, 'occurredAt'), false);
  assert.equal(Object.hasOwn(cardProps, 'doseUnits'), false);
});
