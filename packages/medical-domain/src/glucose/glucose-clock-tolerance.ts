/**
 * Technical clock-skew tolerance for glucose timestamp evaluation.
 *
 * This is NOT a clinical threshold. It allows small device/client clock drift
 * without marking an otherwise valid measurement as suspect.
 */
export const GLUCOSE_FUTURE_CLOCK_SKEW_TOLERANCE_MS = 5 * 60 * 1000;

export function parseGlucoseTimestampMs(value: string | Date): number | null {
  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    return null;
  }

  return timestamp;
}

/**
 * Returns how far measuredAt is ahead of referenceTime in milliseconds.
 *
 * Negative values mean measuredAt is in the past relative to referenceTime.
 */
export function resolveGlucoseFutureOffsetMs(
  measuredAt: string | Date,
  referenceTime: string | Date,
): number | null {
  const measuredAtMs = parseGlucoseTimestampMs(measuredAt);
  const referenceMs = parseGlucoseTimestampMs(referenceTime);

  if (measuredAtMs === null || referenceMs === null) {
    return null;
  }

  return measuredAtMs - referenceMs;
}

export function isGlucoseMeasuredAtBeyondFutureTolerance(
  measuredAt: string | Date,
  referenceTime: string | Date,
  toleranceMs: number = GLUCOSE_FUTURE_CLOCK_SKEW_TOLERANCE_MS,
): boolean {
  const futureOffsetMs = resolveGlucoseFutureOffsetMs(
    measuredAt,
    referenceTime,
  );

  if (futureOffsetMs === null) {
    return true;
  }

  return futureOffsetMs > toleranceMs;
}
