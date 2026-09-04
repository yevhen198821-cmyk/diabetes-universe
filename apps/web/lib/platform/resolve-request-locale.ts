import { parseCanonicalSupportedLocale } from '@diabetes-universe/i18n-locales';
import type { LanguageCode, LocaleCode } from '@diabetes-universe/i18n';

import type { RequestPresentationContext } from './request-presentation-context';
import {
  WEB_PLATFORM_DEFAULT_LOCALE,
  WEB_PLATFORM_LANGUAGE_DEFAULT_LOCALES,
  WEB_PLATFORM_SUPPORTED_LOCALES,
  type WebPlatformSupportedLocale,
} from './web-platform-defaults';

const SUPPORTED_LOCALE_SET = new Set<string>(WEB_PLATFORM_SUPPORTED_LOCALES);

type AcceptLanguageEntry = Readonly<{
  tag: string;
  quality: number;
}>;

function toCanonicalLocaleTag(tag: string): string | null {
  const normalized = tag.trim().replace(/_/g, '-');

  if (normalized.length === 0) {
    return null;
  }

  const segments = normalized
    .split('-')
    .filter((segment) => segment.length > 0);

  if (segments.length === 0) {
    return null;
  }

  const [language, region, ...rest] = segments;
  const canonicalLanguage = language.toLowerCase();
  const canonicalRegion = region ? region.toUpperCase() : undefined;
  const canonicalRest = rest.map((segment) => segment.toLowerCase());

  if (canonicalRegion) {
    return [canonicalLanguage, canonicalRegion, ...canonicalRest].join('-');
  }

  return canonicalLanguage;
}

function resolveSupportedLocale(
  tag: string,
): WebPlatformSupportedLocale | null {
  const canonicalTag = toCanonicalLocaleTag(tag);

  if (!canonicalTag) {
    return null;
  }

  if (SUPPORTED_LOCALE_SET.has(canonicalTag)) {
    return canonicalTag as WebPlatformSupportedLocale;
  }

  const language = canonicalTag.split('-')[0];
  const languageDefault =
    WEB_PLATFORM_LANGUAGE_DEFAULT_LOCALES[
      language as keyof typeof WEB_PLATFORM_LANGUAGE_DEFAULT_LOCALES
    ];

  if (languageDefault && SUPPORTED_LOCALE_SET.has(languageDefault)) {
    return languageDefault as WebPlatformSupportedLocale;
  }

  return null;
}

export function parseAcceptLanguage(
  acceptLanguage: string | undefined,
): readonly AcceptLanguageEntry[] {
  if (!acceptLanguage || acceptLanguage.trim().length === 0) {
    return [];
  }

  const entries: AcceptLanguageEntry[] = [];

  for (const part of acceptLanguage.split(',')) {
    const trimmed = part.trim();

    if (trimmed.length === 0) {
      continue;
    }

    const [rawTag, ...parameters] = trimmed
      .split(';')
      .map((value) => value.trim());
    const tag = rawTag ?? '';

    if (tag.length === 0) {
      continue;
    }

    let quality = 1;

    for (const parameter of parameters) {
      const [name, value] = parameter.split('=').map((entry) => entry.trim());

      if (name === 'q' && value !== undefined) {
        const parsed = Number.parseFloat(value);

        if (!Number.isNaN(parsed)) {
          quality = parsed;
        }
      }
    }

    entries.push({ tag, quality });
  }

  return entries
    .filter((entry) => entry.quality > 0)
    .sort((left, right) => right.quality - left.quality);
}

function resolveLocaleFromAcceptLanguage(
  acceptLanguage: string | undefined,
): WebPlatformSupportedLocale | null {
  for (const entry of parseAcceptLanguage(acceptLanguage)) {
    const resolved = resolveSupportedLocale(entry.tag);

    if (resolved) {
      return resolved;
    }
  }

  return null;
}

function normalizeCookieLocale(
  cookieLocale: string | undefined,
): WebPlatformSupportedLocale | null {
  return parseCanonicalSupportedLocale(cookieLocale);
}

/**
 * Resolves the active locale from request presentation context.
 *
 * Priority: valid cookie locale, valid Accept-Language match, platform default.
 */
export function resolveRequestLocale(
  context: RequestPresentationContext,
): WebPlatformSupportedLocale {
  const cookieLocale = normalizeCookieLocale(context.cookieLocale);

  if (cookieLocale) {
    return cookieLocale;
  }

  const acceptLanguageLocale = resolveLocaleFromAcceptLanguage(
    context.acceptLanguage,
  );

  if (acceptLanguageLocale) {
    return acceptLanguageLocale;
  }

  return WEB_PLATFORM_DEFAULT_LOCALE;
}

/**
 * Derives the platform language code for a supported locale.
 */
export function resolveLanguageFromLocale(locale: LocaleCode): LanguageCode {
  const language = locale.split('-')[0];

  if (
    language in WEB_PLATFORM_LANGUAGE_DEFAULT_LOCALES &&
    WEB_PLATFORM_LANGUAGE_DEFAULT_LOCALES[
      language as keyof typeof WEB_PLATFORM_LANGUAGE_DEFAULT_LOCALES
    ] === locale
  ) {
    return language as LanguageCode;
  }

  for (const [candidateLanguage, defaultLocale] of Object.entries(
    WEB_PLATFORM_LANGUAGE_DEFAULT_LOCALES,
  )) {
    if (defaultLocale === locale) {
      return candidateLanguage as LanguageCode;
    }
  }

  return 'en' as LanguageCode;
}
