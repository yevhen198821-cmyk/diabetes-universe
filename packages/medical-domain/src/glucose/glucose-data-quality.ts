import type { GlucoseDataQualityState } from './glucose-semantics';

function parseTimestamp(value: string): number | null {
  const timestamp = Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    return null;
  }

  return timestamp;
}

export interface ResolveGlucoseDataQualityStateInput {
  readonly concentrationMmolPerL: number;
  readonly measuredAt: string;
  readonly referenceTime?: Date | string;
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

  const measuredAtMs = parseTimestamp(measuredAt);

  if (measuredAtMs === null) {
    return 'invalid';
  }

  if (input.referenceTime !== undefined) {
    const referenceMs =
      input.referenceTime instanceof Date
        ? input.referenceTime.getTime()
        : parseTimestamp(input.referenceTime);

    if (referenceMs !== null && measuredAtMs > referenceMs) {
      return 'questionable';
    }
  }

  return 'valid';
}
