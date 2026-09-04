import type {
  FallbackPolicy,
  LanguageCode,
  LocaleCode,
} from '@diabetes-universe/i18n';

/**
 * Concrete Diabetes Universe locale authority.
 *
 * This catalog is the only definition of supported locales, the platform
 * default, language defaults, fallback policy, and selector metadata.
 * Composition roots consume it. They must not redeclare the four locales.
 */
export const CANONICAL_SUPPORTED_LOCALE_CODES = [
  'en-GB',
  'uk-UA',
  'de-DE',
  'ru-RU',
] as const;

export type CanonicalSupportedLocale =
  (typeof CANONICAL_SUPPORTED_LOCALE_CODES)[number];

export const CANONICAL_PLATFORM_DEFAULT_LOCALE =
  'en-GB' as const satisfies CanonicalSupportedLocale;

export const CANONICAL_LANGUAGE_DEFAULT_LOCALES = Object.freeze({
  en: 'en-GB',
  uk: 'uk-UA',
  de: 'de-DE',
  ru: 'ru-RU',
}) satisfies Readonly<Record<string, CanonicalSupportedLocale>>;

/**
 * Translation resource fallback: requested locale → platform default.
 *
 * Cross-language sequential fallback (for example de-DE → uk-UA) is forbidden.
 */
export const CANONICAL_TRANSLATION_FALLBACK_POLICY = Object.freeze({
  defaultLocale: CANONICAL_PLATFORM_DEFAULT_LOCALE as LocaleCode,
  localeFallbackChain: Object.freeze([
    CANONICAL_PLATFORM_DEFAULT_LOCALE as LocaleCode,
  ]),
}) satisfies FallbackPolicy;

export interface CanonicalSupportedLocaleMetadata {
  readonly isPlatformDefault: boolean;
  readonly language: LanguageCode;
  readonly locale: CanonicalSupportedLocale;
  readonly nativeName: string;
}

export const CANONICAL_SUPPORTED_LOCALE_METADATA = Object.freeze([
  Object.freeze({
    isPlatformDefault: true,
    language: 'en' as LanguageCode,
    locale: 'en-GB',
    nativeName: 'English',
  }),
  Object.freeze({
    isPlatformDefault: false,
    language: 'uk' as LanguageCode,
    locale: 'uk-UA',
    nativeName: 'Українська',
  }),
  Object.freeze({
    isPlatformDefault: false,
    language: 'de' as LanguageCode,
    locale: 'de-DE',
    nativeName: 'Deutsch',
  }),
  Object.freeze({
    isPlatformDefault: false,
    language: 'ru' as LanguageCode,
    locale: 'ru-RU',
    nativeName: 'Русский',
  }),
]) satisfies readonly CanonicalSupportedLocaleMetadata[];

const CANONICAL_SUPPORTED_LOCALE_SET = new Set<string>(
  CANONICAL_SUPPORTED_LOCALE_CODES,
);

export function isCanonicalSupportedLocale(
  value: string,
): value is CanonicalSupportedLocale {
  return CANONICAL_SUPPORTED_LOCALE_SET.has(value);
}

/**
 * Accepts only an exact canonical supported locale.
 *
 * Language-only tags, unknown values, and garbage are ignored.
 */
export function parseCanonicalSupportedLocale(
  value: string | null | undefined,
): CanonicalSupportedLocale | null {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = value.trim();

  if (!isCanonicalSupportedLocale(trimmed)) {
    return null;
  }

  return trimmed;
}

export function getCanonicalSupportedLocaleMetadata(
  locale: CanonicalSupportedLocale,
): CanonicalSupportedLocaleMetadata {
  const metadata = CANONICAL_SUPPORTED_LOCALE_METADATA.find(
    (entry) => entry.locale === locale,
  );

  if (!metadata) {
    throw new Error(`Canonical locale metadata is missing for "${locale}".`);
  }

  return metadata;
}
