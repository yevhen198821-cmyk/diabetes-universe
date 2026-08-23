import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveDashboardMedicalEventSourceLabel } from '../../lib/dashboard/dashboard-event-source-labels.ts';
import { createDashboardLastGlucoseViewModel } from './dashboard-last-glucose-model.ts';

const labels = {
  defaultEmpty: 'No measurements yet.',
  defaultError: 'Could not load the last measurement.',
  eyebrow: 'Last measurement',
  loading: 'Loading last glucose measurement',
  stale: 'Measurement is outdated.',
  title: 'Last glucose',
  unavailable: 'Last measurement unavailable.',
};

test('stale ready measurement exposes non-color stale message', () => {
  const model = createDashboardLastGlucoseViewModel(
    {
      glucose: {
        displayTime: '08:00',
        event: {
          concentrationMmolPerL: 6.4,
          context: 'fasting',
          id: 'glucose-1',
          kind: 'glucose',
          occurredAt: '2026-07-30T08:00:00.000Z',
          source: 'manual',
        },
      },
      referenceTime: new Date('2026-08-02T10:00:00.000Z'),
      state: 'ready',
    },
    labels,
    {
      formattedValue: '6.4 mmol/L',
      sourceLabel: 'Manual entry',
    },
  );

  assert.equal(model.state, 'ready');
  assert.equal(model.isStale, true);
  assert.equal(model.staleMessage, labels.stale);
  assert.equal(model.sourceLabel, 'Manual entry');
});

test('resolveDashboardMedicalEventSourceLabel excludes demo provenance', () => {
  const localization = {
    translate({ key }) {
      const values = {
        'dashboard.lastGlucose.source.manual': 'Manual entry',
        'dashboard.lastGlucose.source.device': 'Device',
        'dashboard.lastGlucose.source.import': 'Import',
      };

      return { value: values[key] ?? key };
    },
  };

  assert.equal(
    resolveDashboardMedicalEventSourceLabel(localization, 'manual'),
    'Manual entry',
  );
  assert.equal(
    resolveDashboardMedicalEventSourceLabel(localization, 'demo'),
    null,
  );
  assert.equal(
    resolveDashboardMedicalEventSourceLabel(localization, undefined),
    null,
  );
});
