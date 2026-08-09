import type { FallbackPolicy, HourCycle } from '@diabetes-universe/i18n';

import { asLocaleCode, asNamespace } from './platform-type-helpers';

/**
 * Wave 1 supported locale codes for the web bootstrap boundary.
 */
export const WEB_PLATFORM_SUPPORTED_LOCALES = [
  asLocaleCode('en-GB'),
  asLocaleCode('uk-UA'),
  asLocaleCode('de-DE'),
  asLocaleCode('ru-RU'),
] as const;

export type WebPlatformSupportedLocale =
  (typeof WEB_PLATFORM_SUPPORTED_LOCALES)[number];

/**
 * Platform default locale from Localization Platform v1.0 registry.
 */
export const WEB_PLATFORM_DEFAULT_LOCALE = asLocaleCode('en-GB');

/**
 * Default hour cycle for web presentation context when not supplied by request.
 */
export const WEB_PLATFORM_DEFAULT_HOUR_CYCLE =
  'h23' as const satisfies HourCycle;

/**
 * Immutable resource fallback policy for Wave 1 locales.
 *
 * Separate from user presentation preferences; governs translation bundle
 * resolution only.
 */
export const WEB_PLATFORM_FALLBACK_POLICY = Object.freeze({
  defaultLocale: asLocaleCode('en-GB'),
  localeFallbackChain: Object.freeze([
    asLocaleCode('en-GB'),
    asLocaleCode('uk-UA'),
    asLocaleCode('de-DE'),
    asLocaleCode('ru-RU'),
  ]),
}) satisfies FallbackPolicy;

/**
 * Minimal namespace preloaded to verify translation-ready bootstrap path.
 */
export const WEB_PLATFORM_BOOTSTRAP_PRELOAD_NAMESPACE = asNamespace('common');

/**
 * Dashboard namespace preloaded for the migrated Dashboard Header vertical slice.
 */
export const WEB_PLATFORM_DASHBOARD_PRELOAD_NAMESPACE =
  asNamespace('dashboard');

export const WEB_PLATFORM_TIMELINE_PRELOAD_NAMESPACE = asNamespace('timeline');

/**
 * Application preload scope for production bootstrap.
 */
export const WEB_PLATFORM_APPLICATION_PRELOAD_NAMESPACES = Object.freeze([
  WEB_PLATFORM_BOOTSTRAP_PRELOAD_NAMESPACE,
  WEB_PLATFORM_DASHBOARD_PRELOAD_NAMESPACE,
  WEB_PLATFORM_TIMELINE_PRELOAD_NAMESPACE,
]);

/**
 * Canonical default locale per supported language (Localization Platform v1.0).
 */
export const WEB_PLATFORM_LANGUAGE_DEFAULT_LOCALES = Object.freeze({
  en: asLocaleCode('en-GB'),
  uk: asLocaleCode('uk-UA'),
  de: asLocaleCode('de-DE'),
  ru: asLocaleCode('ru-RU'),
});
