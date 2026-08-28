import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveGlucoseFreshnessState } from './glucose-freshness-policy.ts';

const referenceTime = '2026-01-01T12:00:00.000Z';
const policy = {
  currentWithinMs: 60 * 60 * 1000,
  recentWithinMs: 24 * 60 * 60 * 1000,
};

test('resolveGlucoseFreshnessState resolves current within explicit policy', () => {
  assert.equal(
    resolveGlucoseFreshnessState({
      measuredAt: '2026-01-01T11:30:00.000Z',
      policy,
      referenceTime,
    }),
    'current',
  );
});

test('resolveGlucoseFreshnessState resolves recent within explicit policy', () => {
  assert.equal(
    resolveGlucoseFreshnessState({
      measuredAt: '2026-01-01T02:00:00.000Z',
      policy,
      referenceTime,
    }),
    'recent',
  );
});

test('resolveGlucoseFreshnessState resolves old beyond recent threshold', () => {
  assert.equal(
    resolveGlucoseFreshnessState({
      measuredAt: '2025-12-30T12:00:00.000Z',
      policy,
      referenceTime,
    }),
    'old',
  );
});

test('resolveGlucoseFreshnessState returns unknown without policy', () => {
  assert.equal(
    resolveGlucoseFreshnessState({
      measuredAt: '2026-01-01T11:30:00.000Z',
      policy: null,
      referenceTime,
    }),
    'unknown',
  );
});

test('resolveGlucoseFreshnessState returns unknown for invalid timestamp', () => {
  assert.equal(
    resolveGlucoseFreshnessState({
      measuredAt: 'not-a-date',
      policy,
      referenceTime,
    }),
    'unknown',
  );
});

test('resolveGlucoseFreshnessState never resolves future timestamps as current', () => {
  assert.equal(
    resolveGlucoseFreshnessState({
      measuredAt: '2026-01-01T12:30:00.000Z',
      policy,
      referenceTime,
    }),
    'unknown',
  );
});
