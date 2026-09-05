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
 * Production cookies are always Secure. The dedicated E2E runtime exception
 * is the only path that may keep HTTP cookies.
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

export function isWebLocaleCookieE2ERuntime(
  env: WebLocaleCookieSecureEnv = process.env,
): boolean {
  return env.AUTH_RUNTIME_ENV === 'e2e';
}

function firstForwardedProtocol(
  forwardedProto: string | null | undefined,
): string | undefined {
  return forwardedProto?.split(',')[0]?.trim().toLowerCase();
}

export function resolveWebLocaleCookieSecureFromProtocol(
  forwardedProto: string | null | undefined,
  env: WebLocaleCookieSecureEnv = process.env,
): boolean {
  const protocol = firstForwardedProtocol(forwardedProto);

  if (isWebLocaleCookieE2ERuntime(env)) {
    return protocol === 'https';
  }

  if (env.NODE_ENV === 'production') {
    return true;
  }

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
