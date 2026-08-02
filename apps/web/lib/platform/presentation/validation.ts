import type { HourCycle } from '@diabetes-universe/i18n';

import { isValidIanaTimeZone } from '../is-valid-iana-time-zone';
import type { PresentationContext } from './presentation-context';
import {
  PRESENTATION_SNAPSHOT_VERSION,
  type PresentationSnapshot,
} from './presentation-snapshot';

const HOUR_CYCLES = new Set<HourCycle>(['h12', 'h23']);

/**
 * Validates an IANA time zone identifier without deriving it from locale.
 */
function isValidPresentationTimeZone(timeZone: string): boolean {
  return isValidIanaTimeZone(timeZone);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidHourCycle(value: unknown): value is HourCycle {
  return typeof value === 'string' && HOUR_CYCLES.has(value as HourCycle);
}

export function assertValidPresentationContext(
  context: PresentationContext,
): void {
  if (!isNonEmptyString(context.language)) {
    throw new Error('Presentation context language must not be empty.');
  }

  if (!isNonEmptyString(context.locale)) {
    throw new Error('Presentation context locale must not be empty.');
  }

  if (!isValidPresentationTimeZone(context.timeZone)) {
    throw new Error('Presentation context timeZone must be a valid IANA zone.');
  }

  if (!isValidHourCycle(context.hourCycle)) {
    throw new Error('Presentation context hourCycle is not supported.');
  }

  if (
    context.numberingSystem !== undefined &&
    context.numberingSystem.trim().length === 0
  ) {
    throw new Error('Presentation context numberingSystem must not be empty.');
  }

  if (context.calendar !== undefined && context.calendar.trim().length === 0) {
    throw new Error('Presentation context calendar must not be empty.');
  }
}

export function validatePresentationSnapshot(
  value: unknown,
): PresentationSnapshot | null {
  if (value === null || value === undefined || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (candidate.version !== PRESENTATION_SNAPSHOT_VERSION) {
    return null;
  }

  if (
    !isNonEmptyString(candidate.language) ||
    !isNonEmptyString(candidate.locale) ||
    !isValidHourCycle(candidate.hourCycle) ||
    !isValidPresentationTimeZone(String(candidate.timeZone ?? ''))
  ) {
    return null;
  }

  if (
    candidate.numberingSystem !== undefined &&
    !isNonEmptyString(candidate.numberingSystem)
  ) {
    return null;
  }

  if (
    candidate.calendar !== undefined &&
    !isNonEmptyString(candidate.calendar)
  ) {
    return null;
  }

  return Object.freeze({
    version: PRESENTATION_SNAPSHOT_VERSION,
    language: candidate.language.trim() as PresentationSnapshot['language'],
    locale: candidate.locale.trim() as PresentationSnapshot['locale'],
    timeZone: String(candidate.timeZone).trim(),
    hourCycle: candidate.hourCycle,
    ...(candidate.numberingSystem !== undefined
      ? { numberingSystem: String(candidate.numberingSystem).trim() }
      : {}),
    ...(candidate.calendar !== undefined
      ? { calendar: String(candidate.calendar).trim() }
      : {}),
  });
}
