import {
  englishMetadata,
  germanMetadata,
  russianMetadata,
  ukrainianMetadata,
} from '@diabetes-universe/locales';

import type {
  LanguageCode,
  LocaleCode,
  LocaleRegistry,
  Namespace,
} from '@diabetes-universe/i18n';

const localeMetadata = [
  englishMetadata,
  ukrainianMetadata,
  germanMetadata,
  russianMetadata,
] as const;

/**
 * Builds a LocaleRegistry from canonical locale metadata exports.
 */
export function buildLocaleRegistryFromMetadata(): LocaleRegistry & {
  readonly namespaces: readonly Namespace[];
} {
  return {
    platformDefaultLocale: englishMetadata.locale as LocaleCode,
    languageDefaults: localeMetadata.map((metadata) => ({
      language: metadata.language as LanguageCode,
      defaultLocale: metadata.locale as LocaleCode,
    })),
    namespaces: englishMetadata.namespaces as unknown as readonly Namespace[],
  };
}
