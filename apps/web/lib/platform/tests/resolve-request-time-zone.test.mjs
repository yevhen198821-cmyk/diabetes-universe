import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveRequestLocale } from '../resolve-request-locale.ts';
import {
  isValidTimeZone,
  resolveRequestTimeZone,
} from '../resolve-request-time-zone.ts';

test('resolveRequestTimeZone uses a valid explicit cookie time zone when present', () => {
  assert.equal(
    resolveRequestTimeZone({ cookieTimeZone: 'America/Los_Angeles' }),
    'America/Los_Angeles',
  );
});

test('resolveRequestTimeZone returns null for an invalid explicit time zone', () => {
  assert.equal(
    resolveRequestTimeZone({ cookieTimeZone: 'Not/A_TimeZone' }),
    null,
  );
});

test('resolveRequestTimeZone returns null when explicit time zone is missing', () => {
  assert.equal(resolveRequestTimeZone({}), null);
});

test('resolveRequestTimeZone does not derive time zone from locale or Accept-Language', () => {
  const context = {
    cookieLocale: 'de-DE',
    acceptLanguage: 'de-DE',
  };

  assert.equal(resolveRequestLocale(context), 'de-DE');
  assert.equal(resolveRequestTimeZone(context), null);
});

test('isValidTimeZone accepts IANA identifiers and rejects malformed values', () => {
  assert.equal(isValidTimeZone('UTC'), true);
  assert.equal(isValidTimeZone('Europe/London'), true);
  assert.equal(isValidTimeZone(''), false);
  assert.equal(isValidTimeZone('Invalid/Zone'), false);
});
