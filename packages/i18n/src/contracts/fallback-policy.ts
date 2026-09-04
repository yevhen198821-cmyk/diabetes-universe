import type { LocaleCode } from '../types';

/**
 * Platform policy describing locale fallback order when resolving translation
 * resources.
 *
 * This contract governs resource resolution only. It is not a user preference
 * model and does not belong inside LocaleContext.
 *
 * Fallback chains are locale-scoped because translation bundle resources are
 * keyed by LocaleCode. Language selection maps to a default locale through
 * LocaleRegistry, after which bundle resolution follows this locale chain.
 *
 * Diabetes Universe production policy is requested locale → platform default
 * (`en-GB`). Sequential sibling-language fallback is not used.
 */
export interface FallbackPolicy {
  readonly defaultLocale: LocaleCode;
  readonly localeFallbackChain: readonly LocaleCode[];
}
