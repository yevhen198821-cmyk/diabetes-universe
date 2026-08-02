import type { LocaleCode, Namespace } from '../types';

/**
 * Optional translation resolution settings.
 */
export interface TranslationOptions {
  readonly locale?: LocaleCode;
  readonly namespace?: Namespace;
}

/**
 * Lookup settings for existence checks without message formatting.
 */
export interface TranslationLookupOptions {
  readonly locale?: LocaleCode;
  readonly namespace?: Namespace;
}
