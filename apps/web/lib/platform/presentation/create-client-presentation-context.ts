import type { RequestPlatformBootstrapResult } from '../request-platform-bootstrap-result';
import type { ServerPresentationSeed } from '../server-presentation-seed';

import { createPresentationSnapshot } from './create-presentation-snapshot';
import type { ClientPresentationBootstrapResult } from './presentation-bootstrap-result';
import type { PresentationContext } from './presentation-context';
import { resolveBrowserTimeZone } from './resolve-browser-time-zone';

function presentationContextFromLocaleContext(
  localeContext: PresentationContext,
): PresentationContext {
  return Object.freeze({
    language: localeContext.language,
    locale: localeContext.locale,
    timeZone: localeContext.timeZone,
    hourCycle: localeContext.hourCycle,
    ...(localeContext.numberingSystem !== undefined
      ? { numberingSystem: localeContext.numberingSystem }
      : {}),
    ...(localeContext.calendar !== undefined
      ? { calendar: localeContext.calendar }
      : {}),
  });
}

function createPresentationContextFromSeed(
  seed: ServerPresentationSeed,
  timeZone: string,
): PresentationContext {
  return Object.freeze({
    language: seed.language,
    locale: seed.locale,
    hourCycle: seed.hourCycle,
    timeZone,
    ...(seed.numberingSystem !== undefined
      ? { numberingSystem: seed.numberingSystem }
      : {}),
    ...(seed.calendar !== undefined ? { calendar: seed.calendar } : {}),
  });
}

export type CreateClientPresentationBootstrapInput = Readonly<{
  readonly serverBootstrap: RequestPlatformBootstrapResult;
}>;

/**
 * Pure client orchestration for first-visit presentation bootstrap.
 *
 * Does not create `PlatformRuntime`, write cookies, or trigger React lifecycle.
 */
export function createClientPresentationBootstrapResult(
  input: CreateClientPresentationBootstrapInput,
): ClientPresentationBootstrapResult {
  const { serverBootstrap } = input;

  if (serverBootstrap.status === 'ready') {
    const context = presentationContextFromLocaleContext(
      serverBootstrap.runtime.localization.localeContext,
    );
    const snapshot = createPresentationSnapshot(context);

    return {
      status: 'ready',
      context,
      snapshot,
    };
  }

  const browserTimeZone = resolveBrowserTimeZone();

  if (browserTimeZone.status === 'unavailable') {
    return { status: 'time-zone-unavailable' };
  }

  const context = createPresentationContextFromSeed(
    serverBootstrap.seed,
    browserTimeZone.timeZone,
  );
  const snapshot = createPresentationSnapshot(context);

  return {
    status: 'ready',
    context,
    snapshot,
  };
}
