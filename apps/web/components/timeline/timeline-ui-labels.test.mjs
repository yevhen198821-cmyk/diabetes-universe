import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatTimelineLoadMoreAnnouncement,
  formatTimelineToolbarResultLabel,
  resolveTimelineEventSourcePresentation,
} from './timeline-ui-labels.ts';

const toolbarLabels = {
  eventCount: '{count} events',
  foundCount: 'Found: {count}',
  noMatches: 'No matches found',
  reset: 'Reset filters',
  title: 'Timeline search and filters',
};

const sourceLabels = {
  demo: 'Demo data',
  device: 'Device',
  import: 'Import',
  manual: 'Manual entry',
};

test('formatTimelineToolbarResultLabel reports no matches for filtered empty', () => {
  const label = formatTimelineToolbarResultLabel(
    toolbarLabels,
    { hasActiveCriteria: true, resultCount: 0 },
    String,
  );

  assert.equal(label, 'No matches found');
});

test('resolveTimelineEventSourcePresentation marks demo separately from medical sources', () => {
  assert.deepEqual(
    resolveTimelineEventSourcePresentation('manual', sourceLabels),
    { isDemo: false, label: 'Manual entry' },
  );
  assert.deepEqual(
    resolveTimelineEventSourcePresentation('demo', sourceLabels),
    {
      isDemo: true,
      label: 'Demo data',
    },
  );
  assert.equal(
    resolveTimelineEventSourcePresentation(undefined, sourceLabels),
    null,
  );
});

test('formatTimelineLoadMoreAnnouncement substitutes count', () => {
  assert.equal(
    formatTimelineLoadMoreAnnouncement(
      'Showing {count} more events',
      3,
      String,
    ),
    'Showing 3 more events',
  );
});
