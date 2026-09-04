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
 * Production cookies are Secure even when the proxy omits
 * `x-forwarded-proto`. Local HTTP E2E keeps Secure=false.
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

export type WebLocaleCookieSecureEnv = Readonly<{
  readonly AUTH_RUNTIME_ENV?: string;
  readonly NODE_ENV?: string;
}>;

export function resolveWebLocaleCookieSecureFromProtocol(
  forwardedProto: string | null | undefined,
  env: WebLocaleCookieSecureEnv = process.env,
): boolean {
  if (forwardedProto) {
    const protocol = forwardedProto.split(',')[0]?.trim().toLowerCase();

    if (protocol === 'https') {
      return true;
    }

    if (protocol === 'http') {
      return false;
    }
  }

  if (env.AUTH_RUNTIME_ENV === 'e2e') {
    return false;
  }

  return env.NODE_ENV === 'production';
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
