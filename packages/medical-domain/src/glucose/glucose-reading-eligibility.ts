import { resolveGlucoseDataQualityState } from './glucose-data-quality';
import { resolveGlucoseTimestampQuality } from './glucose-timestamp-quality';

export interface GlucoseReadingEligibilityInput {
  readonly concentrationMmolPerL: number;
  readonly measuredAt: string;
  readonly deletedAt?: string | null;
}

export interface ResolveGlucoseReadingEligibilityInput extends GlucoseReadingEligibilityInput {
  readonly referenceTime: Date | string;
}

function hasDeletionMarker(deletedAt: string | null | undefined): boolean {
  if (deletedAt === null || deletedAt === undefined) {
    return false;
  }

  return deletedAt.trim().length > 0;
}

/**
 * Determines whether a glucose reading may be selected as Dashboard latest.
 *
 * Timeline/history may still display readings that are not latest-eligible.
 */
export function isGlucoseReadingEligibleForLatest(
  input: ResolveGlucoseReadingEligibilityInput,
): boolean {
  if (hasDeletionMarker(input.deletedAt)) {
    return false;
  }

  const dataQuality = resolveGlucoseDataQualityState({
    concentrationMmolPerL: input.concentrationMmolPerL,
    measuredAt: input.measuredAt,
    referenceTime: input.referenceTime,
  });

  if (dataQuality !== 'valid') {
    return false;
  }

  const timestampQuality = resolveGlucoseTimestampQuality({
    measuredAt: input.measuredAt,
    referenceTime: input.referenceTime,
  });

  return timestampQuality === 'valid';
}
