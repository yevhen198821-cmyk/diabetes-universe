import type { FormattingContext } from '@diabetes-universe/formatting';
import type { LocaleContext } from '@diabetes-universe/i18n';
import type { WebPlatformConfig } from '@diabetes-universe/platform-web';

import type { RequestPresentationContext } from './request-presentation-context';
import { isValidTimeZone } from './resolve-request-time-zone';
import { createServerPresentationSeed } from './server-presentation-seed';
import {
  WEB_PLATFORM_APPLICATION_PRELOAD_NAMESPACES,
  WEB_PLATFORM_FALLBACK_POLICY,
} from './web-platform-defaults';

function assertValidNumberingSystem(numberingSystem: string | undefined): void {
  if (numberingSystem === undefined) {
    return;
  }

  if (numberingSystem.trim().length === 0) {
    throw new Error(
      'Web platform bootstrap numberingSystem must not be empty.',
    );
  }
}

function assertValidCurrency(currency: string | undefined): void {
  if (currency === undefined) {
    return;
  }

  if (currency.trim().length === 0) {
    throw new Error('Web platform bootstrap currency must not be empty.');
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

function assertExplicitTimeZone(
  explicitTimeZone: string,
): asserts explicitTimeZone is string {
  if (!isValidTimeZone(explicitTimeZone)) {
    throw new Error(
      'Web platform bootstrap explicitTimeZone must be a valid IANA time zone.',
    );
  }
}

/**
 * Builds an immutable plain `WebPlatformConfig` from request presentation context
 * and a validated explicit IANA time zone.
 *
 * Callers must resolve time zone in the orchestration layer before invoking this
 * factory. Missing user time zone is not handled here.
 */
export function createWebPlatformConfig(
  context: RequestPresentationContext,
  explicitTimeZone: string,
): WebPlatformConfig {
  const seed = createServerPresentationSeed(context);

  assertExplicitTimeZone(explicitTimeZone);

  const localeContext = Object.freeze({
    ...seed,
    timeZone: explicitTimeZone,
  }) satisfies LocaleContext;

  const formattingContext = Object.freeze({
    locale: seed.locale,
    timeZone: explicitTimeZone,
    hourCycle: seed.hourCycle,
  }) satisfies FormattingContext;

  assertValidNumberingSystem((localeContext as LocaleContext).numberingSystem);
  assertValidNumberingSystem(
    (formattingContext as FormattingContext).numberingSystem,
  );
  assertValidCurrency((formattingContext as FormattingContext).currency);
  assertContextConsistency(localeContext, formattingContext);

  const preload = Object.freeze({
    namespaces: WEB_PLATFORM_APPLICATION_PRELOAD_NAMESPACES,
    locales: Object.freeze([seed.locale]),
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
