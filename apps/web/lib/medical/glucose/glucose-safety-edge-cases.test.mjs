import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { selectLatestEligibleGlucoseTimelineEvent } from './select-latest-eligible-glucose-timeline-event.ts';
import { resolveGlucoseFreshnessPolicyForTimelineSource } from './resolve-glucose-freshness-policy-for-timeline-source.ts';

const dashboardLastGlucoseSource = readFileSync(
  fileURLToPath(
    new URL(
      '../../../components/dashboard/dashboard-last-glucose.tsx',
      import.meta.url,
    ),
  ),
  'utf8',
);

function createGlucoseEvent(overrides = {}) {
  return {
    concentrationMmolPerL: 6.2,
    context: 'other',
    createdAt: '2026-01-01T10:05:00.000Z',
    id: 'glucose-1',
    kind: 'glucose',
    occurredAt: '2026-01-01T10:00:00.000Z',
    schemaVersion: 1,
    source: 'manual',
    updatedAt: '2026-01-01T10:05:00.000Z',
    ...overrides,
  };
}

test('dashboard last glucose no longer uses legacy freshness policy constant', () => {
  assert.doesNotMatch(
    dashboardLastGlucoseSource,
    /DASHBOARD_LEGACY_FRESHNESS_POLICY/,
  );
  assert.match(dashboardLastGlucoseSource, /presentGlucoseFromTimelineEvent/);
});

test('timeline source manual resolves manual recency policy', () => {
  const policy = resolveGlucoseFreshnessPolicyForTimelineSource('manual');

  assert.equal(policy.recentWithinMs, 24 * 60 * 60 * 1000);
  assert.equal(policy.currentWithinMs, 15 * 60 * 1000);
});

test('timeline device without provenance uses conservative fallback policy', () => {
  const policy = resolveGlucoseFreshnessPolicyForTimelineSource('device');

  assert.equal(policy.recentWithinMs, 12 * 60 * 60 * 1000);
});

test('selectLatestEligibleGlucoseTimelineEvent excludes future suspect readings', () => {
  const selected = selectLatestEligibleGlucoseTimelineEvent(
    [
      createGlucoseEvent({
        concentrationMmolPerL: 6.0,
        id: 'valid',
        occurredAt: '2026-01-01T10:00:00.000Z',
      }),
      createGlucoseEvent({
        concentrationMmolPerL: 9.0,
        id: 'future',
        occurredAt: '2026-01-01T15:00:00.000Z',
      }),
    ],
    { referenceTime: '2026-01-01T12:00:00.000Z' },
  );

  assert.equal(selected?.id, 'valid');
});

test('selectLatestEligibleGlucoseTimelineEvent maps occurredAt to measuredAt', () => {
  const selected = selectLatestEligibleGlucoseTimelineEvent(
    [
      createGlucoseEvent({
        id: 'newer',
        occurredAt: '2026-01-01T11:00:00.000Z',
      }),
      createGlucoseEvent({
        id: 'older',
        occurredAt: '2026-01-01T09:00:00.000Z',
      }),
    ],
    { referenceTime: '2026-01-01T12:00:00.000Z' },
  );

  assert.equal(selected?.id, 'newer');
});

test('selectLatestEligibleGlucoseTimelineEvent honors deletedAt metadata when provided', () => {
  const selected = selectLatestEligibleGlucoseTimelineEvent(
    [
      createGlucoseEvent({
        id: 'deleted-newer',
        occurredAt: '2026-01-01T11:00:00.000Z',
      }),
      createGlucoseEvent({
        id: 'active-older',
        occurredAt: '2026-01-01T09:00:00.000Z',
      }),
    ],
    {
      deletedAtByEventId: {
        'deleted-newer': '2026-01-01T11:30:00.000Z',
      },
      referenceTime: '2026-01-01T12:00:00.000Z',
    },
  );

  assert.equal(selected?.id, 'active-older');
});
