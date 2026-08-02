/**
 * Diabetes Universe Platform Formatting Library contracts.
 *
 * This package exposes immutable, framework-independent formatting contracts
 * and a framework-independent Intl-backed runtime for selected formatters.
 */

export type {
  CurrencyFormatOptions,
  DateFormatOptions,
  DateTimeFormatOptions,
  DurationFormatOptions,
  FormattingContext,
  MeasurementFormatOptions,
  NumberFormatOptions,
  PercentageFormatOptions,
  PlatformFormatter,
  PlatformFormatterFactory,
  RangeFormatOptions,
  RelativeTimeFormatOptions,
  TimeFormatOptions,
} from './contracts';

export type {
  DateLike,
  DateRange,
  DisplayMeasurement,
  DurationValue,
  FormatRangeValue,
  IsoDateTimeString,
  MeasurementDisplayPolicy,
  MeasurementUnit,
  NumericRange,
} from './types';

export { createPlatformFormatter } from './runtime/create-platform-formatter';
