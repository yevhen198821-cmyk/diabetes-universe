/**
 * Localization Infrastructure Adapter for the Diabetes Universe platform.
 *
 * In-memory loader implementations backed by @diabetes-universe/locales.
 */

export { buildLocaleRegistryFromMetadata } from './build-locale-registry';
export {
  CANONICAL_LANGUAGE_DEFAULT_LOCALES,
  CANONICAL_PLATFORM_DEFAULT_LOCALE,
  CANONICAL_SUPPORTED_LOCALE_CODES,
  CANONICAL_SUPPORTED_LOCALE_METADATA,
  CANONICAL_TRANSLATION_FALLBACK_POLICY,
  getCanonicalSupportedLocaleMetadata,
  isCanonicalSupportedLocale,
  parseCanonicalSupportedLocale,
  type CanonicalSupportedLocale,
  type CanonicalSupportedLocaleMetadata,
} from './canonical-locale-catalog';
export { extractNamespaceEntries } from './extract-namespace-entries';
export { InMemoryLocaleRegistryLoader } from './in-memory-locale-registry-loader';
export {
  InMemoryTranslationBundleLoader,
  TranslationBundleNotFoundError,
} from './in-memory-translation-bundle-loader';
export { LOCALE_RESOURCE_CATALOG } from './locale-resource-catalog';
export { resolveLocaleChain } from './resolve-locale-chain';
