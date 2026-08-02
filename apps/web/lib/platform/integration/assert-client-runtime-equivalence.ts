import type { PlatformRuntime } from '@diabetes-universe/platform';

import type { PresentationContext } from '../presentation/presentation-context';
import type { PresentationSnapshot } from '../presentation/presentation-snapshot';

function assertOptionalField<T>(
  actual: T | undefined,
  expected: T | undefined,
  fieldName: string,
): void {
  if (expected === undefined) {
    if (actual !== undefined) {
      throw new Error(
        `Client runtime ${fieldName} must be undefined when bootstrap value is absent.`,
      );
    }

    return;
  }

  if (actual !== expected) {
    throw new Error(
      `Client runtime ${fieldName} must match bootstrap presentation value.`,
    );
  }
}

/**
 * Pure equivalence assertion between a client runtime and presentation context.
 */
export function assertClientRuntimeMatchesPresentationContext(
  runtime: PlatformRuntime,
  context: PresentationContext,
): void {
  const localeContext = runtime.localization.localeContext;

  if (localeContext.language !== context.language) {
    throw new Error(
      'Client runtime language must match bootstrap presentation.',
    );
  }

  if (localeContext.locale !== context.locale) {
    throw new Error('Client runtime locale must match bootstrap presentation.');
  }

  if (localeContext.timeZone !== context.timeZone) {
    throw new Error(
      'Client runtime timeZone must match bootstrap presentation.',
    );
  }

  if (localeContext.hourCycle !== context.hourCycle) {
    throw new Error(
      'Client runtime hourCycle must match bootstrap presentation.',
    );
  }

  assertOptionalField(
    localeContext.numberingSystem,
    context.numberingSystem,
    'numberingSystem',
  );
  assertOptionalField(localeContext.calendar, context.calendar, 'calendar');
}

/**
 * Pure equivalence assertion between a client runtime and presentation snapshot.
 */
export function assertClientRuntimeMatchesSnapshot(
  runtime: PlatformRuntime,
  snapshot: PresentationSnapshot,
): void {
  assertClientRuntimeMatchesPresentationContext(runtime, {
    language: snapshot.language,
    locale: snapshot.locale,
    timeZone: snapshot.timeZone,
    hourCycle: snapshot.hourCycle,
    ...(snapshot.numberingSystem !== undefined
      ? { numberingSystem: snapshot.numberingSystem }
      : {}),
    ...(snapshot.calendar !== undefined ? { calendar: snapshot.calendar } : {}),
  });
}
