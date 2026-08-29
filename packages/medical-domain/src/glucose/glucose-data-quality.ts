import {
  GLUCOSE_FUTURE_CLOCK_SKEW_TOLERANCE_MS,
  isGlucoseMeasuredAtBeyondFutureTolerance,
  parseGlucoseTimestampMs,
} from './glucose-clock-tolerance';
import type { GlucoseDataQualityState } from './glucose-semantics';

export interface ResolveGlucoseDataQualityStateInput {
  readonly concentrationMmolPerL: number;
  readonly measuredAt: string;
  readonly referenceTime?: Date | string;
  readonly futureToleranceMs?: number;
}

/**
 * Resolves technical data quality for a glucose reading.
 *
 * This is not a clinical range assessment.
 */
export function resolveGlucoseDataQualityState(
  input: ResolveGlucoseDataQualityStateInput,
): GlucoseDataQualityState {
  if (!Number.isFinite(input.concentrationMmolPerL)) {
    return 'invalid';
  }

  const measuredAt = input.measuredAt.trim();

  if (measuredAt.length === 0) {
    return 'unknown';
  }

  const measuredAtMs = parseGlucoseTimestampMs(measuredAt);

  if (measuredAtMs === null) {
    return 'invalid';
  }

  if (input.referenceTime !== undefined) {
    const toleranceMs =
      input.futureToleranceMs ?? GLUCOSE_FUTURE_CLOCK_SKEW_TOLERANCE_MS;

    if (
      isGlucoseMeasuredAtBeyondFutureTolerance(
        measuredAt,
        input.referenceTime,
        toleranceMs,
      )
    ) {
      return 'questionable';
    }
  }

  return 'valid';
}
