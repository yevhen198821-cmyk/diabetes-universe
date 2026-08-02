import type { DateLike } from './date-like';
import type { DisplayMeasurement } from './display-measurement';
import type { DurationValue } from './duration-value';
import type { DateRange, FormatRangeValue, NumericRange } from './format-range';
import type { MeasurementUnit } from './measurement-unit';

declare const dateLike: DateLike;
declare const isoDateTime: DateLike;

const validIsoDateTime = '2026-08-02T15:30:00+02:00' as DateLike;
const validDate = new Date('2026-08-02T15:30:00Z') as DateLike;

void validIsoDateTime;
void validDate;
void dateLike;
void isoDateTime;

const validUnit: MeasurementUnit = 'mmol/L';
void validUnit;

// @ts-expect-error unknown measurement units are not allowed
const invalidUnit: MeasurementUnit = 'g/L';

void invalidUnit;

const validMeasurement: DisplayMeasurement = {
  value: 5.6,
  unit: 'mmol/L',
  precision: {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  },
};

void validMeasurement;

const measurementWithConversionFields: DisplayMeasurement = {
  value: 5.6,
  unit: 'mmol/L',
  // @ts-expect-error medical conversion fields are not part of DisplayMeasurement
  canonicalValue: 5.6,
};

void measurementWithConversionFields;

// @ts-expect-error readonly property
validMeasurement.value = 6;

const validDuration: DurationValue = {
  hours: 1,
  minutes: 30,
  seconds: 15,
};

void validDuration;

const durationWithBusinessFields: DurationValue = {
  hours: 1,
  // @ts-expect-error business fields are not part of DurationValue
  insulinUnits: 4,
};

void durationWithBusinessFields;

const validNumericRange: NumericRange = {
  kind: 'number',
  start: 0,
  end: 100,
};

void validNumericRange;

const invalidNumericRange: NumericRange = {
  kind: 'number',
  // @ts-expect-error NumericRange start must be a number
  start: dateLike,
  end: 100,
};

void invalidNumericRange;

const validDateRange: DateRange = {
  kind: 'date',
  start: validIsoDateTime,
  end: validDate,
};

void validDateRange;

const invalidDateRange: DateRange = {
  kind: 'date',
  // @ts-expect-error DateRange start must be DateLike
  start: 0,
  end: validDate,
};

void invalidDateRange;

const validFormatRangeFromNumber: FormatRangeValue = validNumericRange;
const validFormatRangeFromDate: FormatRangeValue = validDateRange;

void validFormatRangeFromNumber;
void validFormatRangeFromDate;

// @ts-expect-error FormatRangeValue requires a discriminator
const missingDiscriminator: FormatRangeValue = {
  start: 0,
  end: 1,
};

void missingDiscriminator;

const invalidDiscriminatorCandidate = {
  kind: 'text' as const,
  start: 0,
  end: 1,
};

// @ts-expect-error FormatRangeValue discriminator must be "number" or "date"
const invalidDiscriminator: FormatRangeValue = invalidDiscriminatorCandidate;

void invalidDiscriminator;

// @ts-expect-error readonly property
validNumericRange.start = 1;
