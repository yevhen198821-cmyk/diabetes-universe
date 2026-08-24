import assert from 'node:assert/strict';
import test from 'node:test';

import { deriveDashboardDaySummaryVisualizations } from './dashboard-day-summary-series.ts';
import { liftLegacyTestFixtures } from '../timeline/testing/lift-legacy-test-fixtures.ts';

const referenceTime = new Date('2026-08-02T10:00:00.000Z');

test('glucose series uses today events sorted chronologically', () => {
  const visualizations = deriveDashboardDaySummaryVisualizations(
    liftLegacyTestFixtures([
      {
        dateTime: '2026-08-02T07:15:00.000Z',
        id: 'glucose-late',
        kind: 'glucose',
        title: 'Glucose',
        value: '7.3',
      },
      {
        dateTime: '2026-08-02T05:00:00.000Z',
        id: 'glucose-early',
        kind: 'glucose',
        title: 'Glucose',
        value: '6.4',
      },
      {
        dateTime: '2026-08-01T07:15:00.000Z',
        id: 'glucose-yesterday',
        kind: 'glucose',
        title: 'Glucose',
        value: '5.0',
      },
    ]),
    referenceTime,
    'UTC',
  );

  assert.deepEqual(
    visualizations.glucose.map((point) => point.concentrationMmolPerL),
    [6.4, 7.3],
  );
});

test('single glucose event does not create a multi-point trend series', () => {
  const visualizations = deriveDashboardDaySummaryVisualizations(
    liftLegacyTestFixtures([
      {
        dateTime: '2026-08-02T07:15:00.000Z',
        id: 'glucose-single',
        kind: 'glucose',
        title: 'Glucose',
        value: '7.3',
      },
    ]),
    referenceTime,
    'UTC',
  );

  assert.equal(visualizations.glucose.length, 1);
});

test('zero glucose events returns an empty glucose series', () => {
  const visualizations = deriveDashboardDaySummaryVisualizations(
    liftLegacyTestFixtures([
      {
        dateTime: '2026-08-02T05:05:00.000Z',
        id: 'insulin-only',
        kind: 'insulin',
        title: 'NovoRapid',
        value: '4 U',
      },
    ]),
    referenceTime,
    'UTC',
  );

  assert.deepEqual(visualizations.glucose, []);
});

test('insulin series maps real doseUnits values', () => {
  const visualizations = deriveDashboardDaySummaryVisualizations(
    liftLegacyTestFixtures([
      {
        dateTime: '2026-08-02T05:05:00.000Z',
        id: 'insulin-1',
        kind: 'insulin',
        title: 'NovoRapid',
        value: '4 U',
      },
      {
        dateTime: '2026-08-02T15:00:00.000Z',
        id: 'insulin-2',
        kind: 'insulin',
        title: 'NovoRapid',
        value: '6 U',
      },
    ]),
    referenceTime,
    'UTC',
  );

  assert.deepEqual(
    visualizations.insulin.map((mark) => mark.doseUnits),
    [4, 6],
  );
});

test('nutrition series maps real carbohydrate values', () => {
  const visualizations = deriveDashboardDaySummaryVisualizations(
    liftLegacyTestFixtures([
      {
        dateTime: '2026-08-02T05:20:00.000Z',
        id: 'nutrition-1',
        kind: 'nutrition',
        title: 'Breakfast',
        value: '42 g',
      },
    ]),
    referenceTime,
    'UTC',
  );

  assert.deepEqual(
    visualizations.nutrition.map((mark) => mark.carbohydratesGrams),
    [42],
  );
});

test('activity series maps real duration data without goal percentages', () => {
  const visualizations = deriveDashboardDaySummaryVisualizations(
    liftLegacyTestFixtures([
      {
        dateTime: '2026-08-02T12:00:00.000Z',
        id: 'activity-1',
        kind: 'activity',
        title: 'Walk',
        value: '30 min',
      },
    ]),
    referenceTime,
    'UTC',
  );

  assert.deepEqual(
    visualizations.activity.map((mark) => mark.durationSeconds),
    [1800],
  );
  assert.equal(JSON.stringify(visualizations).includes('%'), false);
});
