import type { LocaleCode, Namespace, TranslationKey } from '../types';

/**
 * Immutable translation response produced by the localization runtime.
 */
export interface TranslationResult {
  readonly key: TranslationKey;
  readonly value: string;
  readonly locale: LocaleCode;
  readonly namespace?: Namespace;
  readonly resolvedFromFallback: boolean;
}
