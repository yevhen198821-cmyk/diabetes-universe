export const AUTH_COOKIE_PREFIX = 'du-auth';

export const AUTH_MAGIC_LINK_EXPIRES_IN_SECONDS = 10 * 60;

export const AUTH_SESSION_EXPIRES_IN_SECONDS = 7 * 24 * 60 * 60;

export const AUTH_SESSION_UPDATE_AGE_SECONDS = 24 * 60 * 60;

export const AUTH_FRESH_AUTH_WINDOW_SECONDS = 10 * 60;

export const AUTH_ALLOWED_CALLBACK_PATHS = [
  '/',
  '/account',
  '/account/about',
  '/account/diabetes',
  '/account/settings',
  '/account/security',
  '/account/security/sessions',
  '/timeline',
  '/auth/error',
] as const;

export type AuthAllowedCallbackPath =
  (typeof AUTH_ALLOWED_CALLBACK_PATHS)[number];
