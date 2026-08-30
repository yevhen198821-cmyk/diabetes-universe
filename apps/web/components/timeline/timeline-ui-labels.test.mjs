import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveTimelineEventSourcePresentation } from '../../lib/timeline/presentation/resolve-timeline-event-source-presentation.ts';
import {
  formatTimelineDayPeriodEventCount,
  formatTimelineEventsOfDayClusterAriaLabel,
  formatTimelineLoadMoreAnnouncement,
  formatTimelineToolbarResultLabel,
} from './timeline-ui-labels.ts';

const eventCountLabels = {
  few: '{count} events',
  many: '{count} events',
  one: '{count} event',
  other: '{count} events',
};

const ruEventCountLabels = {
  few: '{count} события',
  many: '{count} событий',
  one: '{count} событие',
  other: '{count} событий',
};

const toolbarLabels = {
  eventCount: eventCountLabels,
  noMatches: 'No matches found',
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
    { hasActiveSearchOrCategoryCriteria: true, resultCount: 0 },
    'en-GB',
    String,
  );

  assert.equal(label, 'No matches found');
});

test('formatTimelineToolbarResultLabel pluralizes English event counts', () => {
  assert.equal(
    formatTimelineToolbarResultLabel(
      toolbarLabels,
      { hasActiveSearchOrCategoryCriteria: false, resultCount: 0 },
      'en-GB',
      String,
    ),
    '0 events',
  );
  assert.equal(
    formatTimelineToolbarResultLabel(
      toolbarLabels,
      { hasActiveSearchOrCategoryCriteria: false, resultCount: 1 },
      'en-GB',
      String,
    ),
    '1 event',
  );
  assert.equal(
    formatTimelineToolbarResultLabel(
      toolbarLabels,
      { hasActiveSearchOrCategoryCriteria: false, resultCount: 2 },
      'en-GB',
      String,
    ),
    '2 events',
  );
});

test('formatTimelineDayPeriodEventCount uses the shared pluralization mechanism', () => {
  assert.equal(
    formatTimelineDayPeriodEventCount(21, ruEventCountLabels, 'ru-RU', String),
    '21 событие',
  );
  assert.equal(
    formatTimelineDayPeriodEventCount(5, ruEventCountLabels, 'ru-RU', String),
    '5 событий',
  );
});

test('formatTimelineEventsOfDayClusterAriaLabel pluralizes cluster labels', () => {
  const clusterLabels = {
    few: '{count} events close together',
    many: '{count} events close together',
    one: '{count} event close together',
    other: '{count} events close together',
  };

  assert.equal(
    formatTimelineEventsOfDayClusterAriaLabel(
      1,
      clusterLabels,
      'en-GB',
      String,
    ),
    '1 event close together',
  );
  assert.equal(
    formatTimelineEventsOfDayClusterAriaLabel(
      3,
      clusterLabels,
      'en-GB',
      String,
    ),
    '3 events close together',
  );
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
