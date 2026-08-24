import assert from 'node:assert/strict';
import test from 'node:test';

import { liftLegacyTestFixture } from '../../lib/timeline/testing/lift-legacy-test-fixtures.ts';
import { CANONICAL_DEMO_REFERENCE_TIME } from '../../testing/demo-reference-time.ts';
import { createDashboardLastGlucoseViewModel } from './dashboard-last-glucose-model.ts';

const englishLabels = {
  defaultEmpty: 'No measurements yet.',
  defaultError: 'Could not load the last measurement.',
  eyebrow: 'Last measurement',
  fresh: 'Fresh data',
  loading: 'Loading last glucose measurement',
  stale: 'Measurement is outdated.',
  title: 'Last glucose',
  unavailable: 'Last measurement unavailable.',
};

function createGlucoseMeasurement(overrides = {}) {
  const event = liftLegacyTestFixture({
    context: 'Before breakfast',
    dateTime: '2026-08-02T05:00:00.000Z',
    id: 'glucose-test',
    kind: 'glucose',
    title: 'Glucose',
    value: '6.4 mmol/L',
    ...(overrides.eventOverrides ?? {}),
  });

  return {
    displayTime: '08:00',
    event,
    ...overrides,
  };
}

const validMeasurement = createGlucoseMeasurement();

test('creates ready state from a validated measurement contract', () => {
  const model = createDashboardLastGlucoseViewModel(
    {
      glucose: validMeasurement,
      referenceTime: CANONICAL_DEMO_REFERENCE_TIME,
      state: 'ready',
    },
    englishLabels,
    { formattedValue: '6.4 mmol/L' },
  );

  assert.equal(model.state, 'ready');
  assert.equal(model.value, '6.4 mmol/L');
  assert.equal(model.displayTime, '08:00');
  assert.equal(model.dateTime, '2026-08-02T05:00:00.000Z');
  assert.equal(model.message, null);
  assert.equal(model.isLoading, false);
  assert.equal(model.isStale, false);
  assert.equal(model.freshMessage, englishLabels.fresh);
  assert.equal(model.staleMessage, null);
});

test('normalizes ready state values without changing their meaning', () => {
  const model = createDashboardLastGlucoseViewModel(
    {
      glucose: {
        displayTime: ' 08:00 ',
        event: liftLegacyTestFixture({
          context: 'Before breakfast',
          dateTime: '2026-08-02T05:00:00.000Z',
          id: 'glucose-test',
          kind: 'glucose',
          title: 'Glucose',
          value: '6.4 mmol/L',
        }),
      },
      state: 'ready',
    },
    englishLabels,
    { formattedValue: ' 6.4 mmol/L ' },
  );

  assert.equal(model.state, 'ready');
  assert.equal(model.value, '6.4 mmol/L');
  assert.equal(model.displayTime, '08:00');
  assert.equal(model.dateTime, '2026-08-02T05:00:00.000Z');
});

test('downgrades empty formatted value in ready state to the safe empty fallback', () => {
  const model = createDashboardLastGlucoseViewModel(
    {
      glucose: validMeasurement,
      state: 'ready',
    },
    englishLabels,
    { formattedValue: '   ' },
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
      glucose: createGlucoseMeasurement({ displayTime: ' ' }),
      state: 'ready',
    },
    englishLabels,
    { formattedValue: '6.4 mmol/L' },
  );

  assert.equal(model.state, 'empty');
  assert.equal(model.value, null);
  assert.equal(model.displayTime, null);
  assert.equal(model.dateTime, null);
  assert.equal(model.message, englishLabels.unavailable);
});

test('downgrades invalid occurredAt in ready state to the safe empty fallback', () => {
  const model = createDashboardLastGlucoseViewModel(
    {
      glucose: {
        displayTime: '08:00',
        event: {
          ...validMeasurement.event,
          occurredAt: 'not-a-datetime',
        },
      },
      state: 'ready',
    },
    englishLabels,
    { formattedValue: '6.4 mmol/L' },
  );

  assert.equal(model.state, 'empty');
  assert.equal(model.dateTime, null);
  assert.equal(model.message, englishLabels.unavailable);
});

test('preserves a valid machine-readable occurredAt separate from display time', () => {
  const measurement = createGlucoseMeasurement();

  const model = createDashboardLastGlucoseViewModel(
    {
      glucose: measurement,
      state: 'ready',
    },
    englishLabels,
    { formattedValue: '6.4 mmol/L' },
  );

  assert.equal(model.state, 'ready');
  assert.equal(model.dateTime, measurement.event.occurredAt);
  assert.equal(model.displayTime, measurement.displayTime);
  assert.notEqual(model.dateTime, model.displayTime);
});

test('stale calculation uses canonical occurredAt and ignores display string', () => {
  const model = createDashboardLastGlucoseViewModel(
    {
      glucose: createGlucoseMeasurement({
        displayTime: 'not-used-for-stale',
        eventOverrides: {
          dateTime: '2026-08-01T05:00:00.000Z',
        },
      }),
      referenceTime: new Date('2026-08-02T05:00:01.000Z'),
      state: 'ready',
    },
    englishLabels,
    { formattedValue: '6.4 mmol/L' },
  );

  assert.equal(model.isStale, true);
  assert.equal(model.displayTime, 'not-used-for-stale');
});

test('does not expose or derive a glucose target range', () => {
  const model = createDashboardLastGlucoseViewModel(
    {
      glucose: validMeasurement,
      state: 'ready',
    },
    englishLabels,
    { formattedValue: '6.4 mmol/L' },
  );

  assert.equal(model.state, 'ready');
  assert.equal(model.value, '6.4 mmol/L');
  assert.equal('range' in model, false);
  assert.equal('targetRange' in model, false);
  assert.doesNotMatch(model.value ?? '', /диапазон|range/i);
});

test('accepts mmol per liter and mg per dL display values unchanged', () => {
  const mmolModel = createDashboardLastGlucoseViewModel(
    {
      glucose: validMeasurement,
      state: 'ready',
    },
    englishLabels,
    { formattedValue: '6.4 mmol/L' },
  );
  const mgDlModel = createDashboardLastGlucoseViewModel(
    {
      glucose: validMeasurement,
      state: 'ready',
    },
    englishLabels,
    { formattedValue: '115 mg/dL' },
  );

  assert.equal(mmolModel.value, '6.4 mmol/L');
  assert.equal(mgDlModel.value, '115 mg/dL');
});

test('marks a measurement older than the stale threshold as stale', () => {
  const model = createDashboardLastGlucoseViewModel(
    {
      glucose: createGlucoseMeasurement({
        eventOverrides: {
          dateTime: '2026-08-01T05:00:00.000Z',
        },
      }),
      referenceTime: new Date('2026-08-02T05:00:01.000Z'),
      state: 'ready',
    },
    englishLabels,
    { formattedValue: '6.4 mmol/L' },
  );

  assert.equal(model.state, 'ready');
  assert.equal(model.isStale, true);
  assert.equal(model.freshMessage, null);
  assert.equal(model.staleMessage, englishLabels.stale);
  assert.equal(model.value, '6.4 mmol/L');
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
