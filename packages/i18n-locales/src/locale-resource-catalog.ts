import {
  englishTranslationResource,
  germanTranslationResource,
  russianTranslationResource,
  ukrainianTranslationResource,
  type CanonicalTranslationKey,
} from '@diabetes-universe/locales';

import type { LocaleCode } from '@diabetes-universe/i18n';

type LocaleResourceEntry = {
  readonly locale: LocaleCode;
  readonly messages: Readonly<Record<CanonicalTranslationKey, string>>;
};

const localeResources: readonly LocaleResourceEntry[] = [
  {
    locale: englishTranslationResource.metadata.locale as LocaleCode,
    messages: englishTranslationResource.messages,
  },
  {
    locale: ukrainianTranslationResource.metadata.locale as LocaleCode,
    messages: ukrainianTranslationResource.messages,
  },
  {
    locale: germanTranslationResource.metadata.locale as LocaleCode,
    messages: germanTranslationResource.messages,
  },
  {
    locale: russianTranslationResource.metadata.locale as LocaleCode,
    messages: russianTranslationResource.messages,
  },
];

export const LOCALE_RESOURCE_CATALOG: Readonly<
  Record<string, LocaleResourceEntry>
> = Object.fromEntries(
  localeResources.map((resource) => [resource.locale, resource]),
);
