import type { PresentationContext } from './presentation-context';
import type { PresentationSnapshot } from './presentation-snapshot';
import { validatePresentationSnapshot } from './validation';

export type RestorePresentationContextResult =
  | {
      readonly status: 'restored';
      readonly context: PresentationContext;
    }
  | {
      readonly status: 'invalid';
    };

/**
 * Restores presentation context from a validated snapshot.
 */
export function restorePresentationContext(
  snapshot: unknown,
): RestorePresentationContextResult {
  const validated = validatePresentationSnapshot(snapshot);

  if (validated === null) {
    return { status: 'invalid' };
  }

  return {
    status: 'restored',
    context: Object.freeze({
      language: validated.language,
      locale: validated.locale,
      timeZone: validated.timeZone,
      hourCycle: validated.hourCycle,
      ...(validated.numberingSystem !== undefined
        ? { numberingSystem: validated.numberingSystem }
        : {}),
      ...(validated.calendar !== undefined
        ? { calendar: validated.calendar }
        : {}),
    }),
  };
}

/**
 * Restores presentation context from a trusted in-memory snapshot.
 */
export function restorePresentationContextFromSnapshot(
  snapshot: PresentationSnapshot,
): PresentationContext {
  const result = restorePresentationContext(snapshot);

  if (result.status === 'invalid') {
    throw new Error('Presentation snapshot is invalid.');
  }

  return result.context;
}
