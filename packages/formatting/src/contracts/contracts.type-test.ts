import type { FormattingContext } from './formatting-context';
import type { PlatformFormatter } from './platform-formatter';
import type { PlatformFormatterFactory } from './platform-formatter-factory';
import type { DateFormatOptions } from './options/date-format-options';
import type { DateLike } from '../types/date-like';
import type { DisplayMeasurement } from '../types/display-measurement';
import type { DurationValue } from '../types/duration-value';

declare const dateLike: DateLike;
declare const referenceDate: DateLike;
declare const context: FormattingContext;
declare const factory: PlatformFormatterFactory;

const formatter: PlatformFormatter = {
  formatDate: () => '2026-08-02',
  formatTime: () => '15:30',
  formatDateTime: () => '2026-08-02 15:30',
  formatRelativeTime: () => 'in 2 hours',
  formatNumber: () => '1,234.5',
  formatPercentage: () => '25%',
  formatCurrency: () => '€10.00',
  formatDuration: () => '1 hour',
  formatRange: () => '0–100',
  formatMeasurement: () => '5.6 mmol/L',
};

void formatter;

const dateResult: string = formatter.formatDate(dateLike);
const timeResult: string = formatter.formatTime(dateLike);
const dateTimeResult: string = formatter.formatDateTime(dateLike);
const relativeResult: string = formatter.formatRelativeTime(
  dateLike,
  referenceDate,
);
const numberResult: string = formatter.formatNumber(1234.5);
const percentageResult: string = formatter.formatPercentage(0.25);
const currencyResult: string = formatter.formatCurrency(10, 'EUR');
const durationResult: string = formatter.formatDuration({ hours: 1 });
const rangeResult: string = formatter.formatRange({
  kind: 'number',
  start: 0,
  end: 100,
});
const measurementResult: string = formatter.formatMeasurement({
  value: 5.6,
  unit: 'mmol/L',
});

void dateResult;
void timeResult;
void dateTimeResult;
void relativeResult;
void numberResult;
void percentageResult;
void currencyResult;
void durationResult;
void rangeResult;
void measurementResult;

// @ts-expect-error PlatformFormatter methods return string
const invalidDateResult: number = formatter.formatDate(dateLike);

void invalidDateResult;

formatter.formatDate(dateLike, {
  dateStyle: 'short',
});

formatter.formatDate(dateLike, {
  // @ts-expect-error unknown DateFormatOptions fields are not allowed
  weekday: 'long',
});

formatter.formatDate(dateLike, {
  // @ts-expect-error invalid dateStyle value
  dateStyle: 'invalid',
});

formatter.formatTime(dateLike, {
  // @ts-expect-error invalid timeStyle value
  timeStyle: 'invalid',
});

formatter.formatMeasurement(
  {
    value: 5.6,
    unit: 'mmol/L',
  },
  {
    unitDisplay: 'short',
  },
);

formatter.formatMeasurement(
  {
    value: 5.6,
    unit: 'mmol/L',
  },
  {
    // @ts-expect-error invalid unitDisplay value
    unitDisplay: 'invalid',
  },
);

formatter.formatCurrency(10, 'EUR', {
  currencyDisplay: 'symbol',
});

formatter.formatCurrency(10, 'USD');

// Currency code is an explicit ISO string argument, not inferred from context.
formatter.formatCurrency(10, context.currency);

const measurement: DisplayMeasurement = {
  value: 5.6,
  unit: 'mmol/L',
};

formatter.formatMeasurement(measurement);

// @ts-expect-error formatMeasurement accepts DisplayMeasurement only
formatter.formatMeasurement(5.6);

formatter.formatRange({
  kind: 'date',
  start: dateLike,
  end: referenceDate,
});

// @ts-expect-error formatRange accepts FormatRangeValue only
formatter.formatRange({
  start: 0,
  end: 1,
});

const dateOptions: DateFormatOptions = {
  dateStyle: 'medium',
};

void dateOptions;

// @ts-expect-error DateFormatOptions fields are readonly
dateOptions.dateStyle = 'short';

const readonlyContext: FormattingContext = {
  locale: 'en-GB',
  timeZone: 'Europe/London',
};

void readonlyContext;

// @ts-expect-error FormattingContext fields are readonly
readonlyContext.locale = 'de-DE';

const createdFormatter: PlatformFormatter =
  factory.createPlatformFormatter(readonlyContext);

void createdFormatter;

const duration: DurationValue = {
  minutes: 30,
};

formatter.formatDuration(duration, {
  style: 'short',
});

void duration;
