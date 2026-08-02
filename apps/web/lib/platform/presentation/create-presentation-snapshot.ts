import type { PresentationContext } from './presentation-context';
import type { PresentationSnapshot } from './presentation-snapshot';
import { PRESENTATION_SNAPSHOT_VERSION } from './presentation-snapshot';
import { assertValidPresentationContext } from './validation';

/**
 * Creates an immutable JSON-serializable snapshot from presentation context.
 */
export function createPresentationSnapshot(
  context: PresentationContext,
): PresentationSnapshot {
  assertValidPresentationContext(context);

  return Object.freeze({
    version: PRESENTATION_SNAPSHOT_VERSION,
    language: context.language,
    locale: context.locale,
    timeZone: context.timeZone,
    hourCycle: context.hourCycle,
    ...(context.numberingSystem !== undefined
      ? { numberingSystem: context.numberingSystem }
      : {}),
    ...(context.calendar !== undefined ? { calendar: context.calendar } : {}),
  });
}
