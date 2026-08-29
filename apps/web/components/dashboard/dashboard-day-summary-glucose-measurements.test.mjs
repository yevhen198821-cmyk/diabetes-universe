import assert from 'node:assert/strict';
import test from 'node:test';

import {
  germanTranslationResource,
  russianTranslationResource,
  ukrainianTranslationResource,
} from '../../../../packages/locales/src/index.ts';
import { formatPluralMessage } from '../../../../packages/i18n/src/runtime/format-plural-message.ts';
import { createTestPlatformRuntime } from '../../lib/platform/react/testing/create-test-platform-runtime.ts';
import { resolveDashboardDaySummaryLabels } from './dashboard-day-summary-labels.ts';
import { createDashboardDaySummaryViewModel } from './dashboard-day-summary-model.ts';

const labels = {
  activity: 'Activity',
  chartAria: {
    activity: (count) => `${count} activity entries today`,
    glucose: (count) => `${count} glucose readings today`,
    insulin: (count) => `${count} insulin doses today`,
    nutrition: (count) => `${count} nutrition entries today`,
  },
  chartEmptyHint: 'No entries today',
  defaultEmpty: "Today's summary is not available yet.",
  defaultError: 'Could not load the day summary.',
  eyebrow: 'Current day',
  formatGlucoseMeasurementCount: (count) =>
    count === 1 ? '1 measurement' : `${count} measurements`,
  glucose: 'Glucose',
  glucoseMeasurements: {
    few: '{count} measurements',
    many: '{count} measurements',
    one: '{count} measurement',
    other: '{count} measurements',
  },
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

const visualizations = {
  activity: [{ durationSeconds: 1800 }],
  glucose: [{ concentrationMmolPerL: 6.1 }, { concentrationMmolPerL: 6.4 }],
  insulin: [{ doseUnits: 12 }],
  nutrition: [{ carbohydratesGrams: 120 }],
};

function createReadyModel(glucoseMeasurements, formattedGlucose) {
  return createDashboardDaySummaryViewModel(
    {
      state: 'ready',
      summary: {
        dayDate: '2026-08-02',
        displayDayLabel: 'Sunday, 2 August 2026',
        glucoseMeasurements,
        medicationDoses: 2,
        totalActivitySeconds: 1800,
        totalCarbohydrateGrams: 120,
        totalInsulinUnits: 12,
        visualizations,
      },
    },
    labels,
    {
      glucose: formattedGlucose,
      totalActivity: '30 mins',
      totalCarbohydrates: '120 g',
      totalInsulin: '12 U',
    },
  );
}

const ruTemplates = {
  few: russianTranslationResource.messages[
    'dashboard.daySummary.metrics.glucoseMeasurements.few'
  ],
  many: russianTranslationResource.messages[
    'dashboard.daySummary.metrics.glucoseMeasurements.many'
  ],
  one: russianTranslationResource.messages[
    'dashboard.daySummary.metrics.glucoseMeasurements.one'
  ],
  other:
    russianTranslationResource.messages[
      'dashboard.daySummary.metrics.glucoseMeasurements.other'
    ],
};

const ukTemplates = {
  few: ukrainianTranslationResource.messages[
    'dashboard.daySummary.metrics.glucoseMeasurements.few'
  ],
  many: ukrainianTranslationResource.messages[
    'dashboard.daySummary.metrics.glucoseMeasurements.many'
  ],
  one: ukrainianTranslationResource.messages[
    'dashboard.daySummary.metrics.glucoseMeasurements.one'
  ],
  other:
    ukrainianTranslationResource.messages[
      'dashboard.daySummary.metrics.glucoseMeasurements.other'
    ],
};

const deTemplates = {
  one: germanTranslationResource.messages[
    'dashboard.daySummary.metrics.glucoseMeasurements.one'
  ],
  other:
    germanTranslationResource.messages[
      'dashboard.daySummary.metrics.glucoseMeasurements.other'
    ],
};

test('glucose metric uses glucoseMeasurements count instead of latest value', () => {
  const model = createReadyModel(3, '3 measurements');

  assert.equal(model.metrics[0]?.value, '3 measurements');
  assert.equal(model.metrics[0]?.value.includes('mmol/L'), false);
});

test('glucose metric no longer shows latest measurement time as secondary text', () => {
  const model = createReadyModel(3, '3 measurements');

  assert.equal(model.metrics[0]?.secondaryText, 'Total for the day');
  assert.equal(model.metrics[0]?.secondaryText?.includes(':'), false);
});

test('ready day summary renders zero glucose measurements without empty state', () => {
  const model = createDashboardDaySummaryViewModel(
    {
      state: 'ready',
      summary: {
        dayDate: '2026-08-02',
        displayDayLabel: 'Sunday, 2 August 2026',
        glucoseMeasurements: 0,
        medicationDoses: 2,
        totalActivitySeconds: 1800,
        totalCarbohydrateGrams: 120,
        totalInsulinUnits: 12,
        visualizations: {
          activity: [{ durationSeconds: 1800 }],
          glucose: [],
          insulin: [{ doseUnits: 12 }],
          nutrition: [{ carbohydratesGrams: 120 }],
        },
      },
    },
    labels,
    {
      glucose: '0 measurements',
      totalActivity: '30 mins',
      totalCarbohydrates: '120 g',
      totalInsulin: '12 U',
    },
  );

  assert.equal(model.state, 'ready');
  assert.equal(model.metrics[0]?.value, '0 measurements');
  assert.equal(model.metrics[0]?.secondaryText, 'No entries today');
});

test('ready day summary renders one glucose measurement', () => {
  const model = createReadyModel(1, '1 measurement');

  assert.equal(model.metrics[0]?.value, '1 measurement');
});

test('ready day summary renders multiple glucose measurements', () => {
  const model = createReadyModel(5, '5 measurements');

  assert.equal(model.metrics[0]?.value, '5 measurements');
});

test('insulin, carbs, and activity metrics remain unchanged', () => {
  const model = createReadyModel(3, '3 measurements');

  assert.equal(model.metrics[1]?.value, '12 U');
  assert.equal(model.metrics[2]?.value, '120 g');
  assert.equal(model.metrics[3]?.value, '30 mins');
});

test('loading, empty, and error states remain unchanged', () => {
  assert.equal(
    createDashboardDaySummaryViewModel({ state: 'loading' }, labels).state,
    'loading',
  );
  assert.equal(
    createDashboardDaySummaryViewModel({ state: 'empty' }, labels).state,
    'empty',
  );
  assert.equal(
    createDashboardDaySummaryViewModel({ state: 'error' }, labels).state,
    'error',
  );
});

test('English singular and plural glucose measurement labels resolve via shared plural infrastructure', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'UTC' },
  });
  const resolved = resolveDashboardDaySummaryLabels(runtime.localization);

  assert.equal(
    resolved.formatGlucoseMeasurementCount(1, String),
    '1 measurement',
  );
  assert.equal(
    resolved.formatGlucoseMeasurementCount(3, String),
    '3 measurements',
  );
});

test('Russian plural glucose measurement labels cover required cases', () => {
  const formatCount = (count) => String(count);

  assert.equal(
    formatPluralMessage(1, ruTemplates, 'ru-RU', formatCount),
    '1 измерение',
  );
  assert.equal(
    formatPluralMessage(2, ruTemplates, 'ru-RU', formatCount),
    '2 измерения',
  );
  assert.equal(
    formatPluralMessage(5, ruTemplates, 'ru-RU', formatCount),
    '5 измерений',
  );
  assert.equal(
    formatPluralMessage(21, ruTemplates, 'ru-RU', formatCount),
    '21 измерение',
  );
  assert.equal(
    formatPluralMessage(22, ruTemplates, 'ru-RU', formatCount),
    '22 измерения',
  );
  assert.equal(
    formatPluralMessage(25, ruTemplates, 'ru-RU', formatCount),
    '25 измерений',
  );
});

test('Ukrainian plural glucose measurement labels cover required cases', () => {
  const formatCount = (count) => String(count);

  assert.equal(
    formatPluralMessage(1, ukTemplates, 'uk-UA', formatCount),
    '1 вимірювання',
  );
  assert.equal(
    formatPluralMessage(2, ukTemplates, 'uk-UA', formatCount),
    '2 вимірювання',
  );
  assert.equal(
    formatPluralMessage(5, ukTemplates, 'uk-UA', formatCount),
    '5 вимірювань',
  );
  assert.equal(
    formatPluralMessage(21, ukTemplates, 'uk-UA', formatCount),
    '21 вимірювання',
  );
  assert.equal(
    formatPluralMessage(22, ukTemplates, 'uk-UA', formatCount),
    '22 вимірювання',
  );
  assert.equal(
    formatPluralMessage(25, ukTemplates, 'uk-UA', formatCount),
    '25 вимірювань',
  );
});

test('German singular and plural glucose measurement labels resolve via shared plural infrastructure', () => {
  const formatCount = (count) => String(count);

  assert.equal(
    formatPluralMessage(1, deTemplates, 'de-DE', formatCount),
    '1 Messung',
  );
  assert.equal(
    formatPluralMessage(3, deTemplates, 'de-DE', formatCount),
    '3 Messungen',
  );
});

test('RU, UK, and DE glucose measurement templates do not fall back to English', () => {
  for (const [localeLabel, templates] of [
    ['ru-RU', ruTemplates],
    ['uk-UA', ukTemplates],
    ['de-DE', deTemplates],
  ]) {
    for (const template of Object.values(templates)) {
      assert.equal(template.includes('measurement'), false, localeLabel);
      assert.equal(template.includes('Measurement'), false, localeLabel);
    }
  }
});
