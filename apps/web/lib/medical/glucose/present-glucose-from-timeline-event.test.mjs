import assert from 'node:assert/strict';
import test from 'node:test';

import { liftLegacyTestFixtures } from '../../timeline/testing/lift-legacy-test-fixtures.ts';
import { createTestTimelinePresentationDependencies } from '../../timeline/presentation/testing/create-test-timeline-presentation-dependencies.ts';
import { presentGlucoseFromTimelineEvent } from './present-glucose-from-timeline-event.ts';

const [glucoseEvent] = liftLegacyTestFixtures([
  {
    context: 'Before meal',
    dateTime: '2026-08-02T07:15:00.000Z',
    id: 'glucose-range-test',
    kind: 'glucose',
    title: 'Glucose',
    value: '7.3 mmol/L',
  },
]);

let dependencies;

test.before(async () => {
  dependencies = await createTestTimelinePresentationDependencies({
    glucoseDisplayUnit: 'mmol_per_l',
    referenceTime: '2026-08-02T10:00:00.000Z',
    targetRange: {
      highMmolPerL: 8,
      lowMmolPerL: 4,
      source: 'user_defined',
    },
  });
});

test('presentGlucoseFromTimelineEvent classifies in-range readings with user target', () => {
  const presentation = presentGlucoseFromTimelineEvent({
    event: glucoseEvent,
    formatter: dependencies.formatter,
    glucoseDisplayUnit: dependencies.glucoseDisplayUnit,
    glucoseKindLabel: dependencies.labels.eventKinds.glucose,
    localization: dependencies.localization,
    referenceTime: dependencies.referenceTime,
    targetRange: dependencies.targetRange,
  });

  assert.equal(presentation.model.rangeState, 'in_range');
  assert.equal(presentation.rangeLabel, 'In your range');
  assert.equal(presentation.model.canonicalMmolPerL, 7.3);
});

test('presentGlucoseFromTimelineEvent omits range label without user target', () => {
  const presentation = presentGlucoseFromTimelineEvent({
    event: glucoseEvent,
    formatter: dependencies.formatter,
    glucoseDisplayUnit: dependencies.glucoseDisplayUnit,
    glucoseKindLabel: dependencies.labels.eventKinds.glucose,
    localization: dependencies.localization,
    referenceTime: dependencies.referenceTime,
    targetRange: null,
  });

  assert.equal(presentation.model.rangeState, 'unknown');
  assert.equal(presentation.rangeLabel, null);
});

test('presentGlucoseFromTimelineEvent preserves canonical mmol/L on mg/dL display', () => {
  const presentation = presentGlucoseFromTimelineEvent({
    event: glucoseEvent,
    formatter: dependencies.formatter,
    glucoseDisplayUnit: 'mg_per_dl',
    glucoseKindLabel: dependencies.labels.eventKinds.glucose,
    localization: dependencies.localization,
    referenceTime: dependencies.referenceTime,
    targetRange: null,
  });

  assert.equal(glucoseEvent.concentrationMmolPerL, 7.3);
  assert.equal(presentation.model.canonicalMmolPerL, 7.3);
  assert.equal(presentation.value, '132');
});
