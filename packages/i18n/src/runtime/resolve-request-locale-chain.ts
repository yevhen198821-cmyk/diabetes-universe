import type { FallbackPolicy } from '../contracts';
import type { LocaleCode } from '../types';

/**
 * Builds locale resolution order for runtime translation lookup.
 */
export function resolveRequestLocaleChain(
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
