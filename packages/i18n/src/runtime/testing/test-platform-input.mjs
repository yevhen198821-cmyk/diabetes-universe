const localeContext = {
  language: 'en',
  locale: 'en-GB',
  timeZone: 'Europe/London',
  hourCycle: 'h23',
};

const fallbackPolicy = {
  defaultLocale: 'en-GB',
  localeFallbackChain: ['en-GB'],
};

const namespaces = [
  'common',
  'dashboard',
  'timeline',
  'quick-add',
  'validation',
  'errors',
];

const catalog = {
  'en-GB': {
    common: {
      'common.actions.save': 'Save',
      'common.actions.cancel': 'Cancel',
      'common.actions.close': 'Close',
    },
    dashboard: {
      'dashboard.header.title': 'Home',
    },
    timeline: {
      'timeline.header.title': 'Timeline',
    },
    'quick-add': {
      'quick-add.button.label': 'Add event',
    },
    validation: {
      'validation.required': 'This field is required',
    },
    errors: {
      'errors.generic': 'Something went wrong. Please try again.',
    },
  },
};

const localeChain = ['en-GB', 'uk-UA', 'de-DE', 'ru-RU'];

function createTestBundleLoader(policy = fallbackPolicy) {
  return {
    async load({ locale, namespace }) {
      const localesToTry = uniqueLocales([
        locale,
        ...policy.localeFallbackChain,
      ]);

      for (const candidateLocale of localesToTry) {
        const entries = catalog[candidateLocale]?.[namespace];

        if (entries) {
          return {
            locale: candidateLocale,
            namespace,
            entries,
          };
        }
      }

      throw new Error(
        `Translation bundle not found for locale "${locale}" within fallback chain [${localesToTry.join(', ')}]`,
      );
    },
  };
}

function createTestLocaleRegistryLoader() {
  return {
    async load() {
      return {
        platformDefaultLocale: 'en-GB',
        languageDefaults: [
          { language: 'en', defaultLocale: 'en-GB' },
          { language: 'uk', defaultLocale: 'uk-UA' },
          { language: 'de', defaultLocale: 'de-DE' },
          { language: 'ru', defaultLocale: 'ru-RU' },
        ],
        namespaces,
      };
    },
  };
}

export function createTestPlatformInput(overrides = {}) {
  const policy = overrides.fallbackPolicy ?? fallbackPolicy;

  return {
    localeContext,
    fallbackPolicy: policy,
    bundleLoader: createTestBundleLoader(policy),
    localeRegistryLoader: createTestLocaleRegistryLoader(),
    ...overrides,
  };
}

function uniqueLocales(locales) {
  return [...new Set(locales)];
}

void localeChain;
