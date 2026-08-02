import assert from 'node:assert/strict';
import test from 'node:test';

import { createDashboardLastGlucoseViewModel } from './dashboard-last-glucose-model.ts';

const englishLabels = {
  defaultEmpty: 'No measurements yet.',
  defaultError: 'Could not load the last measurement.',
  eyebrow: 'Last measurement',
  loading: 'Loading last glucose measurement',
  stale: 'Measurement is outdated.',
  title: 'Last glucose',
  unavailable: 'Last measurement unavailable.',
};

const validMeasurement = {
  dateTime: '2026-08-02T05:00:00.000Z',
  displayTime: '08:00',
  value: '6,4 ммоль/л',
};

test('creates ready state from a validated measurement contract', () => {
  const model = createDashboardLastGlucoseViewModel(
    {
      glucose: validMeasurement,
      state: 'ready',
    },
    englishLabels,
  );

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
  const model = createDashboardLastGlucoseViewModel(
    {
      glucose: {
        dateTime: ' 2026-08-02T05:00:00.000Z ',
        displayTime: ' 08:00 ',
        value: ' 6,4 ммоль/л ',
      },
      state: 'ready',
    },
    englishLabels,
  );

  assert.equal(model.state, 'ready');
  assert.equal(model.value, '6,4 ммоль/л');
  assert.equal(model.displayTime, '08:00');
  assert.equal(model.dateTime, '2026-08-02T05:00:00.000Z');
});

test('downgrades empty value in ready state to the safe empty fallback', () => {
  const model = createDashboardLastGlucoseViewModel(
    {
      glucose: {
        dateTime: '2026-08-02T05:00:00.000Z',
        displayTime: '08:00',
        value: '   ',
      },
      state: 'ready',
    },
    englishLabels,
  );

  assert.equal(model.state, 'empty');
  assert.equal(model.value, null);
  assert.equal(model.displayTime, null);
  assert.equal(model.dateTime, null);
  assert.equal(model.message, englishLabels.unavailable);
});

test('downgrades empty display time in ready state to the safe empty fallback', () => {
  const model = createDashboardLastGlucoseViewModel(
    {
      glucose: {
        dateTime: '2026-08-02T05:00:00.000Z',
        displayTime: ' ',
        value: '6,4 ммоль/л',
      },
      state: 'ready',
    },
    englishLabels,
  );

  assert.equal(model.state, 'empty');
  assert.equal(model.value, null);
  assert.equal(model.displayTime, null);
  assert.equal(model.dateTime, null);
  assert.equal(model.message, englishLabels.unavailable);
});

test('downgrades invalid dateTime in ready state to the safe empty fallback', () => {
  const model = createDashboardLastGlucoseViewModel(
    {
      glucose: {
        dateTime: 'not-a-datetime',
        displayTime: '08:00',
        value: '6,4 ммоль/л',
      },
      state: 'ready',
    },
    englishLabels,
  );

  assert.equal(model.state, 'empty');
  assert.equal(model.dateTime, null);
  assert.equal(model.message, englishLabels.unavailable);
});

test('preserves a valid machine-readable dateTime separate from display time', () => {
  const measurement = {
    dateTime: '2026-08-02T05:00:00.000Z',
    displayTime: '08:00',
    value: '6,4 ммоль/л',
  };

  const model = createDashboardLastGlucoseViewModel(
    {
      glucose: measurement,
      state: 'ready',
    },
    englishLabels,
  );

  assert.equal(model.state, 'ready');
  assert.equal(model.dateTime, measurement.dateTime);
  assert.equal(model.displayTime, measurement.displayTime);
  assert.notEqual(model.dateTime, model.displayTime);
});

test('stale calculation uses canonical dateTime and ignores display string', () => {
  const model = createDashboardLastGlucoseViewModel(
    {
      glucose: {
        dateTime: '2026-08-01T05:00:00.000Z',
        displayTime: 'not-used-for-stale',
        value: '6,4 ммоль/л',
      },
      referenceTime: new Date('2026-08-02T05:00:01.000Z'),
      state: 'ready',
    },
    englishLabels,
  );

  assert.equal(model.isStale, true);
  assert.equal(model.displayTime, 'not-used-for-stale');
});

test('does not expose or derive a glucose target range', () => {
  const model = createDashboardLastGlucoseViewModel(
    {
      glucose: {
        dateTime: '2026-08-02T05:00:00.000Z',
        displayTime: '08:00',
        value: '6,4 ммоль/л',
      },
      state: 'ready',
    },
    englishLabels,
  );

  assert.equal(model.state, 'ready');
  assert.equal(model.value, '6,4 ммоль/л');
  assert.equal('range' in model, false);
  assert.equal('targetRange' in model, false);
  assert.doesNotMatch(model.value ?? '', /диапазон|range/i);
});

test('accepts mmol per liter and mg per dL display values unchanged', () => {
  const mmolModel = createDashboardLastGlucoseViewModel(
    {
      glucose: {
        dateTime: '2026-08-02T05:00:00.000Z',
        displayTime: '08:00',
        value: '6,4 ммоль/л',
      },
      state: 'ready',
    },
    englishLabels,
  );
  const mgDlModel = createDashboardLastGlucoseViewModel(
    {
      glucose: {
        dateTime: '2026-08-02T05:00:00.000Z',
        displayTime: '08:00',
        value: '115 mg/dL',
      },
      state: 'ready',
    },
    englishLabels,
  );

  assert.equal(mmolModel.value, '6,4 ммоль/л');
  assert.equal(mgDlModel.value, '115 mg/dL');
});

test('marks a measurement older than the stale threshold as stale', () => {
  const model = createDashboardLastGlucoseViewModel(
    {
      glucose: {
        dateTime: '2026-08-01T05:00:00.000Z',
        displayTime: '08:00',
        value: '6,4 ммоль/л',
      },
      referenceTime: new Date('2026-08-02T05:00:01.000Z'),
      state: 'ready',
    },
    englishLabels,
  );

  assert.equal(model.state, 'ready');
  assert.equal(model.isStale, true);
  assert.equal(model.staleMessage, englishLabels.stale);
  assert.equal(model.value, '6,4 ммоль/л');
});

test('creates loading state with the default accessible label', () => {
  const model = createDashboardLastGlucoseViewModel(
    { state: 'loading' },
    englishLabels,
  );

  assert.equal(model.state, 'loading');
  assert.equal(model.isLoading, true);
  assert.equal(model.message, englishLabels.loading);
  assert.equal(model.value, null);
  assert.equal(model.displayTime, null);
  assert.equal(model.dateTime, null);
});

test('accepts a supplied loading label', () => {
  const model = createDashboardLastGlucoseViewModel(
    {
      loadingLabel: 'Refreshing last measurement',
      state: 'loading',
    },
    englishLabels,
  );

  assert.equal(model.message, 'Refreshing last measurement');
});

test('creates empty state with the default message when none is supplied', () => {
  const model = createDashboardLastGlucoseViewModel(
    {
      state: 'empty',
    },
    englishLabels,
  );

  assert.equal(model.state, 'empty');
  assert.equal(model.message, englishLabels.defaultEmpty);
  assert.equal(model.value, null);
  assert.equal(model.displayTime, null);
  assert.equal(model.dateTime, null);
});

test('creates empty state from caller-supplied content', () => {
  const model = createDashboardLastGlucoseViewModel(
    {
      message: 'No measurements yet.',
      state: 'empty',
    },
    englishLabels,
  );

  assert.equal(model.state, 'empty');
  assert.equal(model.message, 'No measurements yet.');
});

test('creates error state with the default message when none is supplied', () => {
  const model = createDashboardLastGlucoseViewModel(
    {
      state: 'error',
    },
    englishLabels,
  );

  assert.equal(model.state, 'error');
  assert.equal(model.message, englishLabels.defaultError);
  assert.equal(model.isLoading, false);
});

test('creates error state from trimmed caller-supplied content', () => {
  const model = createDashboardLastGlucoseViewModel(
    {
      message: ' Could not load the last measurement. ',
      state: 'error',
    },
    englishLabels,
  );

  assert.equal(model.state, 'error');
  assert.equal(model.message, 'Could not load the last measurement.');
});
