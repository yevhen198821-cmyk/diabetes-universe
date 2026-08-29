import {
  GLUCOSE_FUTURE_CLOCK_SKEW_TOLERANCE_MS,
  isGlucoseMeasuredAtBeyondFutureTolerance,
  parseGlucoseTimestampMs,
} from './glucose-clock-tolerance';

export type GlucoseTimestampQualityState =
  'valid' | 'suspect_future' | 'invalid';

export interface ResolveGlucoseTimestampQualityInput {
  readonly measuredAt: string;
  readonly referenceTime: Date | string;
  readonly toleranceMs?: number;
}

/**
 * Technical timestamp quality for glucose readings.
 *
 * Distinct from data-quality and range state. Suspect-future timestamps must
 * not become Dashboard latest selections.
 */
export function resolveGlucoseTimestampQuality(
  input: ResolveGlucoseTimestampQualityInput,
): GlucoseTimestampQualityState {
  const measuredAt = input.measuredAt.trim();

  if (measuredAt.length === 0 || parseGlucoseTimestampMs(measuredAt) === null) {
    return 'invalid';
  }

  const toleranceMs =
    input.toleranceMs ?? GLUCOSE_FUTURE_CLOCK_SKEW_TOLERANCE_MS;

  if (
    isGlucoseMeasuredAtBeyondFutureTolerance(
      measuredAt,
      input.referenceTime,
      toleranceMs,
    )
  ) {
    return 'suspect_future';
  }

  return 'valid';
}
