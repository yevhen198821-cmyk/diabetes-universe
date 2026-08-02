import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createDashboardDaySummaryDayLabel,
  createDashboardDaySummaryViewModel,
  dashboardDaySummaryLabels,
} from './dashboard-day-summary-model.ts';

const validSummary = {
  dayDate: '2026-08-02',
  displayDayLabel: 'воскресенье, 2 августа',
  glucoseMeasurements: 4,
  medicationDoses: 2,
  remindersCompleted: 1,
  remindersTotal: 3,
  totalCarbohydrates: '120 г',
  totalInsulin: '12 ЕД',
};

test('creates ready state with primary and secondary metrics', () => {
  const model = createDashboardDaySummaryViewModel({
    state: 'ready',
    summary: validSummary,
  });

  assert.equal(model.state, 'ready');
  assert.equal(model.dayDate, '2026-08-02');
  assert.equal(model.displayDayLabel, 'воскресенье, 2 августа');
  assert.equal(model.primaryMetrics.length, 3);
  assert.equal(model.secondaryMetrics.length, 2);
  assert.equal(model.primaryMetrics[0]?.value, '4');
  assert.equal(model.primaryMetrics[1]?.value, '12 ЕД');
  assert.equal(model.primaryMetrics[2]?.value, '120 г');
  assert.equal(model.secondaryMetrics[0]?.value, '2');
  assert.equal(model.secondaryMetrics[1]?.value, '1 / 3');
  assert.equal(model.isLoading, false);
});

test('normalizes ready summary values without changing their meaning', () => {
  const model = createDashboardDaySummaryViewModel({
    state: 'ready',
    summary: {
      dayDate: ' 2026-08-02 ',
      displayDayLabel: ' воскресенье, 2 августа ',
      glucoseMeasurements: 4,
      medicationDoses: 2,
      remindersCompleted: 1,
      remindersTotal: 3,
      totalCarbohydrates: ' 120 г ',
      totalInsulin: ' 12 ЕД ',
    },
  });

  assert.equal(model.state, 'ready');
  assert.equal(model.dayDate, '2026-08-02');
  assert.equal(model.totalInsulin, undefined);
  assert.equal(model.primaryMetrics[1]?.value, '12 ЕД');
});

test('downgrades invalid dayDate to the safe empty fallback', () => {
  const model = createDashboardDaySummaryViewModel({
    state: 'ready',
    summary: {
      ...validSummary,
      dayDate: '2026-13-40',
    },
  });

  assert.equal(model.state, 'empty');
  assert.equal(model.message, dashboardDaySummaryLabels.unavailable);
  assert.equal(model.primaryMetrics.length, 0);
});

test('downgrades empty display totals to the safe empty fallback', () => {
  const model = createDashboardDaySummaryViewModel({
    state: 'ready',
    summary: {
      ...validSummary,
      totalInsulin: '   ',
    },
  });

  assert.equal(model.state, 'empty');
  assert.equal(model.message, dashboardDaySummaryLabels.unavailable);
});

test('downgrades reminders completed above total to the safe empty fallback', () => {
  const model = createDashboardDaySummaryViewModel({
    state: 'ready',
    summary: {
      ...validSummary,
      remindersCompleted: 4,
      remindersTotal: 3,
    },
  });

  assert.equal(model.state, 'empty');
  assert.equal(model.message, dashboardDaySummaryLabels.unavailable);
});

test('creates a machine-readable dayDate separate from the display label', () => {
  const dayLabel = createDashboardDaySummaryDayLabel(
    new Date('2026-08-02T10:00:00+03:00'),
    'ru-RU',
    'Europe/Moscow',
  );

  assert.ok(dayLabel);
  assert.equal(dayLabel.dayDate, '2026-08-02');
  assert.match(dayLabel.displayDayLabel, /август/i);

  const model = createDashboardDaySummaryViewModel({
    state: 'ready',
    summary: {
      ...validSummary,
      dayDate: dayLabel.dayDate,
      displayDayLabel: dayLabel.displayDayLabel,
    },
  });

  assert.equal(model.state, 'ready');
  assert.equal(model.dayDate, dayLabel.dayDate);
  assert.equal(model.displayDayLabel, dayLabel.displayDayLabel);
  assert.notEqual(model.dayDate, model.displayDayLabel);
});

test('does not expose charts, comparisons, tir, gmi, or ai fields', () => {
  const model = createDashboardDaySummaryViewModel({
    state: 'ready',
    summary: validSummary,
  });

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
  const model = createDashboardDaySummaryViewModel({
    state: 'ready',
    summary: {
      ...validSummary,
      glucoseMeasurements: 0,
      medicationDoses: 0,
      remindersCompleted: 0,
      remindersTotal: 0,
      totalCarbohydrates: '0 г',
      totalInsulin: '0 ЕД',
    },
  });

  assert.equal(model.state, 'ready');
  assert.equal(model.primaryMetrics[0]?.value, '0');
  assert.equal(model.secondaryMetrics[1]?.value, '0 / 0');
});

test('creates loading state with the default accessible label', () => {
  const model = createDashboardDaySummaryViewModel({ state: 'loading' });

  assert.equal(model.state, 'loading');
  assert.equal(model.isLoading, true);
  assert.equal(model.message, dashboardDaySummaryLabels.loading);
  assert.equal(model.primaryMetrics.length, 0);
});

test('creates empty state with the default message when none is supplied', () => {
  const model = createDashboardDaySummaryViewModel({ state: 'empty' });

  assert.equal(model.state, 'empty');
  assert.equal(model.message, dashboardDaySummaryLabels.defaultEmpty);
});

test('creates error state with the default message when none is supplied', () => {
  const model = createDashboardDaySummaryViewModel({ state: 'error' });

  assert.equal(model.state, 'error');
  assert.equal(model.message, dashboardDaySummaryLabels.defaultError);
});

test('exposes stable approved labels', () => {
  assert.equal(dashboardDaySummaryLabels.title, 'Сводка дня');
  assert.equal(dashboardDaySummaryLabels.eyebrow, 'Текущий день');
  assert.equal(
    dashboardDaySummaryLabels.glucoseMeasurements,
    'Измерения глюкозы',
  );
  assert.equal(dashboardDaySummaryLabels.totalInsulin, 'Суммарный инсулин');
  assert.equal(
    dashboardDaySummaryLabels.totalCarbohydrates,
    'Суммарные углеводы',
  );
  assert.equal(dashboardDaySummaryLabels.medicationDoses, 'Приёмы лекарств');
  assert.equal(dashboardDaySummaryLabels.reminders, 'Напоминания');
});
