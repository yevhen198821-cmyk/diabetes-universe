import type { TranslationKey } from '../types';
import type { TranslationOptions } from './translation-options';
import type { TranslationParameters } from './translation-parameters';

/**
 * Immutable translation request passed to the localization runtime.
 */
export interface TranslationRequest {
  readonly key: TranslationKey;
  readonly parameters?: TranslationParameters;
  readonly options?: TranslationOptions;
}
