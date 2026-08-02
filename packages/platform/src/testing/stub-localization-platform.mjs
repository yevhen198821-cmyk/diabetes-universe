/**
 * Minimal LocalizationPlatform stub for Platform Runtime Foundation unit tests.
 *
 * Not part of the public package API.
 */
export function createStubLocalizationPlatform(overrides = {}) {
  return {
    localeContext: {
      language: 'en',
      locale: 'en-GB',
      timeZone: 'UTC',
      hourCycle: 'h23',
    },
    fallbackPolicy: {
      localeFallbackChain: ['en-GB'],
      namespaceFallbackChain: [],
    },
    translate: () => ({
      key: 'common.actions.save',
      value: 'Save',
      locale: 'en-GB',
      namespace: 'common',
      resolvedFromFallback: false,
    }),
    hasTranslation: () => true,
    getBundle: async () => ({
      locale: 'en-GB',
      namespace: 'common',
      messages: {},
    }),
    getSupportedLocales: () => ['en-GB'],
    getDefaultLocale: () => 'en-GB',
    getNamespaces: () => ['common'],
    ...overrides,
  };
}
