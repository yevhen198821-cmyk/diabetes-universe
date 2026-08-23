import assert from 'node:assert/strict';
import test from 'node:test';

import { createDashboardDaySummaryViewModel } from './dashboard-day-summary-model.ts';

const labels = {
  activity: 'Activity',
  defaultEmpty: "Today's summary is not available yet.",
  defaultError: 'Could not load the day summary.',
  eyebrow: 'Current day',
  glucose: 'Glucose',
  loading: 'Loading day summary',
  title: 'Today',
  totalCarbohydrates: 'Carbohydrates',
  totalForDay: 'Total for the day',
  totalInsulin: 'Insulin',
  unavailable: 'Day summary unavailable.',
  units: {
    compactInsulinDose: 'U',
    compactMassG: 'g',
  },
  viewDetails: 'Details',
};

const validSummary = {
  dayDate: '2026-08-02',
  displayDayLabel: 'Sunday, 2 August 2026',
  glucoseMeasurements: 4,
  latestTodayGlucoseDisplay: '6.1 mmol/L',
  latestTodayGlucoseDisplayTime: '10:15',
  medicationDoses: 2,
  totalActivitySeconds: 1800,
  totalCarbohydrateGrams: 120,
  totalInsulinUnits: 12,
};

const formattedMetrics = {
  glucose: '6.1 mmol/L',
  totalActivity: '30 mins',
  totalCarbohydrates: '120 g',
  totalInsulin: '12 U',
};

test('creates ready state with four today metrics', () => {
  const model = createDashboardDaySummaryViewModel(
    {
      state: 'ready',
      summary: validSummary,
    },
    labels,
    formattedMetrics,
  );

  assert.equal(model.state, 'ready');
  assert.equal(model.dayDate, '2026-08-02');
  assert.equal(model.displayDayLabel, 'Sunday, 2 August 2026');
  assert.equal(model.metrics.length, 4);
  assert.equal(model.metrics[0]?.label, 'Glucose');
  assert.equal(model.metrics[0]?.value, '6.1 mmol/L');
  assert.equal(model.metrics[0]?.secondaryText, '10:15');
  assert.equal(model.metrics[1]?.value, '12 U');
  assert.equal(model.metrics[2]?.value, '120 g');
  assert.equal(model.metrics[3]?.value, '30 mins');
  assert.equal(model.isLoading, false);
});

test('normalizes ready summary values without changing their meaning', () => {
  const model = createDashboardDaySummaryViewModel(
    {
      state: 'ready',
      summary: {
        dayDate: ' 2026-08-02 ',
        displayDayLabel: ' Sunday, 2 August 2026 ',
        glucoseMeasurements: 4,
        latestTodayGlucoseDisplay: ' 6.1 mmol/L ',
        latestTodayGlucoseDisplayTime: ' 10:15 ',
        medicationDoses: 2,
        totalActivitySeconds: 1800,
        totalCarbohydrateGrams: 120,
        totalInsulinUnits: 12,
      },
    },
    labels,
    formattedMetrics,
  );

  assert.equal(model.state, 'ready');
  assert.equal(model.dayDate, '2026-08-02');
  assert.equal(model.metrics[1]?.value, '12 U');
});

test('downgrades invalid dayDate to the safe empty fallback', () => {
  const model = createDashboardDaySummaryViewModel(
    {
      state: 'ready',
      summary: {
        ...validSummary,
        dayDate: '2026-13-40',
      },
    },
    labels,
    formattedMetrics,
  );

  assert.equal(model.state, 'empty');
  assert.equal(model.message, labels.unavailable);
  assert.equal(model.metrics.length, 0);
});

test('downgrades negative totals to the safe empty fallback', () => {
  const model = createDashboardDaySummaryViewModel(
    {
      state: 'ready',
      summary: {
        ...validSummary,
        totalInsulinUnits: -1,
      },
    },
    labels,
    formattedMetrics,
  );

  assert.equal(model.state, 'empty');
  assert.equal(model.message, labels.unavailable);
});

test('keeps machine-readable dayDate separate from the display label', () => {
  const model = createDashboardDaySummaryViewModel(
    {
      state: 'ready',
      summary: {
        ...validSummary,
        dayDate: '2026-08-02',
        displayDayLabel: 'Sunday, 2 August 2026',
      },
    },
    labels,
    formattedMetrics,
  );

  assert.equal(model.state, 'ready');
  assert.equal(model.dayDate, '2026-08-02');
  assert.equal(model.displayDayLabel, 'Sunday, 2 August 2026');
  assert.notEqual(model.dayDate, model.displayDayLabel);
});

test('does not expose charts, comparisons, tir, gmi, ai fields, or reminders', () => {
  const model = createDashboardDaySummaryViewModel(
    {
      state: 'ready',
      summary: validSummary,
    },
    labels,
    formattedMetrics,
  );

  assert.equal(model.state, 'ready');
  assert.equal('timeInRange' in model, false);
  assert.equal('gmi' in model, false);
  assert.equal('tir' in model, false);
  assert.equal('chart' in model, false);
  assert.equal('aiInsight' in model, false);
  assert.equal(
    model.metrics.some((metric) =>
      /reminder|tir|gmi|диапазон/i.test(metric.label),
    ),
    false,
  );
});

test('accepts zero counts when the owner supplies valid current-day totals', () => {
  const model = createDashboardDaySummaryViewModel(
    {
      state: 'ready',
      summary: {
        ...validSummary,
        glucoseMeasurements: 0,
        latestTodayGlucoseDisplay: null,
        latestTodayGlucoseDisplayTime: null,
        medicationDoses: 0,
        totalActivitySeconds: 0,
        totalCarbohydrateGrams: 0,
        totalInsulinUnits: 0,
      },
    },
    labels,
    {
      glucose: '—',
      totalActivity: '0 mins',
      totalCarbohydrates: '0 g',
      totalInsulin: '0 U',
    },
  );

  assert.equal(model.state, 'ready');
  assert.equal(model.metrics[0]?.value, '—');
});

test('creates loading state with the default accessible label', () => {
  const model = createDashboardDaySummaryViewModel(
    { state: 'loading' },
    labels,
  );

  assert.equal(model.state, 'loading');
  assert.equal(model.isLoading, true);
  assert.equal(model.message, labels.loading);
  assert.equal(model.metrics.length, 0);
});

test('creates empty state with the default message when none is supplied', () => {
  const model = createDashboardDaySummaryViewModel({ state: 'empty' }, labels);

  assert.equal(model.state, 'empty');
  assert.equal(model.message, labels.defaultEmpty);
});

test('creates error state with the default message when none is supplied', () => {
  const model = createDashboardDaySummaryViewModel({ state: 'error' }, labels);

  assert.equal(model.state, 'error');
  assert.equal(model.message, labels.defaultError);
});

test('downgrades ready state without formatted metrics to unavailable empty', () => {
  const model = createDashboardDaySummaryViewModel(
    {
      state: 'ready',
      summary: validSummary,
    },
    labels,
  );

  assert.equal(model.state, 'empty');
  assert.equal(model.message, labels.unavailable);
});
