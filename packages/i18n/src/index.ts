/**
 * Diabetes Universe localization platform contracts.
 *
 * This package exposes immutable, framework-independent contracts only.
 * Runtime loaders, ICU formatting, and UI integration live in future sprints.
 */

export type {
  FallbackPolicy,
  LocaleContext,
  LocaleRegistryLoader,
  TranslationBundle,
  TranslationBundleLoadRequest,
  TranslationBundleLoader,
} from './contracts';

export type { LanguageLocaleDefault, LocaleRegistry } from './registry';

export type {
  Brand,
  HourCycle,
  LanguageCode,
  LocaleCode,
  Namespace,
  SupportedLanguageCode,
  TranslationKey,
} from './types';

export { createLocalizationPlatform } from './runtime/create-localization-platform';

export type {
  CreateLocalizationPlatform,
  LocalizationPlatform,
  LocalizationPlatformCreateInput,
  LocalizationPlatformFactory,
  LocalizationService,
  SupportedLocale,
  TranslationLookupOptions,
  TranslationOptions,
  TranslationParameterValue,
  TranslationParameters,
  TranslationRequest,
  TranslationResult,
} from './runtime';
