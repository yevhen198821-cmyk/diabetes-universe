import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createDashboardLastGlucoseMeasurement,
  createDashboardLastGlucoseViewModel,
  dashboardLastGlucoseLabels,
} from './dashboard-last-glucose-model.ts';

const validMeasurement = {
  dateTime: '2026-08-02T05:00:00.000Z',
  displayTime: '08:00',
  value: '6,4 ммоль/л',
};

test('creates ready state from a validated measurement contract', () => {
  const model = createDashboardLastGlucoseViewModel({
    glucose: validMeasurement,
    state: 'ready',
  });

  assert.equal(model.state, 'ready');
  assert.equal(model.value, '6,4 ммоль/л');
  assert.equal(model.displayTime, '08:00');
  assert.equal(model.dateTime, '2026-08-02T05:00:00.000Z');
  assert.equal(model.message, null);
  assert.equal(model.isLoading, false);
  assert.equal(model.isStale, false);
  assert.equal(model.staleMessage, null);
});

test('normalizes ready state values without changing their meaning', () => {
  const model = createDashboardLastGlucoseViewModel({
    glucose: {
      dateTime: ' 2026-08-02T05:00:00.000Z ',
      displayTime: ' 08:00 ',
      value: ' 6,4 ммоль/л ',
    },
    state: 'ready',
  });

  assert.equal(model.state, 'ready');
  assert.equal(model.value, '6,4 ммоль/л');
  assert.equal(model.displayTime, '08:00');
  assert.equal(model.dateTime, '2026-08-02T05:00:00.000Z');
});

test('downgrades empty value in ready state to the safe empty fallback', () => {
  const model = createDashboardLastGlucoseViewModel({
    glucose: {
      dateTime: '2026-08-02T05:00:00.000Z',
      displayTime: '08:00',
      value: '   ',
    },
    state: 'ready',
  });

  assert.equal(model.state, 'empty');
  assert.equal(model.value, null);
  assert.equal(model.displayTime, null);
  assert.equal(model.dateTime, null);
  assert.equal(model.message, dashboardLastGlucoseLabels.unavailable);
});

test('downgrades empty display time in ready state to the safe empty fallback', () => {
  const model = createDashboardLastGlucoseViewModel({
    glucose: {
      dateTime: '2026-08-02T05:00:00.000Z',
      displayTime: ' ',
      value: '6,4 ммоль/л',
    },
    state: 'ready',
  });

  assert.equal(model.state, 'empty');
  assert.equal(model.value, null);
  assert.equal(model.displayTime, null);
  assert.equal(model.dateTime, null);
  assert.equal(model.message, dashboardLastGlucoseLabels.unavailable);
});

test('downgrades invalid dateTime in ready state to the safe empty fallback', () => {
  const model = createDashboardLastGlucoseViewModel({
    glucose: {
      dateTime: 'not-a-datetime',
      displayTime: '08:00',
      value: '6,4 ммоль/л',
    },
    state: 'ready',
  });

  assert.equal(model.state, 'empty');
  assert.equal(model.dateTime, null);
  assert.equal(model.message, dashboardLastGlucoseLabels.unavailable);
});

test('preserves a valid machine-readable dateTime separate from display time', () => {
  const measurement = createDashboardLastGlucoseMeasurement(
    new Date('2026-08-02T05:00:00.000Z'),
    'ru-RU',
    'Europe/Moscow',
    '6,4 ммоль/л',
  );

  assert.ok(measurement);
  assert.equal(measurement.dateTime, '2026-08-02T05:00:00.000Z');
  assert.match(measurement.displayTime, /\d{1,2}:\d{2}/);

  const model = createDashboardLastGlucoseViewModel({
    glucose: measurement,
    state: 'ready',
  });

  assert.equal(model.state, 'ready');
  assert.equal(model.dateTime, measurement.dateTime);
  assert.equal(model.displayTime, measurement.displayTime);
  assert.notEqual(model.dateTime, model.displayTime);
});

test('does not expose or derive a glucose target range', () => {
  const model = createDashboardLastGlucoseViewModel({
    glucose: {
      dateTime: '2026-08-02T05:00:00.000Z',
      displayTime: '08:00',
      value: '6,4 ммоль/л',
    },
    state: 'ready',
  });

  assert.equal(model.state, 'ready');
  assert.equal(model.value, '6,4 ммоль/л');
  assert.equal('range' in model, false);
  assert.equal('targetRange' in model, false);
  assert.doesNotMatch(model.value ?? '', /диапазон|range/i);
});

test('accepts mmol per liter and mg per dL display values unchanged', () => {
  const mmolModel = createDashboardLastGlucoseViewModel({
    glucose: {
      dateTime: '2026-08-02T05:00:00.000Z',
      displayTime: '08:00',
      value: '6,4 ммоль/л',
    },
    state: 'ready',
  });
  const mgDlModel = createDashboardLastGlucoseViewModel({
    glucose: {
      dateTime: '2026-08-02T05:00:00.000Z',
      displayTime: '08:00',
      value: '115 mg/dL',
    },
    state: 'ready',
  });

  assert.equal(mmolModel.value, '6,4 ммоль/л');
  assert.equal(mgDlModel.value, '115 mg/dL');
});

test('marks a measurement older than the stale threshold as stale', () => {
  const model = createDashboardLastGlucoseViewModel({
    glucose: {
      dateTime: '2026-08-01T05:00:00.000Z',
      displayTime: '08:00',
      value: '6,4 ммоль/л',
    },
    referenceTime: new Date('2026-08-02T05:00:01.000Z'),
    state: 'ready',
  });

  assert.equal(model.state, 'ready');
  assert.equal(model.isStale, true);
  assert.equal(model.staleMessage, dashboardLastGlucoseLabels.stale);
  assert.equal(model.value, '6,4 ммоль/л');
});

test('creates loading state with the default accessible label', () => {
  const model = createDashboardLastGlucoseViewModel({ state: 'loading' });

  assert.equal(model.state, 'loading');
  assert.equal(model.isLoading, true);
  assert.equal(model.message, dashboardLastGlucoseLabels.loading);
  assert.equal(model.value, null);
  assert.equal(model.displayTime, null);
  assert.equal(model.dateTime, null);
});

test('accepts a supplied loading label', () => {
  const model = createDashboardLastGlucoseViewModel({
    loadingLabel: 'Обновление последнего измерения',
    state: 'loading',
  });

  assert.equal(model.message, 'Обновление последнего измерения');
});

test('creates empty state with the default message when none is supplied', () => {
  const model = createDashboardLastGlucoseViewModel({
    state: 'empty',
  });

  assert.equal(model.state, 'empty');
  assert.equal(model.message, dashboardLastGlucoseLabels.defaultEmpty);
  assert.equal(model.value, null);
  assert.equal(model.displayTime, null);
  assert.equal(model.dateTime, null);
});

test('creates empty state from caller-supplied content', () => {
  const model = createDashboardLastGlucoseViewModel({
    message: 'Измерений пока нет.',
    state: 'empty',
  });

  assert.equal(model.state, 'empty');
  assert.equal(model.message, 'Измерений пока нет.');
});

test('creates error state with the default message when none is supplied', () => {
  const model = createDashboardLastGlucoseViewModel({
    state: 'error',
  });

  assert.equal(model.state, 'error');
  assert.equal(model.message, dashboardLastGlucoseLabels.defaultError);
  assert.equal(model.isLoading, false);
});

test('creates error state from trimmed caller-supplied content', () => {
  const model = createDashboardLastGlucoseViewModel({
    message: ' Не удалось загрузить последнее измерение. ',
    state: 'error',
  });

  assert.equal(model.state, 'error');
  assert.equal(model.message, 'Не удалось загрузить последнее измерение.');
});

test('exposes stable approved labels', () => {
  assert.equal(dashboardLastGlucoseLabels.title, 'Последняя глюкоза');
  assert.equal(dashboardLastGlucoseLabels.eyebrow, 'Последнее измерение');
  assert.equal(
    dashboardLastGlucoseLabels.loading,
    'Загрузка последнего измерения глюкозы',
  );
  assert.equal(dashboardLastGlucoseLabels.stale, 'Измерение устарело.');
});
