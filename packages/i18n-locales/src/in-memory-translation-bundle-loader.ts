import type {
  FallbackPolicy,
  TranslationBundle,
  TranslationBundleLoadRequest,
  TranslationBundleLoader,
} from '@diabetes-universe/i18n';

import { extractNamespaceEntries } from './extract-namespace-entries';
import { LOCALE_RESOURCE_CATALOG } from './locale-resource-catalog';
import { resolveLocaleChain } from './resolve-locale-chain';

export class TranslationBundleNotFoundError extends Error {
  readonly requestedLocale: string;
  readonly attemptedLocales: readonly string[];

  constructor(requestedLocale: string, attemptedLocales: readonly string[]) {
    super(
      `Translation bundle not found for locale "${requestedLocale}" within fallback chain [${attemptedLocales.join(', ')}]`,
    );
    this.name = 'TranslationBundleNotFoundError';
    this.requestedLocale = requestedLocale;
    this.attemptedLocales = attemptedLocales;
  }
}

/**
 * In-memory translation bundle loader backed by @diabetes-universe/locales.
 */
export class InMemoryTranslationBundleLoader implements TranslationBundleLoader {
  private readonly fallbackPolicy: FallbackPolicy;

  constructor(fallbackPolicy: FallbackPolicy) {
    this.fallbackPolicy = fallbackPolicy;
  }

  async load(
    request: TranslationBundleLoadRequest,
  ): Promise<TranslationBundle> {
    const localesToTry = resolveLocaleChain(
      request.locale,
      this.fallbackPolicy,
    );

    for (const locale of localesToTry) {
      const resource = LOCALE_RESOURCE_CATALOG[locale];

      if (!resource) {
        continue;
      }

      return {
        locale: resource.locale,
        namespace: request.namespace,
        entries: extractNamespaceEntries(resource.messages, request.namespace),
      };
    }

    throw new TranslationBundleNotFoundError(request.locale, localesToTry);
  }
}
