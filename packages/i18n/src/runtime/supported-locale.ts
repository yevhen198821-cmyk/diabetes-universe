import type { LanguageCode, LocaleCode } from '../types';

/**
 * One locale supported by the localization platform.
 */
export interface SupportedLocale {
  readonly language: LanguageCode;
  readonly locale: LocaleCode;
  readonly isPlatformDefault: boolean;
}
