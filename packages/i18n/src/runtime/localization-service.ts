import type {
  TranslationBundle,
  TranslationBundleLoadRequest,
} from '../contracts';
import type { LocaleCode, Namespace, TranslationKey } from '../types';
import type { SupportedLocale } from './supported-locale';
import type { TranslationLookupOptions } from './translation-options';
import type { TranslationRequest } from './translation-request';
import type { TranslationResult } from './translation-result';

/**
 * Core localization runtime contract.
 *
 * Implementations resolve translations through injected loaders and approved
 * platform contracts without depending on a specific resource storage format.
 */
export interface LocalizationService {
  translate(request: TranslationRequest): TranslationResult;

  hasTranslation(
    key: TranslationKey,
    options?: TranslationLookupOptions,
  ): boolean;

  getBundle(request: TranslationBundleLoadRequest): Promise<TranslationBundle>;

  getSupportedLocales(): readonly SupportedLocale[];

  getDefaultLocale(): LocaleCode;

  getNamespaces(): readonly Namespace[];
}
