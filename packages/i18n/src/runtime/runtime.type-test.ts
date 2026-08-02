import type { LocalizationPlatformCreateInput } from './localization-platform-create-input';
import type {
  createLocalizationPlatform,
  LocalizationPlatformFactory,
} from './localization-platform-factory';
import type { LocalizationService } from './localization-service';
import type { TranslationRequest } from './translation-request';
import type {
  LanguageCode,
  LocaleCode,
  Namespace,
  TranslationKey,
} from '../types';

declare const translationKey: TranslationKey;
declare const languageCode: LanguageCode;
declare const localeCode: LocaleCode;
declare const namespace: Namespace;

declare const service: LocalizationService;

const request: TranslationRequest = {
  key: translationKey,
};

void service.translate(request);
void service.hasTranslation(translationKey, { locale: localeCode, namespace });
void service.getBundle({ locale: localeCode, namespace });
void service.getSupportedLocales();
void service.getDefaultLocale();
void service.getNamespaces();

declare const factory: LocalizationPlatformFactory;
declare const createLocalizationPlatform: createLocalizationPlatform;

const createInput: LocalizationPlatformCreateInput = {
  localeContext: {
    language: languageCode,
    locale: localeCode,
    timeZone: 'Europe/London',
    hourCycle: 'h23',
  },
  fallbackPolicy: {
    defaultLocale: localeCode,
    localeFallbackChain: [localeCode],
  },
  bundleLoader: {
    load: async () => ({
      locale: localeCode,
      namespace,
      entries: {
        [translationKey]: 'Example',
      },
    }),
  },
  localeRegistryLoader: {
    load: async () => ({
      platformDefaultLocale: localeCode,
      languageDefaults: [],
    }),
  },
};

void factory.createLocalizationPlatform(createInput);
void createLocalizationPlatform(createInput);
