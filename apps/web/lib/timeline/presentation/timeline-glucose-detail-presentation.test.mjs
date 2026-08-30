import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveTimelineEventSourcePresentation } from '../../../components/timeline/timeline-ui-labels.ts';
import { liftLegacyTestFixtures } from '../testing/lift-legacy-test-fixtures.ts';
import { mapTimelineEventDetailPresentation } from './timeline-presentation-mapper.ts';
import { createTestTimelinePresentationDependencies } from './testing/create-test-timeline-presentation-dependencies.ts';

const [glucoseEvent, insulinEvent] = liftLegacyTestFixtures([
  {
    context: 'Before meal',
    dateTime: '2026-08-02T07:15:00.000Z',
    id: 'glucose-detail',
    kind: 'glucose',
    title: 'Glucose',
    value: '7.3 mmol/L',
  },
  {
    dateTime: '2026-08-02T05:05:00.000Z',
    id: 'insulin-detail',
    kind: 'insulin',
    title: 'NovoRapid',
    value: '4 U',
  },
]);

let targetDependencies;
let noTargetDependencies;

test.before(async () => {
  targetDependencies = await createTestTimelinePresentationDependencies({
    glucoseDisplayUnit: 'mmol_per_l',
    referenceTime: '2026-08-02T10:00:00.000Z',
    targetRange: {
      highMmolPerL: 8,
      lowMmolPerL: 4,
      source: 'user_defined',
    },
  });
  noTargetDependencies = await createTestTimelinePresentationDependencies({
    glucoseDisplayUnit: 'mmol_per_l',
    referenceTime: '2026-08-02T10:00:00.000Z',
    targetRange: null,
  });
});

function createGlucoseEvent(concentrationMmolPerL, dateTime, id, options = {}) {
  const [event] = liftLegacyTestFixtures([
    {
      dateTime,
      id,
      kind: 'glucose',
      title: 'Glucose',
      value: `${concentrationMmolPerL} mmol/L`,
      ...options,
    },
  ]);

  return event;
}

test('in-range glucose detail exposes range and current-target qualifier', () => {
  const detail = mapTimelineEventDetailPresentation(
    glucoseEvent,
    targetDependencies,
  );

  assert.deepEqual(detail.statusLines, [
    'In your range',
    'Current target range',
  ]);
  assert.equal(detail.primaryText, '7.3 mmol/L');
  assert.equal(detail.occurredAt, '2026-08-02T07:15:00.000Z');
});

test('below-range glucose detail exposes below label and qualifier', () => {
  const belowEvent = createGlucoseEvent(
    3.5,
    '2026-08-02T07:15:00.000Z',
    'glucose-detail-below',
  );
  const detail = mapTimelineEventDetailPresentation(
    belowEvent,
    targetDependencies,
  );

  assert.deepEqual(detail.statusLines, [
    'Below your range',
    'Current target range',
  ]);
});

test('above-range glucose detail exposes above label and qualifier', () => {
  const aboveEvent = createGlucoseEvent(
    8.1,
    '2026-08-02T07:15:00.000Z',
    'glucose-detail-above',
  );
  const detail = mapTimelineEventDetailPresentation(
    aboveEvent,
    targetDependencies,
  );

  assert.deepEqual(detail.statusLines, [
    'Above your range',
    'Current target range',
  ]);
});

test('no-target glucose detail omits range and qualifier', () => {
  const detail = mapTimelineEventDetailPresentation(
    glucoseEvent,
    noTargetDependencies,
  );

  assert.equal(detail.statusLines, undefined);
  assert.equal(detail.primaryText, '7.3 mmol/L');
});

test('questionable timestamp glucose detail preserves warning and suppresses range', () => {
  const futureEvent = createGlucoseEvent(
    7.3,
    '2026-08-02T20:00:00.000Z',
    'glucose-detail-future',
  );
  const detail = mapTimelineEventDetailPresentation(
    futureEvent,
    targetDependencies,
  );

  assert.deepEqual(detail.statusLines, ['Check measurement time']);
  assert.equal(detail.primaryText, '7.3 mmol/L');
  assert.equal(detail.occurredAt, '2026-08-02T20:00:00.000Z');
});

test('glucose detail preserves canonical occurredAt for semantic time', () => {
  const detail = mapTimelineEventDetailPresentation(
    glucoseEvent,
    targetDependencies,
  );

  assert.equal(detail.occurredAt, '2026-08-02T07:15:00.000Z');
});

test('insulin detail presentation remains unchanged by glucose history fields', () => {
  const detail = mapTimelineEventDetailPresentation(
    insulinEvent,
    targetDependencies,
  );

  assert.equal(detail.statusLines, undefined);
  assert.equal(detail.title, 'NovoRapid');
  assert.equal(detail.primaryText, '4 U');
  assert.equal(detail.occurredAt, '2026-08-02T05:05:00.000Z');
});

test('timeline detail source presentation remains unchanged', () => {
  const sourceLabels = {
    demo: 'Demo data',
    device: 'Device',
    import: 'Import',
    manual: 'Manual entry',
  };

  assert.deepEqual(
    resolveTimelineEventSourcePresentation('manual', sourceLabels),
    {
      isDemo: false,
      label: 'Manual entry',
    },
  );
  assert.deepEqual(
    resolveTimelineEventSourcePresentation('demo', sourceLabels),
    {
      isDemo: true,
      label: 'Demo data',
    },
  );
});
