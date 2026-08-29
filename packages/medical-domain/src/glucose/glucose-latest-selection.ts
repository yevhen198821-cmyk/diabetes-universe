import { parseGlucoseTimestampMs } from './glucose-clock-tolerance';
import {
  isGlucoseReadingEligibleForLatest,
  type GlucoseReadingEligibilityInput,
} from './glucose-reading-eligibility';

export interface GlucoseLatestSelectionReading extends GlucoseReadingEligibilityInput {
  readonly id: string;
  readonly recordedAt?: string | null;
}

export interface SelectLatestEligibleGlucoseReadingInput<
  TReading extends GlucoseLatestSelectionReading,
> {
  readonly readings: readonly TReading[];
  readonly referenceTime: Date | string;
}

function compareLatestEligibleReadings<
  TReading extends GlucoseLatestSelectionReading,
>(left: TReading, right: TReading): number {
  const leftMeasuredAtMs = parseGlucoseTimestampMs(left.measuredAt) ?? 0;
  const rightMeasuredAtMs = parseGlucoseTimestampMs(right.measuredAt) ?? 0;

  if (leftMeasuredAtMs !== rightMeasuredAtMs) {
    return leftMeasuredAtMs - rightMeasuredAtMs;
  }

  const leftRecordedAtMs =
    left.recordedAt === null || left.recordedAt === undefined
      ? null
      : parseGlucoseTimestampMs(left.recordedAt);
  const rightRecordedAtMs =
    right.recordedAt === null || right.recordedAt === undefined
      ? null
      : parseGlucoseTimestampMs(right.recordedAt);

  if (
    leftRecordedAtMs !== null &&
    rightRecordedAtMs !== null &&
    leftRecordedAtMs !== rightRecordedAtMs
  ) {
    return leftRecordedAtMs - rightRecordedAtMs;
  }

  return left.id.localeCompare(right.id);
}

/**
 * Selects the latest eligible glucose reading by measuredAt.
 *
 * Tie-break order (non-clinical):
 * 1. measuredAt
 * 2. recordedAt when both readings provide it
 * 3. stable id
 */
export function selectLatestEligibleGlucoseReading<
  TReading extends GlucoseLatestSelectionReading,
>(input: SelectLatestEligibleGlucoseReadingInput<TReading>): TReading | null {
  const eligible = input.readings.filter((reading) =>
    isGlucoseReadingEligibleForLatest({
      concentrationMmolPerL: reading.concentrationMmolPerL,
      deletedAt: reading.deletedAt,
      measuredAt: reading.measuredAt,
      referenceTime: input.referenceTime,
    }),
  );

  if (eligible.length === 0) {
    return null;
  }

  return [...eligible].sort(compareLatestEligibleReadings).at(-1) ?? null;
}
