import assert from 'node:assert/strict';
import test from 'node:test';

import { createWebPlatformConfig } from '../create-web-platform-config.ts';
import {
  WEB_PLATFORM_APPLICATION_PRELOAD_NAMESPACES,
  WEB_PLATFORM_BOOTSTRAP_PRELOAD_NAMESPACE,
  WEB_PLATFORM_DASHBOARD_PRELOAD_NAMESPACE,
  WEB_PLATFORM_TIMELINE_PRELOAD_NAMESPACE,
  WEB_PLATFORM_DEFAULT_HOUR_CYCLE,
  WEB_PLATFORM_DEFAULT_LOCALE,
  WEB_PLATFORM_FALLBACK_POLICY,
} from '../web-platform-defaults.ts';

const explicitTimeZoneContext = {
  acceptLanguage: 'uk-UA',
  cookieTimeZone: 'Europe/Kyiv',
};

test('createWebPlatformConfig builds matching LocaleContext and FormattingContext', () => {
  const config = createWebPlatformConfig(
    explicitTimeZoneContext,
    'Europe/Kyiv',
  );

  assert.equal(config.localeContext.locale, 'uk-UA');
  assert.equal(config.localeContext.language, 'uk');
  assert.equal(config.localeContext.timeZone, 'Europe/Kyiv');
  assert.equal(config.localeContext.hourCycle, WEB_PLATFORM_DEFAULT_HOUR_CYCLE);
  assert.equal(config.formattingContext.locale, 'uk-UA');
  assert.equal(config.formattingContext.timeZone, 'Europe/Kyiv');
  assert.equal(
    config.formattingContext.hourCycle,
    WEB_PLATFORM_DEFAULT_HOUR_CYCLE,
  );
});

test('createWebPlatformConfig keeps resource FallbackPolicy separate from user preferences', () => {
  const config = createWebPlatformConfig(
    { acceptLanguage: 'ru-RU', cookieTimeZone: 'Europe/Moscow' },
    'Europe/Moscow',
  );

  assert.deepEqual(config.fallbackPolicy, WEB_PLATFORM_FALLBACK_POLICY);
  assert.notEqual(
    config.fallbackPolicy.defaultLocale,
    config.localeContext.locale,
  );
});

test('createWebPlatformConfig declares application preload scope for bootstrap and dashboard header', () => {
  const config = createWebPlatformConfig(
    { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
    'Europe/London',
  );

  assert.deepEqual(config.preload, {
    namespaces: [
      WEB_PLATFORM_BOOTSTRAP_PRELOAD_NAMESPACE,
      'account',
      WEB_PLATFORM_DASHBOARD_PRELOAD_NAMESPACE,
      WEB_PLATFORM_TIMELINE_PRELOAD_NAMESPACE,
    ],
    locales: ['en-GB'],
  });
  assert.deepEqual(
    config.preload.namespaces,
    WEB_PLATFORM_APPLICATION_PRELOAD_NAMESPACES,
  );
});

test('createWebPlatformConfig rejects invalid explicit time zone for developer misuse', () => {
  assert.throws(
    () =>
      createWebPlatformConfig({ acceptLanguage: 'en-GB' }, 'Not/A_TimeZone'),
    /explicitTimeZone must be a valid IANA time zone/,
  );
});

test('createWebPlatformConfig returns an immutable plain DTO', () => {
  const config = createWebPlatformConfig({}, 'UTC');

  assert.equal(Object.isFrozen(config), true);
  assert.equal(Object.isFrozen(config.localeContext), true);
  assert.equal(Object.isFrozen(config.formattingContext), true);
  assert.equal(Object.isFrozen(config.fallbackPolicy), true);
  assert.equal(Object.isFrozen(config.preload), true);
  assert.equal(Object.isFrozen(config.preload.namespaces), true);
  assert.equal(Object.isFrozen(config.preload.locales), true);
  assert.equal(typeof config.localeContext.locale, 'string');
  assert.equal(config.localeContext.locale, WEB_PLATFORM_DEFAULT_LOCALE);
});

test('createWebPlatformConfig does not embed request objects or functions', () => {
  const config = createWebPlatformConfig(
    { acceptLanguage: 'de-DE', cookieTimeZone: 'Europe/Berlin' },
    'Europe/Berlin',
  );
  const serialized = JSON.parse(JSON.stringify(config));

  assert.deepEqual(serialized.localeContext.locale, 'de-DE');
  assert.equal(serialized.fallbackPolicy.defaultLocale, 'en-GB');
});
