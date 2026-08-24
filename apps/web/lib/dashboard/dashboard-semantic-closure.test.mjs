import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { selectDashboardRecentEvents } from '../../components/dashboard/dashboard-recent-events-model.ts';
import { createTestPlatformRuntime } from '../platform/react/testing/create-test-platform-runtime.ts';
import { createTimelinePresentationDependencies } from '../timeline/presentation/index.ts';
import { liftLegacyTestFixtures } from '../timeline/testing/lift-legacy-test-fixtures.ts';
import { createTestTimelinePresentationDependencies } from '../timeline/presentation/testing/create-test-timeline-presentation-dependencies.ts';
import { deriveDashboardQuickAddBlocks } from './dashboard-quick-add-integration-model.ts';
import { createNextActionContext } from './next-action/next-action-context.ts';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const referenceTime = new Date('2026-08-02T10:00:00.000Z');
const formatDaySummaryDisplayDate = () => 'Sunday, 2 August 2026';
const formatUtcShortTime = (dateTime) => {
  const date = new Date(dateTime);

  if (Number.isNaN(date.getTime())) {
    return '--:--';
  }

  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
};

let presentationDependencies;

test.before(async () => {
  presentationDependencies = await createTestTimelinePresentationDependencies();
});

const categoryLabels = {
  activity: 'Activity',
  insulin: 'Insulin',
  medication: 'Medication',
  nutrition: 'Nutrition',
};

function deriveBlocks(events, options = {}) {
  return deriveDashboardQuickAddBlocks(
    { events },
    {
      formatDaySummaryDisplayDate,
      formatLastGlucoseDisplayTime: formatUtcShortTime,
      formatRecentEventDisplayTime: formatUtcShortTime,
      referenceTime,
      timeZone: 'UTC',
      presentationDependencies,
      ...options,
    },
  );
}

test('latest glucose selection uses semantic concentrationMmolPerL and occurredAt', () => {
  const blocks = deriveBlocks(
    liftLegacyTestFixtures([
      {
        context: 'Before breakfast',
        dateTime: '2026-08-02T08:00:00.000Z',
        id: 'glucose-0800',
        kind: 'glucose',
        title: 'Glucose',
        value: '6.4 mmol/L',
      },
      {
        context: 'Earlier',
        dateTime: '2026-08-02T07:15:00.000Z',
        id: 'glucose-0715',
        kind: 'glucose',
        title: 'Glucose',
        value: '7.3 mmol/L',
      },
    ]),
  );

  assert.equal(blocks.lastGlucose?.event.kind, 'glucose');
  assert.equal(
    blocks.lastGlucose?.event.occurredAt,
    '2026-08-02T08:00:00.000Z',
  );
  assert.equal(blocks.lastGlucose?.event.concentrationMmolPerL, 6.4);
  assert.equal('value' in (blocks.lastGlucose ?? {}), false);
});

test('day summary keeps insulin and carbohydrate totals numeric', () => {
  const blocks = deriveBlocks(
    liftLegacyTestFixtures([
      {
        context: 'Today',
        dateTime: '2026-08-02T08:05:00.000Z',
        id: 'insulin-today',
        kind: 'insulin',
        title: 'NovoRapid',
        value: '4 U',
      },
      {
        context: 'Today',
        dateTime: '2026-08-02T08:20:00.000Z',
        id: 'nutrition-today',
        kind: 'nutrition',
        title: 'Breakfast',
        value: '42 g carbs',
      },
    ]),
  );

  assert.equal(blocks.daySummary?.totalInsulinUnits, 4);
  assert.equal(blocks.daySummary?.totalCarbohydrateGrams, 42);
  assert.equal(typeof blocks.daySummary?.totalInsulinUnits, 'number');
  assert.equal(typeof blocks.daySummary?.totalCarbohydrateGrams, 'number');
});

test('day summary counts medication doses and glucose measurements from semantic events', () => {
  const blocks = deriveBlocks(
    liftLegacyTestFixtures([
      {
        context: 'Today',
        dateTime: '2026-08-02T08:00:00.000Z',
        id: 'glucose-1',
        kind: 'glucose',
        title: 'Glucose',
        value: '6.4 mmol/L',
      },
      {
        context: 'Today',
        dateTime: '2026-08-02T08:10:00.000Z',
        id: 'glucose-2',
        kind: 'glucose',
        title: 'Glucose',
        value: '7.0 mmol/L',
      },
      {
        context: 'Today',
        dateTime: '2026-08-02T08:30:00.000Z',
        id: 'medication-1',
        kind: 'medication',
        title: 'Metformin',
        unit: 'мг',
        value: '500',
      },
    ]),
  );

  assert.equal(blocks.daySummary?.glucoseMeasurements, 2);
  assert.equal(blocks.daySummary?.medicationDoses, 1);
});

test('day summary derives activity totals and latest glucose display from semantic events', () => {
  const blocks = deriveBlocks(
    liftLegacyTestFixtures([
      {
        context: 'Today',
        dateTime: '2026-08-02T08:00:00.000Z',
        id: 'glucose-1',
        kind: 'glucose',
        title: 'Glucose',
        value: '6.4 mmol/L',
      },
      {
        context: 'Walk',
        dateTime: '2026-08-02T09:00:00.000Z',
        id: 'activity-1',
        kind: 'activity',
        title: 'Walk',
        value: '30 min',
      },
    ]),
  );

  assert.equal(blocks.daySummary?.totalActivitySeconds, 1800);
  assert.match(
    blocks.daySummary?.latestTodayGlucoseDisplay ?? '',
    /6\.4 mmol\/L/,
  );
  assert.equal(blocks.daySummary?.latestTodayGlucoseDisplayTime, '08:00');
});

test('recent events order by occurredAt after semantic selection', () => {
  const blocks = deriveBlocks(
    liftLegacyTestFixtures([
      {
        context: 'Morning',
        dateTime: '2026-08-02T04:30:00.000Z',
        id: 'medication-0730',
        kind: 'medication',
        title: 'Metformin',
        unit: 'мг',
        value: '500',
      },
      {
        context: 'Before breakfast',
        dateTime: '2026-08-02T15:00:00.000Z',
        id: 'insulin-1800',
        kind: 'insulin',
        title: 'NovoRapid',
        value: '6 U',
      },
      {
        context: 'After insulin',
        dateTime: '2026-08-02T05:20:00.000Z',
        id: 'nutrition-0820',
        kind: 'nutrition',
        title: 'Breakfast',
        value: '42 g carbs',
      },
    ]),
    { timeZone: 'Europe/Moscow' },
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

test('presentation locale does not change numeric day summary derivation', async () => {
  const enRuntime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'UTC' },
  });
  const deRuntime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'de-DE', cookieTimeZone: 'UTC' },
  });
  const events = liftLegacyTestFixtures([
    {
      context: 'Today',
      dateTime: '2026-08-02T08:05:00.000Z',
      id: 'insulin-today',
      kind: 'insulin',
      title: 'NovoRapid',
      value: '4 U',
    },
    {
      context: 'Today',
      dateTime: '2026-08-02T08:20:00.000Z',
      id: 'nutrition-today',
      kind: 'nutrition',
      title: 'Breakfast',
      value: '42 g carbs',
    },
  ]);
  const enBlocks = deriveDashboardQuickAddBlocks(
    { events },
    {
      formatDaySummaryDisplayDate,
      referenceTime,
      timeZone: 'UTC',
      presentationDependencies: createTimelinePresentationDependencies({
        formatter: enRuntime.formatter,
        localization: enRuntime.localization,
      }),
    },
  );
  const deBlocks = deriveDashboardQuickAddBlocks(
    { events },
    {
      formatDaySummaryDisplayDate,
      referenceTime,
      timeZone: 'UTC',
      presentationDependencies: createTimelinePresentationDependencies({
        formatter: deRuntime.formatter,
        localization: deRuntime.localization,
      }),
    },
  );

  assert.deepEqual(
    {
      totalCarbohydrateGrams: enBlocks.daySummary?.totalCarbohydrateGrams,
      totalInsulinUnits: enBlocks.daySummary?.totalInsulinUnits,
    },
    {
      totalCarbohydrateGrams: deBlocks.daySummary?.totalCarbohydrateGrams,
      totalInsulinUnits: deBlocks.daySummary?.totalInsulinUnits,
    },
  );
});

test('next action context receives semantic latest glucose without presentation strings', () => {
  const events = liftLegacyTestFixtures([
    {
      context: 'Before breakfast',
      dateTime: '2026-08-02T08:00:00.000Z',
      id: 'glucose-0800',
      kind: 'glucose',
      title: 'Glucose',
      value: '6.4 mmol/L',
    },
  ]);
  const context = createNextActionContext({
    events,
    now: referenceTime,
    quickAddAvailability: {
      availableCategories: ['glucose'],
    },
  });

  assert.equal(context.latestGlucose?.occurredAt, '2026-08-02T08:00:00.000Z');
  assert.equal(context.latestGlucose?.concentrationMmolPerL, 6.4);
  assert.equal('value' in (context.latestGlucose ?? {}), false);
  assert.equal('dateTime' in (context.latestGlucose ?? {}), false);
});

test('dashboard integration model does not use parseLeadingNumber or legacy business fields', () => {
  const source = readFileSync(
    join(currentDirectory, 'dashboard-quick-add-integration-model.ts'),
    'utf8',
  );

  assert.equal(source.includes('parseLeadingNumber'), false);
  assert.equal(source.includes('.title'), false);
  assert.equal(source.includes('.value'), false);
  assert.equal(source.includes('.unit'), false);
  assert.equal(source.includes('getRecentTimelineEvents'), false);
  assert.equal(source.includes('formatLatestGlucoseValue'), false);
});

test('recent events derivation reuses timeline presentation mapper output', () => {
  const blocks = deriveBlocks(
    liftLegacyTestFixtures([
      {
        context: 'Before breakfast',
        dateTime: '2026-08-02T08:05:00.000Z',
        id: 'insulin-0805',
        kind: 'insulin',
        title: 'NovoRapid',
        value: '4 U',
      },
    ]),
  );

  assert.equal(blocks.recentEvents[0]?.title, 'NovoRapid');
  assert.equal(blocks.recentEvents[0]?.unit, 'U');
  assert.equal(blocks.recentEvents[0]?.value, '4');
});

test('compact dashboard summary units differ from descriptive timeline nutrition units', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'UTC' },
  });
  const dependencies = createTimelinePresentationDependencies({
    formatter: runtime.formatter,
    localization: runtime.localization,
  });

  assert.equal(dependencies.labels.units.massG, 'g');
  assert.equal(dependencies.labels.units.nutritionCarbs, 'g carbs');
  assert.notEqual(
    dependencies.labels.units.massG,
    dependencies.labels.units.nutritionCarbs,
  );
});

test('deriveDashboardQuickAddBlocks returns empty recent events without display-time formatter', () => {
  const blocks = deriveDashboardQuickAddBlocks(
    {
      events: liftLegacyTestFixtures([
        {
          context: 'Before breakfast',
          dateTime: '2026-08-02T08:05:00.000Z',
          id: 'insulin-0805',
          kind: 'insulin',
          title: 'NovoRapid',
          value: '4 U',
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

  assert.deepEqual(blocks.recentEvents, []);
});
