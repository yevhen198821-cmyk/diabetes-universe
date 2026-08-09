import assert from 'node:assert/strict';
import test from 'node:test';

import { createDashboardDaySummaryViewModel } from './dashboard-day-summary-model.ts';

const labels = {
  defaultEmpty: "Today's summary is not available yet.",
  defaultError: 'Could not load the day summary.',
  eyebrow: 'Current day',
  glucoseMeasurements: 'Glucose measurements',
  loading: 'Loading day summary',
  medicationDoses: 'Medication doses',
  reminders: 'Reminders',
  title: 'Day summary',
  totalCarbohydrates: 'Total carbohydrates',
  totalInsulin: 'Total insulin',
  unavailable: 'Day summary unavailable.',
  units: {
    compactInsulinDose: 'U',
    compactMassG: 'g',
  },
};

const validSummary = {
  dayDate: '2026-08-02',
  displayDayLabel: 'Sunday, 2 August 2026',
  glucoseMeasurements: 4,
  medicationDoses: 2,
  remindersCompleted: 1,
  remindersTotal: 3,
  totalCarbohydrateGrams: 120,
  totalInsulinUnits: 12,
};

const formattedMetrics = {
  glucoseMeasurements: '4',
  medicationDoses: '2',
  reminders: '1 / 3',
  totalCarbohydrates: '120 g',
  totalInsulin: '12 U',
};

test('creates ready state with primary and secondary metrics', () => {
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
  assert.equal(model.primaryMetrics.length, 3);
  assert.equal(model.secondaryMetrics.length, 2);
  assert.equal(model.primaryMetrics[0]?.label, 'Glucose measurements');
  assert.equal(model.primaryMetrics[0]?.value, '4');
  assert.equal(model.primaryMetrics[1]?.value, '12 U');
  assert.equal(model.primaryMetrics[2]?.value, '120 g');
  assert.equal(model.secondaryMetrics[0]?.value, '2');
  assert.equal(model.secondaryMetrics[1]?.value, '1 / 3');
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
        medicationDoses: 2,
        remindersCompleted: 1,
        remindersTotal: 3,
        totalCarbohydrateGrams: 120,
        totalInsulinUnits: 12,
      },
    },
    labels,
    formattedMetrics,
  );

  assert.equal(model.state, 'ready');
  assert.equal(model.dayDate, '2026-08-02');
  assert.equal(model.primaryMetrics[1]?.value, '12 U');
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
  assert.equal(model.primaryMetrics.length, 0);
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

test('downgrades reminders completed above total to the safe empty fallback', () => {
  const model = createDashboardDaySummaryViewModel(
    {
      state: 'ready',
      summary: {
        ...validSummary,
        remindersCompleted: 4,
        remindersTotal: 3,
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

test('does not expose charts, comparisons, tir, gmi, or ai fields', () => {
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
    model.primaryMetrics.some((metric) =>
      /tir|gmi|диапазон/i.test(metric.label),
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
        medicationDoses: 0,
        remindersCompleted: 0,
        remindersTotal: 0,
        totalCarbohydrateGrams: 0,
        totalInsulinUnits: 0,
      },
    },
    labels,
    {
      glucoseMeasurements: '0',
      medicationDoses: '0',
      reminders: '0 / 0',
      totalCarbohydrates: '0 g',
      totalInsulin: '0 U',
    },
  );

  assert.equal(model.state, 'ready');
  assert.equal(model.primaryMetrics[0]?.value, '0');
  assert.equal(model.secondaryMetrics[1]?.value, '0 / 0');
});

test('creates loading state with the default accessible label', () => {
  const model = createDashboardDaySummaryViewModel(
    { state: 'loading' },
    labels,
  );

  assert.equal(model.state, 'loading');
  assert.equal(model.isLoading, true);
  assert.equal(model.message, labels.loading);
  assert.equal(model.primaryMetrics.length, 0);
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
