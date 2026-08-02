import type {
  FallbackPolicy,
  LocaleContext,
  TranslationBundle,
  TranslationBundleLoadRequest,
} from '../contracts';
import type { LanguageLocaleDefault, LocaleRegistry } from '../registry';
import type { LocaleCode, Namespace, TranslationKey } from '../types';
import type { LocalizationPlatform } from './localization-platform';
import type { LocalizationPlatformCreateInput } from './localization-platform-create-input';
import type { SupportedLocale } from './supported-locale';
import type { TranslationLookupOptions } from './translation-options';
import type { TranslationRequest } from './translation-request';
import type { TranslationResult } from './translation-result';

import { createBundleCacheKey } from './create-bundle-cache-key';
import { extractNamespaceFromKey } from './extract-namespace-from-key';
import { resolveRequestLocaleChain } from './resolve-request-locale-chain';

type LocaleRegistryWithNamespaces = LocaleRegistry & {
  readonly namespaces?: readonly Namespace[];
};

export class LocalizationPlatformImpl implements LocalizationPlatform {
  readonly localeContext: LocaleContext;
  readonly fallbackPolicy: FallbackPolicy;

  private readonly bundleLoader: LocalizationPlatformCreateInput['bundleLoader'];
  private registryCache: LocaleRegistry | undefined;
  private readonly registryReady: Promise<void>;
  private readonly bundleCache = new Map<string, TranslationBundle>();

  constructor(
    input: LocalizationPlatformCreateInput,
    registry?: LocaleRegistry,
  ) {
    this.localeContext = input.localeContext;
    this.fallbackPolicy = input.fallbackPolicy;
    this.bundleLoader = input.bundleLoader;

    if (registry) {
      this.registryCache = registry;
      this.registryReady = Promise.resolve();
      return;
    }

    this.registryReady = input.localeRegistryLoader
      .load()
      .then((loadedRegistry) => {
        this.registryCache = loadedRegistry;
      });
  }

  whenReady(): Promise<void> {
    return this.registryReady;
  }

  translate(request: TranslationRequest): TranslationResult {
    const requestedLocale =
      request.options?.locale ?? this.localeContext.locale;
    const namespace =
      request.options?.namespace ?? extractNamespaceFromKey(request.key);
    const localesToTry = resolveRequestLocaleChain(
      requestedLocale,
      this.fallbackPolicy,
    );

    for (const locale of localesToTry) {
      const bundle = this.getCachedBundle(locale, namespace);

      if (!bundle) {
        continue;
      }

      const value = bundle.entries[request.key];

      if (value === undefined) {
        continue;
      }

      return {
        key: request.key,
        value,
        locale: bundle.locale,
        namespace,
        resolvedFromFallback: bundle.locale !== requestedLocale,
      };
    }

    throw new Error(
      `Translation key "${String(request.key)}" was not found for locale "${String(requestedLocale)}"`,
    );
  }

  hasTranslation(
    key: TranslationKey,
    options?: TranslationLookupOptions,
  ): boolean {
    try {
      this.translate({
        key,
        options,
      });
      return true;
    } catch {
      return false;
    }
  }

  async getBundle(
    request: TranslationBundleLoadRequest,
  ): Promise<TranslationBundle> {
    const cacheKey = createBundleCacheKey(request.locale, request.namespace);
    const cachedBundle = this.bundleCache.get(cacheKey);

    if (cachedBundle) {
      return cachedBundle;
    }

    const bundle = await this.bundleLoader.load(request);
    this.bundleCache.set(cacheKey, bundle);
    return bundle;
  }

  getSupportedLocales(): readonly SupportedLocale[] {
    const registry = this.requireRegistry();

    return registry.languageDefaults.map((entry: LanguageLocaleDefault) => ({
      language: entry.language,
      locale: entry.defaultLocale,
      isPlatformDefault: entry.defaultLocale === registry.platformDefaultLocale,
    }));
  }

  getDefaultLocale(): LocaleCode {
    return this.requireRegistry().platformDefaultLocale;
  }

  getNamespaces(): readonly Namespace[] {
    const registry = this.requireRegistry() as LocaleRegistryWithNamespaces;

    if (registry.namespaces) {
      return registry.namespaces;
    }

    const namespaces = new Set<Namespace>();

    for (const bundle of this.bundleCache.values()) {
      namespaces.add(bundle.namespace);
    }

    return [...namespaces];
  }

  private requireRegistry(): LocaleRegistry {
    if (!this.registryCache) {
      throw new Error('Localization platform registry is not ready');
    }

    return this.registryCache;
  }

  private getCachedBundle(
    locale: LocaleCode,
    namespace: Namespace,
  ): TranslationBundle | undefined {
    return this.bundleCache.get(createBundleCacheKey(locale, namespace));
  }
}
