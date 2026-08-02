import type { Namespace, TranslationKey } from '../types';

/**
 * Derives the namespace segment from a translation key.
 */
export function extractNamespaceFromKey(key: TranslationKey): Namespace {
  const separatorIndex = String(key).indexOf('.');

  if (separatorIndex === -1) {
    throw new Error(
      `Translation key "${String(key)}" does not contain a namespace segment`,
    );
  }

  return String(key).slice(0, separatorIndex) as Namespace;
}
