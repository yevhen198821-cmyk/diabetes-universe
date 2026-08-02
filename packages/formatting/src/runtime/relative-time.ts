const MS_PER_SECOND = 1_000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

export type RelativeTimeUnit = 'second' | 'minute' | 'hour' | 'day';

/**
 * Selects the coarsest unit whose threshold still contains the absolute
 * difference:
 *
 * - less than 60 seconds -> second
 * - less than 60 minutes -> minute
 * - less than 24 hours -> hour
 * - otherwise -> day
 */
export function selectRelativeTimeUnit(absDiffMs: number): RelativeTimeUnit {
  const absSeconds = absDiffMs / MS_PER_SECOND;

  if (absSeconds < 60) {
    return 'second';
  }

  const absMinutes = absDiffMs / MS_PER_MINUTE;

  if (absMinutes < 60) {
    return 'minute';
  }

  const absHours = absDiffMs / MS_PER_HOUR;

  if (absHours < 24) {
    return 'hour';
  }

  return 'day';
}

/**
 * Relative value algorithm:
 *
 * 1. diffMs = valueMs - referenceMs
 * 2. Convert diffMs to the selected unit quotient
 * 3. Apply Math.trunc toward zero to obtain a signed integer
 *
 * Past instants produce negative values. Future instants produce positive values.
 */
export function calculateRelativeTimeValue(
  valueMs: number,
  referenceMs: number,
  unit: RelativeTimeUnit,
): number {
  const diffMs = valueMs - referenceMs;

  switch (unit) {
    case 'second':
      return Math.trunc(diffMs / MS_PER_SECOND);
    case 'minute':
      return Math.trunc(diffMs / MS_PER_MINUTE);
    case 'hour':
      return Math.trunc(diffMs / MS_PER_HOUR);
    case 'day':
      return Math.trunc(diffMs / MS_PER_DAY);
  }
}
