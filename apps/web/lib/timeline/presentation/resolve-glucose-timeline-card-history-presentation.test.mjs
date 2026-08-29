import assert from 'node:assert/strict';
import test from 'node:test';

import { createTestTimelinePresentationDependencies } from './testing/create-test-timeline-presentation-dependencies.ts';
import { resolveGlucoseTimelineCardHistoryPresentation } from './resolve-glucose-timeline-card-history-presentation.ts';

let dependencies;

test.before(async () => {
  dependencies = await createTestTimelinePresentationDependencies({
    targetRange: {
      highMmolPerL: 10,
      lowMmolPerL: 4,
      source: 'user_defined',
    },
  });
});

test('shows range label and current-range qualifier when range is available', () => {
  const presentation = resolveGlucoseTimelineCardHistoryPresentation({
    dependencies,
    rangeLabel: 'In your range',
    timestampUncertaintyLabel: null,
  });

  assert.deepEqual(presentation.statusLines, [
    'In your range',
    'Current target range',
  ]);
  assert.equal(presentation.rangeBasisLabel, 'Current target range');
});

test('shows timestamp uncertainty without range or current-range qualifier', () => {
  const presentation = resolveGlucoseTimelineCardHistoryPresentation({
    dependencies,
    rangeLabel: 'In your range',
    timestampUncertaintyLabel: 'Check measurement time',
  });

  assert.deepEqual(presentation.statusLines, ['Check measurement time']);
  assert.equal(presentation.rangeLabel, null);
  assert.equal(presentation.rangeBasisLabel, null);
});

test('returns empty status lines without target range label', () => {
  const presentation = resolveGlucoseTimelineCardHistoryPresentation({
    dependencies,
    rangeLabel: null,
    timestampUncertaintyLabel: null,
  });

  assert.deepEqual(presentation.statusLines, []);
});
