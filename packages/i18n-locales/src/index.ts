/**
 * Localization Infrastructure Adapter for the Diabetes Universe platform.
 *
 * In-memory loader implementations backed by @diabetes-universe/locales.
 */

export { buildLocaleRegistryFromMetadata } from './build-locale-registry';
export { extractNamespaceEntries } from './extract-namespace-entries';
export { InMemoryLocaleRegistryLoader } from './in-memory-locale-registry-loader';
export {
  InMemoryTranslationBundleLoader,
  TranslationBundleNotFoundError,
} from './in-memory-translation-bundle-loader';
export { LOCALE_RESOURCE_CATALOG } from './locale-resource-catalog';
export { resolveLocaleChain } from './resolve-locale-chain';
