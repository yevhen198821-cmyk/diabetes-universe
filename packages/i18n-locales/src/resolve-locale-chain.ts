import type { FallbackPolicy, LocaleCode } from '@diabetes-universe/i18n';

/**
 * Builds the ordered locale resolution chain for bundle loading.
 */
export function resolveLocaleChain(
  requestedLocale: LocaleCode,
  fallbackPolicy: FallbackPolicy,
): readonly LocaleCode[] {
  const seen = new Set<string>();
  const chain: LocaleCode[] = [];

  for (const locale of [
    requestedLocale,
    ...fallbackPolicy.localeFallbackChain,
  ]) {
    if (seen.has(locale)) {
      continue;
    }

    seen.add(locale);
    chain.push(locale);
  }

  return chain;
}
