import type { Namespace, TranslationKey } from '@diabetes-universe/i18n';

/**
 * Selects translation entries that belong to one namespace.
 */
export function extractNamespaceEntries(
  messages: Readonly<Record<string, string>>,
  namespace: Namespace,
): Readonly<Record<TranslationKey, string>> {
  const prefix = `${namespace}.`;
  const entries: Record<string, string> = {};

  for (const [key, value] of Object.entries(messages)) {
    if (key.startsWith(prefix)) {
      entries[key] = value;
    }
  }

  return entries as Readonly<Record<TranslationKey, string>>;
}
