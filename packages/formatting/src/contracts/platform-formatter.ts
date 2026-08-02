import type { DateLike } from '../types/date-like';
import type { DisplayMeasurement } from '../types/display-measurement';
import type { DurationValue } from '../types/duration-value';
import type { FormatRangeValue } from '../types/format-range';
import type {
  CurrencyFormatOptions,
  DateFormatOptions,
  DateTimeFormatOptions,
  DurationFormatOptions,
  MeasurementFormatOptions,
  NumberFormatOptions,
  PercentageFormatOptions,
  RangeFormatOptions,
  RelativeTimeFormatOptions,
  TimeFormatOptions,
} from './options';

/**
 * Platform formatter runtime contract.
 *
 * Method signatures define the public formatting API. Runtime implementations
 * are provided by Infrastructure Adapters in future sprints.
 */
export interface PlatformFormatter {
  formatDate(value: DateLike, options?: DateFormatOptions): string;

  formatTime(value: DateLike, options?: TimeFormatOptions): string;

  formatDateTime(value: DateLike, options?: DateTimeFormatOptions): string;

  formatRelativeTime(
    value: DateLike,
    reference: DateLike,
    options?: RelativeTimeFormatOptions,
  ): string;

  formatNumber(value: number, options?: NumberFormatOptions): string;

  formatPercentage(value: number, options?: PercentageFormatOptions): string;

  formatCurrency(
    value: number,
    currency?: string,
    options?: CurrencyFormatOptions,
  ): string;

  formatDuration(value: DurationValue, options?: DurationFormatOptions): string;

  formatRange(value: FormatRangeValue, options?: RangeFormatOptions): string;

  formatMeasurement(
    value: DisplayMeasurement,
    options?: MeasurementFormatOptions,
  ): string;
}
