import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveTimelineEventSourcePresentation } from './resolve-timeline-event-source-presentation.ts';

const sourceLabels = {
  demo: 'Demo data',
  device: 'Device',
  import: 'Import',
  manual: 'Manual entry',
};

test('source resolver maps manual, device, import, and demo without change', () => {
  assert.deepEqual(
    resolveTimelineEventSourcePresentation('manual', sourceLabels),
    { isDemo: false, label: 'Manual entry' },
  );
  assert.deepEqual(
    resolveTimelineEventSourcePresentation('device', sourceLabels),
    { isDemo: false, label: 'Device' },
  );
  assert.deepEqual(
    resolveTimelineEventSourcePresentation('import', sourceLabels),
    { isDemo: false, label: 'Import' },
  );
  assert.deepEqual(
    resolveTimelineEventSourcePresentation('demo', sourceLabels),
    { isDemo: true, label: 'Demo data' },
  );
  assert.equal(
    resolveTimelineEventSourcePresentation(undefined, sourceLabels),
    null,
  );
});
