import type { DateLike } from './date-like';

/**
 * Numeric inclusive range for number formatting.
 */
export interface NumericRange {
  readonly kind: 'number';
  readonly start: number;
  readonly end: number;
}

/**
 * Date-time inclusive range for date formatting.
 */
export interface DateRange {
  readonly kind: 'date';
  readonly start: DateLike;
  readonly end: DateLike;
}

/**
 * Discriminated range input accepted by range formatters.
 */
export type FormatRangeValue = NumericRange | DateRange;
