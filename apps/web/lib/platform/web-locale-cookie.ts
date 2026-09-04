import { parseCanonicalSupportedLocale } from '@diabetes-universe/i18n-locales';
import type { CanonicalSupportedLocale } from '@diabetes-universe/i18n-locales';

/**
 * First-party server-readable locale preference cookie.
 *
 * This is the only Web locale persistence authority. localStorage is not used.
 */
export const WEB_LOCALE_COOKIE_NAME = 'du-web-locale';

export const WEB_LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export const WEB_LOCALE_COOKIE_PATH = '/';

export type WebLocaleCookieWriteOptions = Readonly<{
  readonly httpOnly: true;
  readonly maxAge: number;
  readonly path: string;
  readonly sameSite: 'lax';
  readonly secure: boolean;
}>;

/**
 * Builds the single writer options for the locale cookie.
 *
 * `secure` is true only for HTTPS requests so local HTTP E2E can persist it.
 */
export function createWebLocaleCookieWriteOptions(
  secure: boolean,
): WebLocaleCookieWriteOptions {
  return Object.freeze({
    httpOnly: true,
    maxAge: WEB_LOCALE_COOKIE_MAX_AGE_SECONDS,
    path: WEB_LOCALE_COOKIE_PATH,
    sameSite: 'lax',
    secure,
  });
}

export function parseWebLocaleCookieValue(
  value: string | null | undefined,
): CanonicalSupportedLocale | null {
  return parseCanonicalSupportedLocale(value);
}

export function resolveWebLocaleCookieSecureFromProtocol(
  forwardedProto: string | null | undefined,
): boolean {
  if (!forwardedProto) {
    return false;
  }

  const protocol = forwardedProto.split(',')[0]?.trim().toLowerCase();
  return protocol === 'https';
}

export type HeaderLike = Readonly<{
  get(name: string): string | null;
}>;

export type CookieLike = Readonly<{
  get(name: string): { readonly value: string } | undefined;
}>;

/**
 * Reads presentation inputs from Next request stores.
 *
 * Locale cookie is parsed later by `resolveRequestLocale()`. Invalid values
 * are ignored there and never fail bootstrap.
 */
export function readRequestPresentationContextFromStores(
  headerStore: HeaderLike,
  cookieStore: CookieLike,
) {
  return {
    acceptLanguage: headerStore.get('accept-language') ?? undefined,
    cookieLocale: cookieStore.get(WEB_LOCALE_COOKIE_NAME)?.value,
  };
}
