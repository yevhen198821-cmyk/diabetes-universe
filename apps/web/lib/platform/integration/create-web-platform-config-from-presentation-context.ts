import type { FormattingContext } from '@diabetes-universe/formatting';
import type { LocaleContext } from '@diabetes-universe/i18n';
import type { WebPlatformConfig } from '@diabetes-universe/platform-web';

import type { PresentationContext } from '../presentation/presentation-context';
import { isValidTimeZone } from '../resolve-request-time-zone';
import {
  WEB_PLATFORM_BOOTSTRAP_PRELOAD_NAMESPACE,
  WEB_PLATFORM_FALLBACK_POLICY,
} from '../web-platform-defaults';

function assertExplicitTimeZone(timeZone: string): asserts timeZone is string {
  if (!isValidTimeZone(timeZone)) {
    throw new Error(
      'Web platform bootstrap explicitTimeZone must be a valid IANA time zone.',
    );
  }
}

function assertContextConsistency(
  localeContext: LocaleContext,
  formattingContext: FormattingContext,
): void {
  if (formattingContext.locale !== localeContext.locale) {
    throw new Error(
      'Web platform bootstrap formattingContext.locale must match localeContext.locale.',
    );
  }

  if (formattingContext.timeZone !== localeContext.timeZone) {
    throw new Error(
      'Web platform bootstrap formattingContext.timeZone must match localeContext.timeZone.',
    );
  }

  if (
    formattingContext.hourCycle !== undefined &&
    formattingContext.hourCycle !== localeContext.hourCycle
  ) {
    throw new Error(
      'Web platform bootstrap formattingContext.hourCycle must match localeContext.hourCycle when provided.',
    );
  }
}

/**
 * Builds an immutable plain `WebPlatformConfig` from a resolved presentation context.
 *
 * Used by the client integration boundary after snapshot restore or client
 * presentation bootstrap. Does not read request cookies or headers.
 */
export function createWebPlatformConfigFromPresentationContext(
  context: PresentationContext,
): WebPlatformConfig {
  assertExplicitTimeZone(context.timeZone);

  const localeContext = Object.freeze({ ...context }) satisfies LocaleContext;
  const formattingContext = Object.freeze({
    locale: context.locale,
    timeZone: context.timeZone,
    hourCycle: context.hourCycle,
    ...(context.numberingSystem !== undefined
      ? { numberingSystem: context.numberingSystem }
      : {}),
  }) satisfies FormattingContext;

  assertContextConsistency(localeContext, formattingContext);

  const preload = Object.freeze({
    namespaces: Object.freeze([WEB_PLATFORM_BOOTSTRAP_PRELOAD_NAMESPACE]),
    locales: Object.freeze([context.locale]),
  });

  if (preload.namespaces.length === 0 || preload.locales.length === 0) {
    throw new Error('Web platform bootstrap preload scope must not be empty.');
  }

  return Object.freeze({
    localeContext,
    formattingContext,
    fallbackPolicy: WEB_PLATFORM_FALLBACK_POLICY,
    preload,
  });
}
