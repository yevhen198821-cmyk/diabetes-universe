// Simple bounded formatter cache.
//
// FIFO eviction is intentionally used instead of LRU until real performance
// requirements appear.

const MAX_CACHE_ENTRIES = 64;

const formatterCache = new Map<
  string,
  | Intl.DateTimeFormat
  | Intl.NumberFormat
  | Intl.RelativeTimeFormat
  | Intl.ListFormat
>();

function evictOldestCacheEntry(): void {
  const oldestKey = formatterCache.keys().next().value;

  if (oldestKey !== undefined) {
    formatterCache.delete(oldestKey);
  }
}

function setCachedFormatter(
  key: string,
  formatter:
    | Intl.DateTimeFormat
    | Intl.NumberFormat
    | Intl.RelativeTimeFormat
    | Intl.ListFormat,
): void {
  if (formatterCache.size >= MAX_CACHE_ENTRIES && !formatterCache.has(key)) {
    evictOldestCacheEntry();
  }

  formatterCache.set(key, formatter);
}

function formatCacheSegment(value: string | undefined): string {
  return value ?? '-';
}

function createDateTimeFormatCacheKey(
  locale: string,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
): string {
  const hasDateStyle = options.dateStyle !== undefined;
  const hasTimeStyle = options.timeStyle !== undefined;

  let kind = 'date';

  if (hasDateStyle && hasTimeStyle) {
    kind = 'datetime';
  } else if (hasTimeStyle) {
    kind = 'time';
  }

  return [
    kind,
    locale,
    timeZone,
    formatCacheSegment(options.hourCycle),
    formatCacheSegment(hasDateStyle ? String(options.dateStyle) : undefined),
    formatCacheSegment(hasTimeStyle ? String(options.timeStyle) : undefined),
    formatCacheSegment(options.day),
    formatCacheSegment(options.month),
    formatCacheSegment(options.year),
    formatCacheSegment(options.hour),
    formatCacheSegment(options.minute),
    formatCacheSegment(options.second),
    formatCacheSegment(
      options.hour12 === undefined ? undefined : String(options.hour12),
    ),
  ].join('|');
}

function createRelativeTimeFormatCacheKey(
  locale: string,
  numeric: Intl.RelativeTimeFormatNumeric,
): string {
  return ['relative', locale, numeric].join('|');
}

type DurationUnitName = 'hour' | 'minute' | 'second';
type DurationUnitDisplay = 'long' | 'short' | 'narrow';
type DurationListStyle = 'long' | 'short' | 'narrow';

function createDurationUnitFormatCacheKey(
  locale: string,
  numberingSystem: string | undefined,
  unit: DurationUnitName,
  unitDisplay: DurationUnitDisplay,
): string {
  return [
    'duration-unit',
    locale,
    formatCacheSegment(numberingSystem),
    unit,
    unitDisplay,
  ].join('|');
}

function createDurationListFormatCacheKey(
  locale: string,
  style: DurationListStyle,
): string {
  return ['duration-list', locale, style, 'unit'].join('|');
}

function formatGroupingSegment(useGrouping: boolean | undefined): string {
  return useGrouping === undefined ? 'group=-' : `group=${useGrouping}`;
}

function formatFractionDigitSegment(
  prefix: 'min' | 'max',
  value: number | undefined,
): string {
  return value === undefined ? `${prefix}=-` : `${prefix}=${value}`;
}

function createNumberFormatCacheKey(
  locale: string,
  options: Intl.NumberFormatOptions,
): string {
  if (options.style === 'currency') {
    return [
      'currency',
      locale,
      formatCacheSegment(options.numberingSystem),
      formatCacheSegment(options.currency),
      formatCacheSegment(options.currencyDisplay),
      formatGroupingSegment(options.useGrouping),
      formatFractionDigitSegment('min', options.minimumFractionDigits),
      formatFractionDigitSegment('max', options.maximumFractionDigits),
    ].join('|');
  }

  const style = options.style === 'percent' ? 'percent' : 'number';

  return [
    style,
    locale,
    formatCacheSegment(options.numberingSystem),
    formatGroupingSegment(options.useGrouping),
    formatFractionDigitSegment('min', options.minimumFractionDigits),
    formatFractionDigitSegment('max', options.maximumFractionDigits),
  ].join('|');
}

export function getCachedDateTimeFormat(
  locale: string,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const key = createDateTimeFormatCacheKey(locale, timeZone, options);
  const cached = formatterCache.get(key);

  if (cached instanceof Intl.DateTimeFormat) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone,
  });

  setCachedFormatter(key, formatter);
  return formatter;
}

export function getCachedRelativeTimeFormat(
  locale: string,
  numeric: Intl.RelativeTimeFormatNumeric,
): Intl.RelativeTimeFormat {
  const key = createRelativeTimeFormatCacheKey(locale, numeric);
  const cached = formatterCache.get(key);

  if (cached instanceof Intl.RelativeTimeFormat) {
    return cached;
  }

  const formatter = new Intl.RelativeTimeFormat(locale, { numeric });

  setCachedFormatter(key, formatter);
  return formatter;
}

export function getCachedDurationUnitFormat(
  locale: string,
  numberingSystem: string | undefined,
  unit: DurationUnitName,
  unitDisplay: DurationUnitDisplay,
): Intl.NumberFormat {
  const key = createDurationUnitFormatCacheKey(
    locale,
    numberingSystem,
    unit,
    unitDisplay,
  );
  const cached = formatterCache.get(key);

  if (cached instanceof Intl.NumberFormat) {
    return cached;
  }

  const formatter = new Intl.NumberFormat(locale, {
    style: 'unit',
    unit,
    unitDisplay,
    ...(numberingSystem === undefined ? {} : { numberingSystem }),
  });

  setCachedFormatter(key, formatter);
  return formatter;
}

export function getCachedDurationListFormat(
  locale: string,
  style: DurationListStyle,
): Intl.ListFormat {
  const key = createDurationListFormatCacheKey(locale, style);
  const cached = formatterCache.get(key);

  if (cached instanceof Intl.ListFormat) {
    return cached;
  }

  const formatter = new Intl.ListFormat(locale, {
    type: 'unit',
    style,
  });

  setCachedFormatter(key, formatter);
  return formatter;
}

export function getCachedNumberFormat(
  locale: string,
  options: Intl.NumberFormatOptions,
): Intl.NumberFormat {
  const key = createNumberFormatCacheKey(locale, options);
  const cached = formatterCache.get(key);

  if (cached instanceof Intl.NumberFormat) {
    return cached;
  }

  const formatter = new Intl.NumberFormat(locale, options);

  setCachedFormatter(key, formatter);
  return formatter;
}

export function __clearIntlFormatterCacheForTests(): void {
  formatterCache.clear();
}

export function __getIntlFormatterCacheSizeForTests(): number {
  return formatterCache.size;
}

export function __getCachedFormatterForTests(
  key: string,
):
  | Intl.DateTimeFormat
  | Intl.NumberFormat
  | Intl.RelativeTimeFormat
  | Intl.ListFormat
  | undefined {
  return formatterCache.get(key);
}

export {
  createDateTimeFormatCacheKey,
  createDurationListFormatCacheKey,
  createDurationUnitFormatCacheKey,
  createNumberFormatCacheKey,
  createRelativeTimeFormatCacheKey,
  MAX_CACHE_ENTRIES,
};
