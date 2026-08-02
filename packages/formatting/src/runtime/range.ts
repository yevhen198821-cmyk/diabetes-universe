import type { DateRange } from '../types/format-range';
import type { NumericRange } from '../types/format-range';
import type { RangeFormatOptions } from '../contracts/options/range-format-options';
import { assertValidDateLike } from './date-like';
import { assertFiniteNumber } from './validation';

export const DEFAULT_RANGE_SEPARATOR = '–';

export const isDateTimeFormatRangeSupported =
  typeof Intl.DateTimeFormat.prototype.formatRange === 'function';

export function assertValidNumericRange(range: NumericRange): void {
  assertFiniteNumber(range.start, 'Numeric range start');
  assertFiniteNumber(range.end, 'Numeric range end');
}

export function formatNumericRangePresentation(
  range: NumericRange,
  formatNumber: (value: number) => string,
  options?: RangeFormatOptions,
): string {
  assertValidNumericRange(range);

  const separator = options?.separator ?? DEFAULT_RANGE_SEPARATOR;

  return `${formatNumber(range.start)}${separator}${formatNumber(range.end)}`;
}

export function formatDateRangePresentation(
  range: DateRange,
  formatDateRange: (start: Date, end: Date) => string,
): string {
  const start = assertValidDateLike(range.start);
  const end = assertValidDateLike(range.end);

  return formatDateRange(start, end);
}
