/**
 * Builds a valid WebPlatformConfig for unit and integration tests.
 *
 * Not part of the public package API.
 */

/** @param {string} value */
function asLocaleCode(value) {
  return value;
}

/** @param {string} value */
function asNamespace(value) {
  return value;
}

const defaultLocaleContext = {
  language: 'en',
  locale: asLocaleCode('en-GB'),
  timeZone: 'Europe/London',
  hourCycle: 'h23',
};

const defaultFormattingContext = {
  locale: asLocaleCode('en-GB'),
  timeZone: 'Europe/London',
  hourCycle: 'h23',
};

const defaultFallbackPolicy = {
  defaultLocale: asLocaleCode('en-GB'),
  localeFallbackChain: [asLocaleCode('en-GB')],
};

const defaultPreload = {
  locales: [asLocaleCode('en-GB')],
  namespaces: [asNamespace('common')],
};

export function createTestWebPlatformConfig(overrides = {}) {
  const localeContext = {
    ...defaultLocaleContext,
    ...overrides.localeContext,
  };

  return {
    localeContext,
    formattingContext: {
      ...defaultFormattingContext,
      locale: localeContext.locale,
      timeZone: localeContext.timeZone,
      hourCycle: localeContext.hourCycle,
      ...overrides.formattingContext,
    },
    fallbackPolicy: {
      ...defaultFallbackPolicy,
      ...overrides.fallbackPolicy,
    },
    preload: {
      ...defaultPreload,
      ...overrides.preload,
    },
    ...overrides,
  };
}
