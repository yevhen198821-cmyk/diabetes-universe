import assert from 'node:assert/strict';
import test from 'node:test';

import { mapTimelineEventToCard } from '../../../components/timeline/timeline-event-card.mapper.ts';
import { liftLegacyTestFixtures } from '../testing/lift-legacy-test-fixtures.ts';
import {
  mapTimelineEventCardPresentation,
  timelinePresentationKindMappers,
} from './timeline-presentation-mapper.ts';
import { createTestTimelinePresentationDependencies } from './testing/create-test-timeline-presentation-dependencies.ts';

const [glucoseEvent, insulinEvent] = liftLegacyTestFixtures([
  {
    context: 'Before meal',
    dateTime: '2026-08-02T07:15:00.000Z',
    id: 'glucose-history-card',
    kind: 'glucose',
    title: 'Glucose',
    value: '7.3 mmol/L',
  },
  {
    dateTime: '2026-08-02T05:05:00.000Z',
    id: 'insulin-history-card',
    kind: 'insulin',
    title: 'NovoRapid',
    value: '4 U',
  },
]);

let targetDependencies;
let noTargetDependencies;

test.before(async () => {
  targetDependencies = await createTestTimelinePresentationDependencies({
    glucoseDisplayUnit: 'mmol_per_l',
    referenceTime: '2026-08-02T10:00:00.000Z',
    targetRange: {
      highMmolPerL: 8,
      lowMmolPerL: 4,
      source: 'user_defined',
    },
  });
  noTargetDependencies = await createTestTimelinePresentationDependencies({
    glucoseDisplayUnit: 'mmol_per_l',
    referenceTime: '2026-08-02T10:00:00.000Z',
    targetRange: null,
  });
});

function createGlucoseEvent(concentrationMmolPerL, dateTime, id) {
  const [event] = liftLegacyTestFixtures([
    {
      dateTime,
      id,
      kind: 'glucose',
      title: 'Glucose',
      value: `${concentrationMmolPerL} mmol/L`,
    },
  ]);

  return event;
}

test('in-range glucose card preserves range and current-range qualifier', () => {
  const card = mapTimelineEventCardPresentation(
    glucoseEvent,
    targetDependencies,
    '10:15',
  );

  assert.deepEqual(card.statusLines, ['In your range', 'Current target range']);
  assert.match(card.ariaLabel, /In your range/);
  assert.match(card.ariaLabel, /Current target range/);
  assert.equal(card.occurredAt, '2026-08-02T07:15:00.000Z');
});

test('below-range glucose card preserves below label and qualifier', () => {
  const belowEvent = createGlucoseEvent(
    3.5,
    '2026-08-02T07:15:00.000Z',
    'glucose-below',
  );
  const card = mapTimelineEventCardPresentation(
    belowEvent,
    targetDependencies,
    '10:15',
  );

  assert.deepEqual(card.statusLines, [
    'Below your range',
    'Current target range',
  ]);
});

test('above-range glucose card preserves above label and qualifier', () => {
  const aboveEvent = createGlucoseEvent(
    8.1,
    '2026-08-02T07:15:00.000Z',
    'glucose-above',
  );
  const card = mapTimelineEventCardPresentation(
    aboveEvent,
    targetDependencies,
    '10:15',
  );

  assert.deepEqual(card.statusLines, [
    'Above your range',
    'Current target range',
  ]);
});

test('no-target glucose card omits range and current-range qualifier', () => {
  const card = mapTimelineEventCardPresentation(
    glucoseEvent,
    noTargetDependencies,
    '10:15',
  );

  assert.equal(card.statusLines, undefined);
  assert.doesNotMatch(card.ariaLabel, /Current target range/);
  assert.doesNotMatch(card.ariaLabel, /In your range/);
});

test('suspect-future glucose card preserves value and warning without range', () => {
  const futureEvent = createGlucoseEvent(
    7.3,
    '2026-08-02T20:00:00.000Z',
    'glucose-future',
  );
  const card = mapTimelineEventCardPresentation(
    futureEvent,
    targetDependencies,
    '20:00',
  );

  assert.deepEqual(card.statusLines, ['Check measurement time']);
  assert.match(card.ariaLabel, /Check measurement time/);
  assert.doesNotMatch(card.ariaLabel, /In your range/);
  assert.doesNotMatch(card.ariaLabel, /Current target range/);
  assert.equal(card.value, '7.3');
});

test('insulin card presentation remains unchanged by glucose history fields', () => {
  const card = mapTimelineEventCardPresentation(
    insulinEvent,
    targetDependencies,
    '08:05',
  );

  assert.equal(card.statusLines, undefined);
  assert.equal(card.title, 'NovoRapid');
  assert.match(card.ariaLabel, /NovoRapid/);
});

test('EventCard mapper passes canonical occurredAt as semantic dateTime', () => {
  const cardProps = mapTimelineEventToCard(glucoseEvent, targetDependencies);

  assert.equal(cardProps.dateTime, '2026-08-02T07:15:00.000Z');
  assert.equal(cardProps.statusLines?.[0], 'In your range');
  assert.match(cardProps.ariaLabel, /Current target range/);
});

test('map marker aria includes glucose history without duplicate identity', () => {
  const card = mapTimelineEventCardPresentation(
    glucoseEvent,
    targetDependencies,
    '10:15',
  );

  assert.match(card.mapAriaLabel, /7\.3 mmol\/L/);
  assert.match(card.mapAriaLabel, /In your range/);
  assert.equal((card.mapAriaLabel.match(/Glucose/g) ?? []).length, 1);
});

test('glucose mapper still exposes rangeLabel at kind mapper layer', () => {
  const glucose = timelinePresentationKindMappers.glucose(
    glucoseEvent,
    targetDependencies,
  );

  assert.equal(glucose.rangeLabel, 'In your range');
  assert.equal(glucose.timestampUncertaintyLabel, null);
});
