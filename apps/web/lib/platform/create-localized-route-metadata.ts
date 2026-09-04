import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';

import { LOCALE_RESOURCE_CATALOG } from '@diabetes-universe/i18n-locales';

import { resolveRequestLocale } from './resolve-request-locale';
import { readRequestPresentationContextFromStores } from './web-locale-cookie';

type CatalogMessageKey = string;

/**
 * Builds request-aware route metadata from the catalog already used by Web.
 *
 * Titles stay short because the root layout template appends the brand.
 */
export async function createLocalizedRouteMetadata(options: {
  readonly titleKey: CatalogMessageKey;
  readonly descriptionKey?: CatalogMessageKey;
}): Promise<Metadata> {
  const headerStore = await headers();
  const cookieStore = await cookies();
  const locale = resolveRequestLocale(
    readRequestPresentationContextFromStores(headerStore, cookieStore),
  );
  const messages =
    LOCALE_RESOURCE_CATALOG[locale]?.messages ??
    LOCALE_RESOURCE_CATALOG['en-GB'].messages;

  return {
    title: messages[options.titleKey],
    ...(options.descriptionKey
      ? { description: messages[options.descriptionKey] }
      : {}),
  };
}
