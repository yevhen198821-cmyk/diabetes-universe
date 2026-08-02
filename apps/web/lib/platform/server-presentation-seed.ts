import type {
  HourCycle,
  LanguageCode,
  LocaleCode,
} from '@diabetes-universe/i18n';

import type { RequestPresentationContext } from './request-presentation-context';
import {
  resolveLanguageFromLocale,
  resolveRequestLocale,
} from './resolve-request-locale';
import {
  WEB_PLATFORM_DEFAULT_HOUR_CYCLE,
  WEB_PLATFORM_SUPPORTED_LOCALES,
  type WebPlatformSupportedLocale,
} from './web-platform-defaults';

const SUPPORTED_LOCALE_SET = new Set<string>(WEB_PLATFORM_SUPPORTED_LOCALES);

function assertSupportedLocale(
  locale: string,
): asserts locale is WebPlatformSupportedLocale {
  if (!SUPPORTED_LOCALE_SET.has(locale)) {
    throw new Error('Web platform bootstrap locale is not supported.');
  }
}

/**
 * Immutable server-resolved presentation preferences without a user time zone.
 *
 * Produced from the same canonical locale resolution used by the ready bootstrap
 * flow. Does not contain time zone, runtime, services, or browser objects.
 */
export type ServerPresentationSeed = Readonly<{
  readonly language: LanguageCode;
  readonly locale: LocaleCode;
  readonly hourCycle: HourCycle;
  readonly numberingSystem?: string;
  readonly calendar?: string;
}>;

/**
 * Resolves server presentation seed from request presentation context.
 */
export function createServerPresentationSeed(
  context: RequestPresentationContext,
): ServerPresentationSeed {
  const locale = resolveRequestLocale(context);

  assertSupportedLocale(locale);

  return Object.freeze({
    language: resolveLanguageFromLocale(locale),
    locale: locale as LocaleCode,
    hourCycle: WEB_PLATFORM_DEFAULT_HOUR_CYCLE,
  });
}
