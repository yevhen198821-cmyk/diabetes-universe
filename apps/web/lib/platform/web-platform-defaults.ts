import {
  CANONICAL_LANGUAGE_DEFAULT_LOCALES,
  CANONICAL_PLATFORM_DEFAULT_LOCALE,
  CANONICAL_SUPPORTED_LOCALE_CODES,
  CANONICAL_TRANSLATION_FALLBACK_POLICY,
  type CanonicalSupportedLocale,
} from '@diabetes-universe/i18n-locales';
import type { FallbackPolicy, HourCycle } from '@diabetes-universe/i18n';

import { asNamespace } from './platform-type-helpers';

/**
 * Web bootstrap aliases of the canonical Diabetes Universe locale catalog.
 *
 * Do not redeclare supported locales here. The catalog in
 * `@diabetes-universe/i18n-locales` is the authority.
 */
export const WEB_PLATFORM_SUPPORTED_LOCALES = CANONICAL_SUPPORTED_LOCALE_CODES;

export type WebPlatformSupportedLocale = CanonicalSupportedLocale;

/**
 * Platform default locale from the canonical Diabetes Universe catalog.
 */
export const WEB_PLATFORM_DEFAULT_LOCALE = CANONICAL_PLATFORM_DEFAULT_LOCALE;

/**
 * Default hour cycle for web presentation context when not supplied by request.
 */
export const WEB_PLATFORM_DEFAULT_HOUR_CYCLE =
  'h23' as const satisfies HourCycle;

/**
 * Immutable resource fallback policy: requested locale → en-GB.
 *
 * Separate from user presentation preferences; governs translation bundle
 * resolution only.
 */
export const WEB_PLATFORM_FALLBACK_POLICY =
  CANONICAL_TRANSLATION_FALLBACK_POLICY satisfies FallbackPolicy;

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

export const WEB_PLATFORM_QUICK_ADD_PRELOAD_NAMESPACE =
  asNamespace('quick-add');

export const WEB_PLATFORM_ACCOUNT_PRELOAD_NAMESPACE = asNamespace('account');

/**
 * Application preload scope for production bootstrap.
 */
export const WEB_PLATFORM_APPLICATION_PRELOAD_NAMESPACES = Object.freeze([
  WEB_PLATFORM_BOOTSTRAP_PRELOAD_NAMESPACE,
  WEB_PLATFORM_ACCOUNT_PRELOAD_NAMESPACE,
  WEB_PLATFORM_DASHBOARD_PRELOAD_NAMESPACE,
  WEB_PLATFORM_TIMELINE_PRELOAD_NAMESPACE,
  WEB_PLATFORM_QUICK_ADD_PRELOAD_NAMESPACE,
]);

/**
 * Canonical default locale per supported language.
 */
export const WEB_PLATFORM_LANGUAGE_DEFAULT_LOCALES =
  CANONICAL_LANGUAGE_DEFAULT_LOCALES;
