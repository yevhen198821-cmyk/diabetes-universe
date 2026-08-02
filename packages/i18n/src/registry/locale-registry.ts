import type { LanguageCode, LocaleCode } from '../types';

/**
 * Canonical default locale for one supported platform language.
 *
 * v1.0 defaults:
 * - `en` → `en-GB`
 * - `uk` → `uk-UA`
 * - `de` → `de-DE`
 * - `ru` → `ru-RU`
 */
export interface LanguageLocaleDefault {
  readonly language: LanguageCode;
  readonly defaultLocale: LocaleCode;
}

/**
 * Immutable registry of supported languages and their default locales.
 *
 * Does not define time zones, localized display labels, or user preferences.
 */
export interface LocaleRegistry {
  readonly platformDefaultLocale: LocaleCode;
  readonly languageDefaults: readonly LanguageLocaleDefault[];
}
