import type { FallbackPolicy } from './fallback-policy';
import type { LocaleContext } from './locale-context';
import type { TranslationBundle } from './translation-bundle';
import type {
  LanguageCode,
  LocaleCode,
  Namespace,
  TranslationKey,
} from '../types';

declare const languageCode: LanguageCode;
declare const localeCode: LocaleCode;
declare const namespace: Namespace;
declare const translationKey: TranslationKey;

const validContext: LocaleContext = {
  language: languageCode,
  locale: localeCode,
  timeZone: 'Europe/Berlin',
  hourCycle: 'h23',
};

void validContext;

// @ts-expect-error timeZone is required
const missingTimeZone: LocaleContext = {
  language: languageCode,
  locale: localeCode,
  hourCycle: 'h23',
};

void missingTimeZone;

// @ts-expect-error hourCycle is required
const missingHourCycle: LocaleContext = {
  language: languageCode,
  locale: localeCode,
  timeZone: 'Europe/Berlin',
};

void missingHourCycle;

const contextWithFallbackPolicy: LocaleContext = {
  language: languageCode,
  locale: localeCode,
  timeZone: 'Europe/Berlin',
  hourCycle: 'h23',
  // @ts-expect-error fallbackPolicy is not part of LocaleContext
  fallbackPolicy: {
    defaultLocale: localeCode,
    localeFallbackChain: [localeCode],
  } satisfies FallbackPolicy,
};

void contextWithFallbackPolicy;

// @ts-expect-error readonly property
validContext.timeZone = 'Europe/Paris';

const validBundle: TranslationBundle = {
  locale: localeCode,
  namespace,
  entries: {
    [translationKey]: 'Hello {name}',
  },
};

void validBundle;

const invalidBundleEntries: TranslationBundle = {
  locale: localeCode,
  namespace,
  // @ts-expect-error bundle entries must be ICU source strings
  entries: {
    [translationKey]: { message: 'invalid' },
  },
};

void invalidBundleEntries;

// @ts-expect-error readonly property
validBundle.locale = localeCode;
