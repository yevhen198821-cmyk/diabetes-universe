'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { parseCanonicalSupportedLocale } from '@diabetes-universe/i18n-locales';

import {
  createWebLocaleCookieWriteOptions,
  resolveWebLocaleCookieSecureFromProtocol,
  WEB_LOCALE_COOKIE_NAME,
} from './web-locale-cookie';

const LANGUAGE_SELECTION_PATH = '/account/language';

/**
 * Persists an explicit user locale selection and rebuilds presentation
 * from the new cookie on the next server render.
 */
export async function persistWebLocalePreferenceAction(
  formData: FormData,
): Promise<void> {
  const requested = String(formData.get('locale') ?? '');
  const locale = parseCanonicalSupportedLocale(requested);

  if (!locale) {
    redirect(LANGUAGE_SELECTION_PATH);
  }

  const headerStore = await headers();
  const secure = resolveWebLocaleCookieSecureFromProtocol(
    headerStore.get('x-forwarded-proto'),
  );
  const cookieStore = await cookies();
  const options = createWebLocaleCookieWriteOptions(secure);

  cookieStore.set({
    name: WEB_LOCALE_COOKIE_NAME,
    value: locale,
    ...options,
  });

  revalidatePath('/', 'layout');
  redirect(LANGUAGE_SELECTION_PATH);
}
