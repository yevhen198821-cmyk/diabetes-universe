import {
  GLUCOSE_FUTURE_CLOCK_SKEW_TOLERANCE_MS,
  parseGlucoseTimestampMs,
} from './glucose-clock-tolerance';
import type { GlucoseFreshnessState } from './glucose-semantics';

/**
 * Explicit freshness thresholds supplied by a caller or product policy.
 *
 * No universal clinical defaults are embedded here.
 */
export interface GlucoseFreshnessPolicy {
  /**
   * Maximum age in milliseconds for `current` when other gates pass.
   */
  readonly currentWithinMs: number | null;

  /**
   * Maximum age in milliseconds for `recent` when older than `current` but
   * still within this bound.
   */
  readonly recentWithinMs: number | null;
}

export interface ResolveGlucoseFreshnessStateInput {
  readonly measuredAt: string;
  readonly referenceTime: Date | string;
  readonly policy: GlucoseFreshnessPolicy | null | undefined;
  readonly futureToleranceMs?: number;
}

/**
 * Resolves freshness from measured/occurred time and an explicit policy.
 *
 * Future timestamps never resolve to `current`. Missing or invalid policy input
 * resolves to `unknown`.
 */
export function resolveGlucoseFreshnessState(
  input: ResolveGlucoseFreshnessStateInput,
): GlucoseFreshnessState {
  const measuredAtMs = parseGlucoseTimestampMs(input.measuredAt);
  const referenceMs = parseGlucoseTimestampMs(input.referenceTime);

  if (measuredAtMs === null || referenceMs === null) {
    return 'unknown';
  }

  const toleranceMs =
    input.futureToleranceMs ?? GLUCOSE_FUTURE_CLOCK_SKEW_TOLERANCE_MS;

  if (measuredAtMs > referenceMs + toleranceMs) {
    return 'unknown';
  }

  const policy = input.policy;

  if (
    !policy ||
    (policy.currentWithinMs === null && policy.recentWithinMs === null)
  ) {
    return 'unknown';
  }

  const ageMs = Math.max(0, referenceMs - measuredAtMs);

  if (policy.currentWithinMs !== null && ageMs <= policy.currentWithinMs) {
    return 'current';
  }

  if (policy.recentWithinMs !== null && ageMs <= policy.recentWithinMs) {
    return 'recent';
  }

  if (policy.currentWithinMs !== null || policy.recentWithinMs !== null) {
    return 'old';
  }

  return 'unknown';
}
