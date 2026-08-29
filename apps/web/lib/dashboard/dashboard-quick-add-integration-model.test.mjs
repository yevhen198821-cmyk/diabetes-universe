import assert from 'node:assert/strict';
import test from 'node:test';

import { selectDashboardRecentEvents } from '../../components/dashboard/dashboard-recent-events-model.ts';
import { formatTimelineGlucoseDisplayValue } from '../timeline/presentation/index.ts';
import { liftLegacyTestFixtures } from '../timeline/testing/lift-legacy-test-fixtures.ts';
import { createTestTimelinePresentationDependencies } from '../timeline/presentation/testing/create-test-timeline-presentation-dependencies.ts';
import { deriveDashboardQuickAddBlocks } from './dashboard-quick-add-integration-model.ts';

let presentationDependencies;

test.before(async () => {
  presentationDependencies = await createTestTimelinePresentationDependencies();
});

const referenceTime = new Date('2026-08-02T10:00:00.000Z');

const formatDaySummaryDisplayDate = () => 'Sunday, 2 August 2026';

const categoryLabels = {
  activity: 'Activity',
  insulin: 'Insulin',
  medication: 'Medication',
  nutrition: 'Nutrition',
};

const formatUtcShortTime = (dateTime) => {
  const date = new Date(dateTime);

  if (Number.isNaN(date.getTime())) {
    return '--:--';
  }

  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
};

test('deriveLastGlucose invokes display-time formatter only for the hero', () => {
  let callCount = 0;
  let receivedDateTime = null;

  const blocks = deriveDashboardQuickAddBlocks(
    {
      events: liftLegacyTestFixtures([
        {
          context: 'Перед завтраком',
          dateTime: '2026-08-02T08:00:00.000Z',
          id: 'glucose-0800',
          kind: 'glucose',
          title: 'Глюкоза',
          value: '6,4 ммоль/л',
        },
        {
          context: 'После завтрака',
          dateTime: '2026-08-02T07:15:00.000Z',
          id: 'glucose-1015',
          kind: 'glucose',
          title: 'Глюкоза',
          value: '7,3 ммоль/л',
        },
      ]),
    },
    {
      formatDaySummaryDisplayDate,
      formatLastGlucoseDisplayTime: (dateTime) => {
        callCount += 1;
        receivedDateTime = dateTime;
        return '08:00';
      },
      referenceTime,
      timeZone: 'UTC',
      presentationDependencies,
    },
  );

  assert.equal(callCount, 1);
  assert.equal(receivedDateTime, '2026-08-02T08:00:00.000Z');
  assert.equal(
    blocks.lastGlucose?.event.occurredAt,
    '2026-08-02T08:00:00.000Z',
  );
  assert.equal(blocks.lastGlucose?.displayTime, '08:00');
});

test('derives last glucose from shared timeline events', () => {
  const blocks = deriveDashboardQuickAddBlocks(
    {
      events: liftLegacyTestFixtures([
        {
          context: 'Перед завтраком',
          dateTime: '2026-08-02T08:00:00.000Z',
          id: 'glucose-0800',
          kind: 'glucose',
          title: 'Глюкоза',
          value: '6,4 ммоль/л',
        },
      ]),
    },
    {
      formatDaySummaryDisplayDate,
      formatLastGlucoseDisplayTime: formatUtcShortTime,
      referenceTime,
      timeZone: 'UTC',
      presentationDependencies,
    },
  );

  assert.equal(blocks.lastGlucose?.event.concentrationMmolPerL, 6.4);
  assert.equal(blocks.lastGlucose?.displayTime, '08:00');
  assert.equal(blocks.daySummary?.glucoseMeasurements, 1);
  assert.equal(blocks.recentEvents.length, 0);
});

test('derives day summary only from today events', () => {
  const blocks = deriveDashboardQuickAddBlocks(
    {
      events: liftLegacyTestFixtures([
        {
          context: 'Сегодня',
          dateTime: '2026-08-02T08:05:00.000Z',
          id: 'insulin-today',
          kind: 'insulin',
          title: 'NovoRapid',
          value: '4 ЕД',
        },
        {
          context: 'Вчера',
          dateTime: '2026-08-01T08:05:00.000Z',
          id: 'insulin-yesterday',
          kind: 'insulin',
          title: 'NovoRapid',
          value: '8 ЕД',
        },
        {
          context: 'Сегодня',
          dateTime: '2026-08-02T08:20:00.000Z',
          id: 'nutrition-today',
          kind: 'nutrition',
          title: 'Завтрак',
          value: '42 г углеводов',
        },
        {
          context: 'Вчера',
          dateTime: '2026-08-01T08:20:00.000Z',
          id: 'nutrition-yesterday',
          kind: 'nutrition',
          title: 'Завтрак',
          value: '60 г углеводов',
        },
      ]),
    },
    {
      formatDaySummaryDisplayDate,
      referenceTime,
      timeZone: 'UTC',
      presentationDependencies,
    },
  );

  assert.equal(blocks.daySummary?.totalInsulinUnits, 4);
  assert.equal(blocks.daySummary?.totalCarbohydrateGrams, 42);
});

test('updates day summary and recent events after insulin save', () => {
  const blocks = deriveDashboardQuickAddBlocks(
    {
      events: liftLegacyTestFixtures([
        {
          context: 'Перед завтраком',
          dateTime: '2026-08-02T08:05:00.000Z',
          id: 'insulin-0805',
          kind: 'insulin',
          title: 'NovoRapid',
          value: '4 ЕД',
        },
      ]),
    },
    {
      formatDaySummaryDisplayDate,
      formatRecentEventDisplayTime: formatUtcShortTime,
      referenceTime,
      timeZone: 'UTC',
      presentationDependencies,
    },
  );

  assert.equal(blocks.daySummary?.totalInsulinUnits, 4);
  assert.equal(blocks.recentEvents[0]?.category, 'insulin');
  assert.equal(blocks.recentEvents[0]?.title, 'NovoRapid');
});

test('derives recent event sources that can be sorted by latest event time', () => {
  const blocks = deriveDashboardQuickAddBlocks(
    {
      events: liftLegacyTestFixtures([
        {
          context: 'Утром',
          dateTime: '2026-08-02T04:30:00.000Z',
          id: 'medication-0730',
          kind: 'medication',
          title: 'Метформин',
          unit: 'мг',
          value: '500',
        },
        {
          context: 'Перед завтраком',
          dateTime: '2026-08-02T15:00:00.000Z',
          id: 'insulin-1800',
          kind: 'insulin',
          title: 'NovoRapid',
          value: '6 ЕД',
        },
        {
          context: 'После инсулина',
          dateTime: '2026-08-02T05:20:00.000Z',
          id: 'nutrition-0820',
          kind: 'nutrition',
          title: 'Завтрак',
          value: '42 г углеводов',
        },
      ]),
    },
    {
      formatDaySummaryDisplayDate,
      formatRecentEventDisplayTime: formatUtcShortTime,
      referenceTime,
      timeZone: 'Europe/Moscow',
      presentationDependencies,
    },
  );
  const selected = selectDashboardRecentEvents(
    blocks.recentEvents,
    categoryLabels,
  );

  assert.deepEqual(
    selected.map((event) => event.id),
    ['insulin-1800', 'nutrition-0820', 'medication-0730'],
  );
});

test('today glucose metric ignores yesterday measurement when no glucose exists today', () => {
  const blocks = deriveDashboardQuickAddBlocks(
    {
      events: liftLegacyTestFixtures([
        {
          context: 'Yesterday',
          dateTime: '2026-08-01T08:00:00.000Z',
          id: 'glucose-yesterday',
          kind: 'glucose',
          title: 'Glucose',
          value: '5.0 mmol/L',
        },
      ]),
    },
    {
      formatDaySummaryDisplayDate,
      formatLastGlucoseDisplayTime: formatUtcShortTime,
      referenceTime,
      timeZone: 'UTC',
      presentationDependencies,
    },
  );

  assert.equal(blocks.lastGlucose?.event.id, 'glucose-yesterday');
  assert.match(
    formatTimelineGlucoseDisplayValue(
      blocks.lastGlucose.event,
      presentationDependencies,
    ),
    /5 mmol\/L/,
  );
  assert.equal(blocks.daySummary?.glucoseMeasurements, 0);
});

test('today glucose measurement count includes only today events', () => {
  const blocks = deriveDashboardQuickAddBlocks(
    {
      events: liftLegacyTestFixtures([
        {
          context: 'Yesterday',
          dateTime: '2026-08-01T08:00:00.000Z',
          id: 'glucose-yesterday',
          kind: 'glucose',
          title: 'Glucose',
          value: '5.0 mmol/L',
        },
        {
          context: 'Today',
          dateTime: '2026-08-02T07:15:00.000Z',
          id: 'glucose-today',
          kind: 'glucose',
          title: 'Glucose',
          value: '6.4 mmol/L',
        },
      ]),
    },
    {
      formatDaySummaryDisplayDate,
      formatLastGlucoseDisplayTime: formatUtcShortTime,
      referenceTime,
      timeZone: 'UTC',
      presentationDependencies,
    },
  );

  assert.equal(blocks.lastGlucose?.event.id, 'glucose-today');
  assert.equal(blocks.daySummary?.glucoseMeasurements, 1);
});

test('today glucose measurement count includes all glucose events from today', () => {
  const blocks = deriveDashboardQuickAddBlocks(
    {
      events: liftLegacyTestFixtures([
        {
          context: 'Earlier today',
          dateTime: '2026-08-02T07:15:00.000Z',
          id: 'glucose-0715',
          kind: 'glucose',
          title: 'Glucose',
          value: '7.3 mmol/L',
        },
        {
          context: 'Later today',
          dateTime: '2026-08-02T08:00:00.000Z',
          id: 'glucose-0800',
          kind: 'glucose',
          title: 'Glucose',
          value: '6.4 mmol/L',
        },
      ]),
    },
    {
      formatDaySummaryDisplayDate,
      formatLastGlucoseDisplayTime: formatUtcShortTime,
      referenceTime,
      timeZone: 'UTC',
      presentationDependencies,
    },
  );

  assert.equal(blocks.lastGlucose?.event.id, 'glucose-0800');
  assert.equal(blocks.daySummary?.glucoseMeasurements, 2);
});

test('today glucose measurement count respects timezone boundaries for local day membership', () => {
  const blocks = deriveDashboardQuickAddBlocks(
    {
      events: liftLegacyTestFixtures([
        {
          context: 'Previous local day in Tokyo',
          dateTime: '2026-08-01T14:00:00.000Z',
          id: 'glucose-previous-local-day',
          kind: 'glucose',
          title: 'Glucose',
          value: '5.0 mmol/L',
        },
        {
          context: 'Current local day in Tokyo',
          dateTime: '2026-08-02T01:30:00.000Z',
          id: 'glucose-today-tokyo',
          kind: 'glucose',
          title: 'Glucose',
          value: '6.4 mmol/L',
        },
      ]),
    },
    {
      formatDaySummaryDisplayDate,
      formatLastGlucoseDisplayTime: formatUtcShortTime,
      referenceTime: new Date('2026-08-02T12:00:00.000Z'),
      timeZone: 'Asia/Tokyo',
      presentationDependencies,
    },
  );

  assert.equal(blocks.lastGlucose?.event.id, 'glucose-today-tokyo');
  assert.equal(blocks.daySummary?.glucoseMeasurements, 1);
});
