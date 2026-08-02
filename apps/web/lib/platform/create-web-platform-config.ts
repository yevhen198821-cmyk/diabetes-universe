import type { FormattingContext } from '@diabetes-universe/formatting';
import type {
  HourCycle,
  LocaleCode,
  LocaleContext,
} from '@diabetes-universe/i18n';
import type { WebPlatformConfig } from '@diabetes-universe/platform-web';

import type { RequestPresentationContext } from './request-presentation-context';
import {
  resolveLanguageFromLocale,
  resolveRequestLocale,
} from './resolve-request-locale';
import { isValidTimeZone } from './resolve-request-time-zone';
import {
  WEB_PLATFORM_BOOTSTRAP_PRELOAD_NAMESPACE,
  WEB_PLATFORM_DEFAULT_HOUR_CYCLE,
  WEB_PLATFORM_FALLBACK_POLICY,
  WEB_PLATFORM_SUPPORTED_LOCALES,
  type WebPlatformSupportedLocale,
} from './web-platform-defaults';

const HOUR_CYCLES = new Set<HourCycle>(['h12', 'h23']);
const SUPPORTED_LOCALE_SET = new Set<string>(WEB_PLATFORM_SUPPORTED_LOCALES);

function assertSupportedLocale(
  locale: string,
): asserts locale is WebPlatformSupportedLocale {
  if (!SUPPORTED_LOCALE_SET.has(locale)) {
    throw new Error('Web platform bootstrap locale is not supported.');
  }
}

function assertValidHourCycle(hourCycle: HourCycle): void {
  if (!HOUR_CYCLES.has(hourCycle)) {
    throw new Error('Web platform bootstrap hourCycle is not supported.');
  }
}

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
  const locale = resolveRequestLocale(context);
  const hourCycle = WEB_PLATFORM_DEFAULT_HOUR_CYCLE;

  assertSupportedLocale(locale);
  assertExplicitTimeZone(explicitTimeZone);
  assertValidHourCycle(hourCycle);

  const localeContext = Object.freeze({
    language: resolveLanguageFromLocale(locale),
    locale: locale as LocaleCode,
    timeZone: explicitTimeZone,
    hourCycle,
  }) satisfies LocaleContext;

  const formattingContext = Object.freeze({
    locale: locale as LocaleCode,
    timeZone: explicitTimeZone,
    hourCycle,
  }) satisfies FormattingContext;

  assertValidNumberingSystem((localeContext as LocaleContext).numberingSystem);
  assertValidNumberingSystem(
    (formattingContext as FormattingContext).numberingSystem,
  );
  assertValidCurrency((formattingContext as FormattingContext).currency);
  assertContextConsistency(localeContext, formattingContext);

  const preload = Object.freeze({
    namespaces: Object.freeze([WEB_PLATFORM_BOOTSTRAP_PRELOAD_NAMESPACE]),
    locales: Object.freeze([locale as LocaleCode]),
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
