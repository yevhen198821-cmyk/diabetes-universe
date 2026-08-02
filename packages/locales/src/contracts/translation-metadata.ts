import type { SupportedLanguageCode } from '@diabetes-universe/i18n';

/**
 * Lifecycle status for a translation resource bundle.
 */
export type TranslationBundleStatus = 'draft' | 'approved' | 'deprecated';

/**
 * Immutable metadata describing one translation resource bundle.
 */
export interface TranslationMetadata {
  readonly language: SupportedLanguageCode;
  readonly locale: string;
  readonly version: '1.0.0';
  readonly status: TranslationBundleStatus;
  readonly namespaces: readonly import('../namespaces').CanonicalNamespace[];
}
