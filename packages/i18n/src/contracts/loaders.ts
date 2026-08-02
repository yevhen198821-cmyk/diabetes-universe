import type { LocaleCode, Namespace } from '../types';
import type { LocaleRegistry } from '../registry/locale-registry';
import type { TranslationBundle } from './translation-bundle';

/**
 * Request contract for loading one translation bundle.
 */
export interface TranslationBundleLoadRequest {
  readonly locale: LocaleCode;
  readonly namespace: Namespace;
}

/**
 * Loader contract for resolving translation bundles.
 * Implementations are provided outside this package.
 */
export interface TranslationBundleLoader {
  load(request: TranslationBundleLoadRequest): Promise<TranslationBundle>;
}

/**
 * Loader contract for resolving the locale registry.
 * Implementations are provided outside this package.
 */
export interface LocaleRegistryLoader {
  load(): Promise<LocaleRegistry>;
}
