import assert from 'node:assert/strict';
import test from 'node:test';

import {
  __clearIntlFormatterCacheForTests,
  __getCachedFormatterForTests,
  __getIntlFormatterCacheSizeForTests,
  createDateTimeFormatCacheKey,
  createDurationListFormatCacheKey,
  createDurationUnitFormatCacheKey,
  createNumberFormatCacheKey,
  createRelativeTimeFormatCacheKey,
  getCachedDateTimeFormat,
  getCachedDurationListFormat,
  getCachedDurationUnitFormat,
  getCachedNumberFormat,
  getCachedRelativeTimeFormat,
} from './cache/intl-formatter-cache.ts';
import { createPlatformFormatter } from './create-platform-formatter.ts';
import { isDateTimeFormatRangeSupported } from './range.ts';

const LOCALES = ['en-GB', 'uk-UA', 'de-DE', 'ru-RU'];

/** @param {string} locale */
function createContext(locale, overrides = {}) {
  return {
    locale,
    timeZone: 'UTC',
    ...overrides,
  };
}

test.beforeEach(() => {
  __clearIntlFormatterCacheForTests();
});

test('createPlatformFormatter returns a PlatformFormatter with all methods', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(typeof formatter.formatDate, 'function');
  assert.equal(typeof formatter.formatTime, 'function');
  assert.equal(typeof formatter.formatDateTime, 'function');
  assert.equal(typeof formatter.formatRelativeTime, 'function');
  assert.equal(typeof formatter.formatNumber, 'function');
  assert.equal(typeof formatter.formatPercentage, 'function');
  assert.equal(typeof formatter.formatCurrency, 'function');
  assert.equal(typeof formatter.formatDuration, 'function');
  assert.equal(typeof formatter.formatRange, 'function');
  assert.equal(typeof formatter.formatMeasurement, 'function');
});

test('createPlatformFormatter does not mutate the provided context', () => {
  const context = createContext('en-GB', { hourCycle: 'h23' });
  const snapshot = { ...context };

  createPlatformFormatter(context);

  assert.deepEqual(context, snapshot);
});

test('createPlatformFormatter rejects an empty locale', () => {
  assert.throws(
    () =>
      createPlatformFormatter({
        locale: '   ',
        timeZone: 'UTC',
      }),
    /locale must not be empty/,
  );
});

test('createPlatformFormatter rejects an empty timeZone', () => {
  assert.throws(
    () =>
      createPlatformFormatter({
        locale: 'en-GB',
        timeZone: '',
      }),
    /timeZone must not be empty/,
  );
});

test('createPlatformFormatter rejects an invalid locale', () => {
  assert.throws(
    () =>
      createPlatformFormatter({
        locale: 'invalid-locale-xyz',
        timeZone: 'UTC',
      }),
    /locale "invalid-locale-xyz" is not supported/,
  );
});

test('createPlatformFormatter rejects an invalid timeZone', () => {
  assert.throws(
    () =>
      createPlatformFormatter({
        locale: 'en-GB',
        timeZone: 'Not/A_Timezone',
      }),
    /timeZone "Not\/A_Timezone" is not supported/,
  );
});

test('DateLike accepts a valid Date', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.match(formatter.formatDate(new Date('2026-08-02T12:00:00Z')), /2026/);
});

test('DateLike accepts an ISO string with Z', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.match(formatter.formatDate('2026-08-02T12:00:00Z'), /2026/);
});

test('DateLike accepts an ISO string with a numeric offset', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.match(formatter.formatDate('2026-08-02T15:30:00+02:00'), /2026/);
});

test('DateLike rejects an invalid Date', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.throws(
    () => formatter.formatDate(new Date('invalid')),
    /invalid Date/,
  );
});

test('DateLike rejects an empty string', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.throws(() => formatter.formatDate(''), /must not be empty/);
});

test('DateLike rejects an ISO string without a timezone', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.throws(
    () => formatter.formatDate('2026-08-02T12:00:00'),
    /explicit Z or numeric offset/,
  );
});

test('DateLike rejects a date-only ISO string', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.throws(
    () => formatter.formatDate('2026-08-02'),
    /explicit Z or numeric offset/,
  );
});

test('DateLike rejects a localized date string', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.throws(
    () => formatter.formatDate('01/02/2026'),
    /explicit Z or numeric offset/,
  );
});

for (const invalidIso of [
  '2026-13-01T10:00:00Z',
  '2026-02-30T10:00:00Z',
  '2026-01-01T25:61:00Z',
]) {
  test(`DateLike rejects invalid ISO instant ${invalidIso}`, () => {
    const formatter = createPlatformFormatter(createContext('en-GB'));

    assert.throws(
      () => formatter.formatDate(invalidIso),
      /not a valid instant/,
    );
  });
}

test('formatDate formats the same instant differently across time zones', () => {
  const instant = '2026-01-01T00:30:00Z';
  const utcFormatter = createPlatformFormatter(
    createContext('en-GB', { timeZone: 'UTC' }),
  );
  const laFormatter = createPlatformFormatter(
    createContext('en-GB', { timeZone: 'America/Los_Angeles' }),
  );

  const utcDate = utcFormatter.formatDate(instant);
  const laDate = laFormatter.formatDate(instant);

  assert.notEqual(utcDate, laDate);
  assert.match(utcDate, /2026/);
  assert.match(laDate, /2025|2026/);
});

test('formatDate handles calendar date transitions across time zones', () => {
  const instant = '2025-12-31T16:00:00Z';
  const utcFormatter = createPlatformFormatter(
    createContext('en-GB', { timeZone: 'UTC' }),
  );
  const tokyoFormatter = createPlatformFormatter(
    createContext('en-GB', { timeZone: 'Asia/Tokyo' }),
  );

  const utcDate = utcFormatter.formatDate(instant, { dateStyle: 'long' });
  const tokyoDate = tokyoFormatter.formatDate(instant, { dateStyle: 'long' });

  assert.match(utcDate, /2025/);
  assert.match(tokyoDate, /2026/);
  assert.notEqual(utcDate, tokyoDate);
});

test('formatTime applies hourCycle h12', () => {
  const formatter = createPlatformFormatter(
    createContext('en-GB', { hourCycle: 'h12', timeZone: 'UTC' }),
  );

  const formatted = formatter.formatTime('2026-08-02T14:30:00Z');

  assert.match(formatted, /pm|PM|am|AM/);
});

test('formatTime applies hourCycle h23', () => {
  const formatter = createPlatformFormatter(
    createContext('en-GB', { hourCycle: 'h23', timeZone: 'UTC' }),
  );

  const formatted = formatter.formatTime('2026-08-02T14:30:00Z');

  assert.match(formatted, /14:30|14\.30/);
  assert.doesNotMatch(formatted, /pm|PM|am|AM/);
});

test('formatDate uses explicit dateStyle when provided', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  const shortDate = formatter.formatDate('2026-08-02T12:00:00Z', {
    dateStyle: 'short',
  });
  const longDate = formatter.formatDate('2026-08-02T12:00:00Z', {
    dateStyle: 'long',
  });

  assert.notEqual(shortDate, longDate);
});

test('formatTime uses explicit timeStyle when provided', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  const shortTime = formatter.formatTime('2026-08-02T12:00:00Z', {
    timeStyle: 'short',
  });
  const longTime = formatter.formatTime('2026-08-02T12:00:00Z', {
    timeStyle: 'long',
  });

  assert.notEqual(shortTime, longTime);
});

test('formatDate uses medium as the default dateStyle', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));
  const expected = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date('2026-08-02T12:00:00Z'));

  assert.equal(formatter.formatDate('2026-08-02T12:00:00Z'), expected);
});

test('formatTime uses short as the default timeStyle', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));
  const expected = new Intl.DateTimeFormat('en-GB', {
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date('2026-08-02T12:00:00Z'));

  assert.equal(formatter.formatTime('2026-08-02T12:00:00Z'), expected);
});

test('formatDateTime uses medium and short defaults', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));
  const expected = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date('2026-08-02T12:00:00Z'));

  assert.equal(formatter.formatDateTime('2026-08-02T12:00:00Z'), expected);
});

test('formatDate does not mutate the input Date', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));
  const input = new Date('2026-08-02T12:00:00Z');
  const originalTime = input.getTime();

  formatter.formatDate(input);

  assert.equal(input.getTime(), originalTime);
});

for (const locale of LOCALES) {
  test(`formatNumber formats values for ${locale}`, () => {
    const formatter = createPlatformFormatter(createContext(locale));

    assert.match(formatter.formatNumber(1234.5), /1/);
    assert.match(formatter.formatNumber(1234.5), /234/);
  });
}

test('formatNumber uses a dot decimal separator for en-GB', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(formatter.formatNumber(1234.5), '1,234.5');
});

test('formatNumber uses a comma decimal separator for de-DE', () => {
  const formatter = createPlatformFormatter(createContext('de-DE'));

  assert.equal(formatter.formatNumber(1234.5), '1.234,5');
});

test('formatNumber supports grouping', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(formatter.formatNumber(1000000), '1,000,000');
});

test('formatNumber supports useGrouping false', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(
    formatter.formatNumber(1000000, { useGrouping: false }),
    '1000000',
  );
});

test('formatNumber formats negative numbers', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(formatter.formatNumber(-42.5), '-42.5');
});

test('formatNumber formats zero', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(formatter.formatNumber(0), '0');
});

test('formatNumber formats large numbers', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(formatter.formatNumber(9876543210.12), '9,876,543,210.12');
});

test('formatNumber applies minimumFractionDigits and maximumFractionDigits', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(
    formatter.formatNumber(1, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    '1.00',
  );
});

test('formatNumber rejects NaN', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.throws(() => formatter.formatNumber(Number.NaN), /finite number/);
});

test('formatNumber rejects Infinity', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.throws(
    () => formatter.formatNumber(Number.POSITIVE_INFINITY),
    /finite number/,
  );
});

test('formatNumber rejects -Infinity', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.throws(
    () => formatter.formatNumber(Number.NEGATIVE_INFINITY),
    /finite number/,
  );
});

test('formatNumber rejects an invalid fraction policy', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.throws(
    () =>
      formatter.formatNumber(1, {
        minimumFractionDigits: 3,
        maximumFractionDigits: 1,
      }),
    /minimumFractionDigits must not be greater than maximumFractionDigits/,
  );
});

test('formatPercentage formats 0.25 as 25% for en-GB', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(formatter.formatPercentage(0.25), '25%');
});

test('formatPercentage formats 1 as 100% for en-GB', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(formatter.formatPercentage(1), '100%');
});

test('formatPercentage formats zero', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(formatter.formatPercentage(0), '0%');
});

test('formatPercentage formats negative values', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(formatter.formatPercentage(-0.25), '-25%');
});

test('formatPercentage applies fraction options', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(
    formatter.formatPercentage(0.256, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }),
    '25.6%',
  );
});

test('formatPercentage produces locale-specific output for de-DE', () => {
  const formatter = createPlatformFormatter(createContext('de-DE'));

  assert.equal(formatter.formatPercentage(0.25), '25\u00a0%');
});

test('formatPercentage rejects invalid numeric values', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.throws(() => formatter.formatPercentage(Number.NaN), /finite number/);
  assert.throws(
    () => formatter.formatPercentage(Number.POSITIVE_INFINITY),
    /finite number/,
  );
});

test('formatCurrency uses an explicit currency code', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(formatter.formatCurrency(10, 'GBP'), '£10.00');
});

test('formatCurrency uses FormattingContext.currency when explicit code is omitted', () => {
  const formatter = createPlatformFormatter(
    createContext('en-GB', { currency: 'EUR' }),
  );

  assert.equal(formatter.formatCurrency(10), '€10.00');
});

test('formatCurrency prefers explicit currency over FormattingContext.currency', () => {
  const formatter = createPlatformFormatter(
    createContext('en-GB', { currency: 'EUR' }),
  );

  assert.equal(formatter.formatCurrency(10, 'USD'), 'US$10.00');
});

test('formatCurrency formats GBP for en-GB', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(formatter.formatCurrency(1234.5, 'GBP'), '£1,234.50');
});

test('formatCurrency formats EUR for de-DE', () => {
  const formatter = createPlatformFormatter(createContext('de-DE'));

  assert.equal(formatter.formatCurrency(1234.5, 'EUR'), '1.234,50\u00a0€');
});

for (const locale of LOCALES) {
  test(`formatCurrency formats values for ${locale}`, () => {
    const formatter = createPlatformFormatter(createContext(locale));

    assert.match(formatter.formatCurrency(10, 'EUR'), /10/);
    assert.match(formatter.formatCurrency(10, 'EUR'), /€|EUR/);
  });
}

test('formatCurrency supports currencyDisplay symbol', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(
    formatter.formatCurrency(10, 'EUR', { currencyDisplay: 'symbol' }),
    '€10.00',
  );
});

test('formatCurrency supports currencyDisplay code', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(
    formatter.formatCurrency(10, 'EUR', { currencyDisplay: 'code' }),
    'EUR\u00a010.00',
  );
});

test('formatCurrency supports currencyDisplay name', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.match(
    formatter.formatCurrency(10, 'EUR', { currencyDisplay: 'name' }),
    /euro/i,
  );
  assert.match(
    formatter.formatCurrency(10, 'EUR', { currencyDisplay: 'name' }),
    /10\.00/,
  );
});

test('formatCurrency supports grouping', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(formatter.formatCurrency(1000000, 'GBP'), '£1,000,000.00');
});

test('formatCurrency supports fraction options', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(
    formatter.formatCurrency(10, 'GBP', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }),
    '£10',
  );
});

test('formatCurrency formats negative values', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(formatter.formatCurrency(-10, 'GBP'), '-£10.00');
});

test('formatCurrency formats zero', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(formatter.formatCurrency(0, 'GBP'), '£0.00');
});

test('formatCurrency rejects missing currency', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.throws(
    () => formatter.formatCurrency(10),
    /requires an explicit currency code or FormattingContext.currency/,
  );
});

test('formatCurrency rejects empty currency', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.throws(() => formatter.formatCurrency(10, '   '), /must not be empty/);
});

test('formatCurrency rejects invalid currency', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.throws(
    () => formatter.formatCurrency(10, 'INVALID'),
    /not supported by Intl/,
  );
});

test('formatCurrency rejects NaN', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.throws(
    () => formatter.formatCurrency(Number.NaN, 'GBP'),
    /finite number/,
  );
});

test('formatCurrency rejects Infinity', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.throws(
    () => formatter.formatCurrency(Number.POSITIVE_INFINITY, 'GBP'),
    /finite number/,
  );
});

test('formatCurrency rejects -Infinity', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.throws(
    () => formatter.formatCurrency(Number.NEGATIVE_INFINITY, 'GBP'),
    /finite number/,
  );
});

test('formatCurrency rejects invalid fraction policy', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.throws(
    () =>
      formatter.formatCurrency(10, 'GBP', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 1,
      }),
    /minimumFractionDigits must not be greater than maximumFractionDigits/,
  );
});

test('cache reuses currency NumberFormat instances for identical parameters', () => {
  const first = getCachedNumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  });
  const second = getCachedNumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  });

  assert.equal(first, second);
});

test('cache creates separate currency NumberFormat entries for different currencies', () => {
  const gbp = getCachedNumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  });
  const usd = getCachedNumberFormat('en-GB', {
    style: 'currency',
    currency: 'USD',
  });

  assert.notEqual(gbp, usd);
});

const REFERENCE_INSTANT = '2026-08-02T12:00:00Z';

test('formatRelativeTime formats seconds in the past', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(
    formatter.formatRelativeTime('2026-08-02T11:59:30Z', REFERENCE_INSTANT),
    '30 seconds ago',
  );
});

test('formatRelativeTime formats minutes in the past', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(
    formatter.formatRelativeTime('2026-08-02T11:30:00Z', REFERENCE_INSTANT),
    '30 minutes ago',
  );
});

test('formatRelativeTime formats hours in the past', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(
    formatter.formatRelativeTime('2026-08-02T10:00:00Z', REFERENCE_INSTANT),
    '2 hours ago',
  );
});

test('formatRelativeTime formats days in the past', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(
    formatter.formatRelativeTime('2026-07-31T12:00:00Z', REFERENCE_INSTANT),
    '2 days ago',
  );
});

test('formatRelativeTime formats future values', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(
    formatter.formatRelativeTime('2026-08-02T14:00:00Z', REFERENCE_INSTANT),
    'in 2 hours',
  );
});

test('formatRelativeTime supports numeric always', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(
    formatter.formatRelativeTime('2026-08-02T14:00:00Z', REFERENCE_INSTANT, {
      numeric: 'always',
    }),
    'in 2 hours',
  );
});

test('formatRelativeTime supports numeric auto', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  const formatted = formatter.formatRelativeTime(
    '2026-08-02T12:00:00Z',
    REFERENCE_INSTANT,
    { numeric: 'auto' },
  );

  assert.match(formatted, /now|0 seconds|today/i);
});

test('formatRelativeTime supports explicit unit', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(
    formatter.formatRelativeTime('2026-08-02T14:00:00Z', REFERENCE_INSTANT, {
      unit: 'minute',
    }),
    'in 120 minutes',
  );
});

test('formatRelativeTime selects seconds automatically below 60 seconds', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(
    formatter.formatRelativeTime('2026-08-02T11:59:45Z', REFERENCE_INSTANT),
    '15 seconds ago',
  );
});

for (const locale of LOCALES) {
  test(`formatRelativeTime formats values for ${locale}`, () => {
    const formatter = createPlatformFormatter(createContext(locale));

    assert.match(
      formatter.formatRelativeTime('2026-08-02T11:00:00Z', REFERENCE_INSTANT),
      /1|hour|год|годин|Stunde|час/i,
    );
  });
}

test('formatRelativeTime rejects invalid DateLike', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.throws(
    () => formatter.formatRelativeTime('invalid', REFERENCE_INSTANT),
    /explicit Z or numeric offset/,
  );
});

test('formatRelativeTime does not mutate input Date values', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));
  const value = new Date('2026-08-02T11:00:00Z');
  const reference = new Date('2026-08-02T12:00:00Z');
  const valueTime = value.getTime();
  const referenceTime = reference.getTime();

  formatter.formatRelativeTime(value, reference);

  assert.equal(value.getTime(), valueTime);
  assert.equal(reference.getTime(), referenceTime);
});

test('cache reuses RelativeTimeFormat instances for identical parameters', () => {
  const first = getCachedRelativeTimeFormat('en-GB', 'always');
  const second = getCachedRelativeTimeFormat('en-GB', 'always');

  assert.equal(first, second);
  assert.equal(
    createRelativeTimeFormatCacheKey('en-GB', 'always'),
    'relative|en-GB|always',
  );
});

test('cache creates separate RelativeTimeFormat entries for different locales', () => {
  const en = getCachedRelativeTimeFormat('en-GB', 'always');
  const de = getCachedRelativeTimeFormat('de-DE', 'always');

  assert.notEqual(en, de);
});

test('formatRange formats a positive numeric range', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(
    formatter.formatRange({ kind: 'number', start: 1, end: 10 }),
    '1–10',
  );
});

test('formatRange formats a negative numeric range', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(
    formatter.formatRange({ kind: 'number', start: -10, end: -1 }),
    '-10–-1',
  );
});

test('formatRange formats a decimal numeric range', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(
    formatter.formatRange({ kind: 'number', start: 1.5, end: 2.5 }),
    '1.5–2.5',
  );
});

test('formatRange uses a custom separator', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(
    formatter.formatRange(
      { kind: 'number', start: 1, end: 10 },
      { separator: ' to ' },
    ),
    '1 to 10',
  );
});

test('formatRange uses the default en dash separator', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(
    formatter.formatRange({ kind: 'number', start: 1, end: 10 }).includes('–'),
    true,
  );
});

test('formatRange preserves start > end ordering', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(
    formatter.formatRange({ kind: 'number', start: 10, end: 1 }),
    '10–1',
  );
});

test('formatRange rejects NaN in numeric ranges', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.throws(
    () =>
      formatter.formatRange({
        kind: 'number',
        start: Number.NaN,
        end: 1,
      }),
    /finite number/,
  );
});

test('formatRange rejects Infinity in numeric ranges', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.throws(
    () =>
      formatter.formatRange({
        kind: 'number',
        start: 1,
        end: Number.POSITIVE_INFINITY,
      }),
    /finite number/,
  );
});

test('formatRange formats numeric ranges with locale-specific separators', () => {
  const formatter = createPlatformFormatter(createContext('de-DE'));

  assert.equal(
    formatter.formatRange({ kind: 'number', start: 1000.5, end: 2000.5 }),
    '1.000,5–2.000,5',
  );
});

if (isDateTimeFormatRangeSupported) {
  test('formatRange formats a date range within one month', () => {
    const formatter = createPlatformFormatter(createContext('en-GB'));

    assert.match(
      formatter.formatRange({
        kind: 'date',
        start: '2026-01-01T00:00:00Z',
        end: '2026-01-05T00:00:00Z',
      }),
      /1[\s\u00a0\u202f]*[–-][\s\u00a0\u202f]*5 Jan 2026/,
    );
  });

  test('formatRange formats a date range across different days', () => {
    const formatter = createPlatformFormatter(createContext('en-GB'));

    assert.match(
      formatter.formatRange({
        kind: 'date',
        start: '2026-01-31T00:00:00Z',
        end: '2026-02-02T00:00:00Z',
      }),
      /Jan|Feb|2026/,
    );
  });

  test('formatRange formats a date range across a month boundary', () => {
    const formatter = createPlatformFormatter(createContext('en-GB'));

    assert.match(
      formatter.formatRange({
        kind: 'date',
        start: '2026-03-30T00:00:00Z',
        end: '2026-04-02T00:00:00Z',
      }),
      /Mar|Apr|2026/,
    );
  });

  test('formatRange formats date ranges differently across time zones', () => {
    const utcFormatter = createPlatformFormatter(
      createContext('en-GB', { timeZone: 'UTC' }),
    );
    const tokyoFormatter = createPlatformFormatter(
      createContext('en-GB', { timeZone: 'Asia/Tokyo' }),
    );

    const range = {
      kind: 'date',
      start: '2025-12-31T16:00:00Z',
      end: '2026-01-02T16:00:00Z',
    };

    assert.notEqual(
      utcFormatter.formatRange(range),
      tokyoFormatter.formatRange(range),
    );
  });

  test('formatRange rejects invalid DateLike in date ranges', () => {
    const formatter = createPlatformFormatter(createContext('en-GB'));

    assert.throws(
      () =>
        formatter.formatRange({
          kind: 'date',
          start: '2026-01-01',
          end: '2026-01-05T00:00:00Z',
        }),
      /explicit Z or numeric offset/,
    );
  });

  test('formatRange does not mutate input Date values in date ranges', () => {
    const formatter = createPlatformFormatter(createContext('en-GB'));
    const start = new Date('2026-01-01T00:00:00Z');
    const end = new Date('2026-01-05T00:00:00Z');
    const startTime = start.getTime();
    const endTime = end.getTime();

    formatter.formatRange({
      kind: 'date',
      start,
      end,
    });

    assert.equal(start.getTime(), startTime);
    assert.equal(end.getTime(), endTime);
  });
} else {
  test('formatRange reports DateRange runtime limitation when formatRange is unavailable', () => {
    const formatter = createPlatformFormatter(createContext('en-GB'));

    assert.throws(
      () =>
        formatter.formatRange({
          kind: 'date',
          start: '2026-01-01T00:00:00Z',
          end: '2026-01-05T00:00:00Z',
        }),
      /not supported by the current Intl runtime/,
    );
  });
}

test('formatMeasurement formats mmol/L', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(
    formatter.formatMeasurement({ value: 5.6, unit: 'mmol/L' }),
    '5.6 mmol/L',
  );
});

test('formatMeasurement formats mg/dL', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(
    formatter.formatMeasurement({ value: 101, unit: 'mg/dL' }),
    '101 mg/dL',
  );
});

test('formatMeasurement uses default precision for mmol/L', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(
    formatter.formatMeasurement({ value: 5.64, unit: 'mmol/L' }),
    '5.6 mmol/L',
  );
});

test('formatMeasurement uses default precision for mg/dL', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(
    formatter.formatMeasurement({ value: 101.4, unit: 'mg/dL' }),
    '101 mg/dL',
  );
});

test('formatMeasurement applies explicit precision', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(
    formatter.formatMeasurement({
      value: 5.6,
      unit: 'mmol/L',
      precision: {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    }),
    '5.60 mmol/L',
  );
});

for (const locale of LOCALES) {
  test(`formatMeasurement formats mmol/L for ${locale}`, () => {
    const formatter = createPlatformFormatter(createContext(locale));

    assert.match(
      formatter.formatMeasurement({ value: 5.6, unit: 'mmol/L' }),
      /5[.,]6/,
    );
    assert.match(
      formatter.formatMeasurement({ value: 5.6, unit: 'mmol/L' }),
      /mmol\/L/,
    );
  });
}

test('formatMeasurement supports unitDisplay long', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(
    formatter.formatMeasurement(
      { value: 5.6, unit: 'mmol/L' },
      { unitDisplay: 'long' },
    ),
    '5.6 mmol/L',
  );
});

test('formatMeasurement supports unitDisplay short', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(
    formatter.formatMeasurement(
      { value: 5.6, unit: 'mmol/L' },
      { unitDisplay: 'short' },
    ),
    '5.6 mmol/L',
  );
});

test('formatMeasurement supports unitDisplay narrow', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(
    formatter.formatMeasurement(
      { value: 5.6, unit: 'mmol/L' },
      { unitDisplay: 'narrow' },
    ),
    '5.6mmol/L',
  );
});

test('formatMeasurement formats negative finite values without conversion', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(
    formatter.formatMeasurement({ value: -5.6, unit: 'mmol/L' }),
    '-5.6 mmol/L',
  );
});

test('formatMeasurement formats zero', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(
    formatter.formatMeasurement({ value: 0, unit: 'mmol/L' }),
    '0 mmol/L',
  );
});

test('formatMeasurement rejects NaN', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.throws(
    () =>
      formatter.formatMeasurement({
        value: Number.NaN,
        unit: 'mmol/L',
      }),
    /finite number/,
  );
});

test('formatMeasurement rejects Infinity', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.throws(
    () =>
      formatter.formatMeasurement({
        value: Number.POSITIVE_INFINITY,
        unit: 'mg/dL',
      }),
    /finite number/,
  );
});

test('formatMeasurement rejects invalid precision', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.throws(
    () =>
      formatter.formatMeasurement({
        value: 5.6,
        unit: 'mmol/L',
        precision: {
          minimumFractionDigits: 3,
          maximumFractionDigits: 1,
        },
      }),
    /minimumFractionDigits must not be greater than maximumFractionDigits/,
  );
});

test('formatMeasurement rejects unknown units at runtime', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.throws(
    () =>
      formatter.formatMeasurement({
        value: 5.6,
        unit: 'g/L',
      }),
    /not supported/,
  );
});

test('formatMeasurement does not convert mmol/L into mg/dL', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  const formatted = formatter.formatMeasurement({ value: 5.6, unit: 'mmol/L' });

  assert.equal(formatted, '5.6 mmol/L');
  assert.doesNotMatch(formatted, /101/);
  assert.doesNotMatch(formatted, /mg\/dL/);
});

test('duration feature detection supports unit formatting for hour, minute, and second', () => {
  assert.doesNotThrow(() => {
    new Intl.NumberFormat('en-GB', {
      style: 'unit',
      unit: 'hour',
      unitDisplay: 'short',
    }).format(1);
    new Intl.NumberFormat('en-GB', {
      style: 'unit',
      unit: 'minute',
      unitDisplay: 'short',
    }).format(1);
    new Intl.NumberFormat('en-GB', {
      style: 'unit',
      unit: 'second',
      unitDisplay: 'short',
    }).format(1);
  });
});

test('duration feature detection supports Intl.ListFormat', () => {
  assert.equal(typeof Intl.ListFormat, 'function');
  assert.doesNotThrow(() => {
    new Intl.ListFormat('en-GB', { type: 'unit', style: 'short' }).format([
      '1 hr',
      '30 min',
    ]);
  });
});

test('formatDuration formats hours and minutes', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(
    formatter.formatDuration({ hours: 1, minutes: 30 }),
    '1 hr, 30 mins',
  );
});

test('formatDuration formats hours, minutes, and seconds', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(
    formatter.formatDuration({ hours: 1, minutes: 30, seconds: 15 }),
    '1 hr, 30 mins, 15 secs',
  );
});

test('formatDuration formats only hours', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(formatter.formatDuration({ hours: 2 }), '2 hrs');
});

test('formatDuration formats only minutes', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(formatter.formatDuration({ minutes: 45 }), '45 mins');
});

test('formatDuration formats only seconds', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(formatter.formatDuration({ seconds: 20 }), '20 secs');
});

test('formatDuration formats an empty object as 0 seconds', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(formatter.formatDuration({}), '0 secs');
});

test('formatDuration formats explicit zero hours', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(formatter.formatDuration({ hours: 0 }), '0 hrs');
});

test('formatDuration formats explicit zero minutes', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(formatter.formatDuration({ minutes: 0 }), '0 mins');
});

test('formatDuration formats explicit zero seconds', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(formatter.formatDuration({ seconds: 0 }), '0 secs');
});

test('formatDuration preserves explicit zero components in multi-component durations', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(
    formatter.formatDuration({ hours: 1, minutes: 0, seconds: 30 }),
    '1 hr, 0 mins, 30 secs',
  );
});

test('formatDuration supports long style', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(
    formatter.formatDuration({ hours: 1, minutes: 30 }, { style: 'long' }),
    '1 hour, 30 minutes',
  );
});

test('formatDuration supports short style', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(
    formatter.formatDuration({ hours: 1, minutes: 30 }, { style: 'short' }),
    '1 hr, 30 mins',
  );
});

test('formatDuration supports narrow style', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(
    formatter.formatDuration({ hours: 1, minutes: 30 }, { style: 'narrow' }),
    '1h 30m',
  );
});

test('formatDuration defaults to short style', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(formatter.formatDuration({ hours: 1 }), '1 hr');
});

for (const locale of LOCALES) {
  test(`formatDuration formats locale-aware unit names for ${locale}`, () => {
    const formatter = createPlatformFormatter(createContext(locale));

    const formatted = formatter.formatDuration({ minutes: 1 });

    assert.match(formatted, /1/);
    assert.equal(typeof formatted, 'string');
    assert.ok(formatted.length > 0);
  });
}

test('formatDuration uses locale-aware list composition for de-DE', () => {
  const formatter = createPlatformFormatter(createContext('de-DE'));

  assert.equal(
    formatter.formatDuration({ hours: 1, minutes: 30 }),
    '1 Std., 30 Min.',
  );
});

test('formatDuration rejects negative hours', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.throws(
    () => formatter.formatDuration({ hours: -1 }),
    /must not be negative/,
  );
});

test('formatDuration rejects negative minutes', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.throws(
    () => formatter.formatDuration({ minutes: -1 }),
    /must not be negative/,
  );
});

test('formatDuration rejects negative seconds', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.throws(
    () => formatter.formatDuration({ seconds: -1 }),
    /must not be negative/,
  );
});

test('formatDuration rejects fractional components', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.throws(
    () => formatter.formatDuration({ minutes: 1.5 }),
    /must be an integer/,
  );
});

test('formatDuration rejects NaN', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.throws(
    () => formatter.formatDuration({ seconds: Number.NaN }),
    /finite number/,
  );
});

test('formatDuration rejects Infinity', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.throws(
    () => formatter.formatDuration({ seconds: Number.POSITIVE_INFINITY }),
    /finite number/,
  );
});

test('formatDuration rejects -Infinity', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.throws(
    () => formatter.formatDuration({ seconds: Number.NEGATIVE_INFINITY }),
    /finite number/,
  );
});

test('formatDuration does not normalize 90 minutes into hours and minutes', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(formatter.formatDuration({ minutes: 90 }), '90 mins');
});

test('formatDuration does not normalize 120 seconds into minutes', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));

  assert.equal(formatter.formatDuration({ seconds: 120 }), '120 secs');
});

test('formatDuration does not mutate the input DurationValue', () => {
  const formatter = createPlatformFormatter(createContext('en-GB'));
  const duration = { hours: 1, minutes: 30 };

  formatter.formatDuration(duration);

  assert.deepEqual(duration, { hours: 1, minutes: 30 });
});

test('cache reuses duration unit formatters for identical parameters', () => {
  const first = getCachedDurationUnitFormat(
    'en-GB',
    undefined,
    'hour',
    'short',
  );
  const second = getCachedDurationUnitFormat(
    'en-GB',
    undefined,
    'hour',
    'short',
  );

  assert.equal(first, second);
  assert.equal(
    createDurationUnitFormatCacheKey('en-GB', undefined, 'hour', 'short'),
    'duration-unit|en-GB|-|hour|short',
  );
});

test('cache creates separate duration unit entries for different units', () => {
  const hour = getCachedDurationUnitFormat('en-GB', undefined, 'hour', 'short');
  const minute = getCachedDurationUnitFormat(
    'en-GB',
    undefined,
    'minute',
    'short',
  );

  assert.notEqual(hour, minute);
});

test('cache creates separate duration unit entries for different styles', () => {
  const short = getCachedDurationUnitFormat(
    'en-GB',
    undefined,
    'hour',
    'short',
  );
  const long = getCachedDurationUnitFormat('en-GB', undefined, 'hour', 'long');

  assert.notEqual(short, long);
});

test('cache creates separate duration unit entries for different locales', () => {
  const en = getCachedDurationUnitFormat('en-GB', undefined, 'hour', 'short');
  const de = getCachedDurationUnitFormat('de-DE', undefined, 'hour', 'short');

  assert.notEqual(en, de);
});

test('cache reuses duration ListFormat instances for identical parameters', () => {
  const first = getCachedDurationListFormat('en-GB', 'short');
  const second = getCachedDurationListFormat('en-GB', 'short');

  assert.equal(first, second);
  assert.equal(
    createDurationListFormatCacheKey('en-GB', 'short'),
    'duration-list|en-GB|short|unit',
  );
});

test('cache reuses DateTimeFormat instances for identical parameters', () => {
  const first = getCachedDateTimeFormat('en-GB', 'UTC', {
    dateStyle: 'medium',
  });
  const second = getCachedDateTimeFormat('en-GB', 'UTC', {
    dateStyle: 'medium',
  });

  assert.equal(first, second);
});

test('cache creates separate DateTimeFormat entries for different locales', () => {
  const en = getCachedDateTimeFormat('en-GB', 'UTC', { dateStyle: 'medium' });
  const de = getCachedDateTimeFormat('de-DE', 'UTC', { dateStyle: 'medium' });

  assert.notEqual(en, de);
});

test('cache reuses the original locale formatter after switching locales', () => {
  const localeAFirst = getCachedDateTimeFormat('en-GB', 'UTC', {
    dateStyle: 'medium',
  });
  getCachedDateTimeFormat('de-DE', 'UTC', { dateStyle: 'medium' });
  const localeASecond = getCachedDateTimeFormat('en-GB', 'UTC', {
    dateStyle: 'medium',
  });

  assert.equal(localeAFirst, localeASecond);
  assert.equal(__getIntlFormatterCacheSizeForTests(), 2);
});

test('cache creates separate DateTimeFormat entries for different time zones', () => {
  const utc = getCachedDateTimeFormat('en-GB', 'UTC', { dateStyle: 'medium' });
  const berlin = getCachedDateTimeFormat('en-GB', 'Europe/Berlin', {
    dateStyle: 'medium',
  });

  assert.notEqual(utc, berlin);
});

test('cache creates separate entries for different options', () => {
  const medium = getCachedDateTimeFormat('en-GB', 'UTC', {
    dateStyle: 'medium',
  });
  const short = getCachedDateTimeFormat('en-GB', 'UTC', { dateStyle: 'short' });

  assert.notEqual(medium, short);
});

test('cache clear resets cached formatter instances', () => {
  getCachedDateTimeFormat('en-GB', 'UTC', { dateStyle: 'medium' });
  assert.equal(__getIntlFormatterCacheSizeForTests(), 1);

  __clearIntlFormatterCacheForTests();

  assert.equal(__getIntlFormatterCacheSizeForTests(), 0);
});

test('cache stores formatter instances only', () => {
  getCachedDateTimeFormat('en-GB', 'UTC', { dateStyle: 'medium' });
  getCachedNumberFormat('en-GB', { style: 'decimal' });

  const dateKey = createDateTimeFormatCacheKey('en-GB', 'UTC', {
    dateStyle: 'medium',
  });
  const numberKey = createNumberFormatCacheKey('en-GB', { style: 'decimal' });

  assert.equal(dateKey, 'date|en-GB|UTC|-|medium|-');
  assert.equal(numberKey, 'number|en-GB|-|group=-|min=-|max=-');
  assert.ok(
    __getCachedFormatterForTests(dateKey) instanceof Intl.DateTimeFormat,
  );
  assert.ok(
    __getCachedFormatterForTests(numberKey) instanceof Intl.NumberFormat,
  );
});

test('cache reuses NumberFormat instances for identical parameters', () => {
  const first = getCachedNumberFormat('en-GB', { style: 'percent' });
  const second = getCachedNumberFormat('en-GB', { style: 'percent' });

  assert.equal(first, second);
});
