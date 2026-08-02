import type { LocaleCode, Namespace, TranslationKey } from '../types';

/**
 * Serializable translation payload for one locale and namespace.
 *
 * Entry values are ICU message source strings. They must not contain HTML,
 * React nodes, functions, or arbitrary structured objects.
 */
export interface TranslationBundle {
  readonly locale: LocaleCode;
  readonly namespace: Namespace;
  readonly entries: Readonly<Record<TranslationKey, string>>;
}
