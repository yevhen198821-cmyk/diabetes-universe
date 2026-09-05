import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';

import {
  LOCALE_RESOURCE_CATALOG,
  type CanonicalTranslationKey,
} from '@diabetes-universe/i18n-locales';

import { resolveRequestLocale } from './resolve-request-locale';
import { readRequestPresentationContextFromStores } from './web-locale-cookie';

const BRAND_TITLE_SUFFIX = 'Diabetes Universe';

/**
 * Builds request-aware route metadata from the catalog already used by Web.
 *
 * Child `generateMetadata` replaces the layout title, so the brand suffix is
 * applied here instead of relying on the unused `%s | Diabetes Universe`
 * template.
 */
export async function createLocalizedRouteMetadata(options: {
  readonly titleKey: CanonicalTranslationKey;
  readonly descriptionKey?: CanonicalTranslationKey;
}): Promise<Metadata> {
  const headerStore = await headers();
  const cookieStore = await cookies();
  const locale = resolveRequestLocale(
    readRequestPresentationContextFromStores(headerStore, cookieStore),
  );
  const messages =
    LOCALE_RESOURCE_CATALOG[locale]?.messages ??
    LOCALE_RESOURCE_CATALOG['en-GB'].messages;
  const title = messages[options.titleKey];

  return {
    title: title ? `${title} | ${BRAND_TITLE_SUFFIX}` : BRAND_TITLE_SUFFIX,
    ...(options.descriptionKey
      ? { description: messages[options.descriptionKey] }
      : {}),
  };
}
