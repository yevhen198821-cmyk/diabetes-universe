import type { FormattingContext } from '../contracts/formatting-context';
import type { CurrencyFormatOptions } from '../contracts/options/currency-format-options';
import type { DateFormatOptions } from '../contracts/options/date-format-options';
import type { DateTimeFormatOptions } from '../contracts/options/datetime-format-options';
import type { MeasurementFormatOptions } from '../contracts/options/measurement-format-options';
import type { NumberFormatOptions } from '../contracts/options/number-format-options';
import type { PercentageFormatOptions } from '../contracts/options/percentage-format-options';
import type { RangeFormatOptions } from '../contracts/options/range-format-options';
import type { RelativeTimeFormatOptions } from '../contracts/options/relative-time-format-options';
import type { TimeFormatOptions } from '../contracts/options/time-format-options';
import type { PlatformFormatter } from '../contracts/platform-formatter';
import type { DateLike } from '../types/date-like';
import type { DisplayMeasurement } from '../types/display-measurement';
import type { DurationValue } from '../types/duration-value';
import type { FormatRangeValue } from '../types/format-range';
import type { DurationFormatOptions } from '../contracts/options/duration-format-options';
import { assertValidDateLike } from './date-like';
import { formatDurationPresentation } from './duration';
import {
  assertKnownMeasurementUnit,
  composeMeasurementDisplay,
  resolveMeasurementPrecision,
} from './measurement';
import {
  calculateRelativeTimeValue,
  selectRelativeTimeUnit,
} from './relative-time';
import {
  formatDateRangePresentation,
  formatNumericRangePresentation,
  isDateTimeFormatRangeSupported,
} from './range';
import {
  getCachedDateTimeFormat,
  getCachedNumberFormat,
  getCachedRelativeTimeFormat,
} from './cache/intl-formatter-cache';
import {
  assertFiniteNumber,
  resolveCurrencyCode,
  validateCurrencyCode,
  validateFractionPolicy,
} from './validation';

/**
 * Runtime invariants:
 *
 * - FormattingContext immutable.
 * - Formatter instances immutable after creation.
 * - Internal cache stores only Intl formatter instances.
 * - No formatted values are cached.
 * - Runtime never mutates input values.
 * - Runtime performs no medical conversion.
 * - Runtime performs no localization fallback.
 */
export class PlatformFormatterImpl implements PlatformFormatter {
  private readonly context: FormattingContext;

  constructor(context: FormattingContext) {
    this.context = context;
  }

  formatDate(value: DateLike, options?: DateFormatOptions): string {
    const instant = assertValidDateLike(value);
    const formatter = getCachedDateTimeFormat(
      this.context.locale,
      this.context.timeZone,
      {
        dateStyle: options?.dateStyle ?? 'medium',
      },
    );

    return formatter.format(instant);
  }

  formatTime(value: DateLike, options?: TimeFormatOptions): string {
    const instant = assertValidDateLike(value);
    const intlOptions: Intl.DateTimeFormatOptions = {
      timeStyle: options?.timeStyle ?? 'short',
    };

    if (this.context.hourCycle !== undefined) {
      intlOptions.hourCycle = this.context.hourCycle;
    }

    const formatter = getCachedDateTimeFormat(
      this.context.locale,
      this.context.timeZone,
      intlOptions,
    );

    return formatter.format(instant);
  }

  formatDateTime(value: DateLike, options?: DateTimeFormatOptions): string {
    const instant = assertValidDateLike(value);
    const intlOptions: Intl.DateTimeFormatOptions = {
      dateStyle: options?.dateStyle ?? 'medium',
      timeStyle: options?.timeStyle ?? 'short',
    };

    if (this.context.hourCycle !== undefined) {
      intlOptions.hourCycle = this.context.hourCycle;
    }

    const formatter = getCachedDateTimeFormat(
      this.context.locale,
      this.context.timeZone,
      intlOptions,
    );

    return formatter.format(instant);
  }

  formatRelativeTime(
    value: DateLike,
    reference: DateLike,
    options?: RelativeTimeFormatOptions,
  ): string {
    const valueInstant = assertValidDateLike(value);
    const referenceInstant = assertValidDateLike(reference);
    const numeric = options?.numeric ?? 'always';
    const absDiffMs = Math.abs(
      valueInstant.getTime() - referenceInstant.getTime(),
    );
    const unit = options?.unit ?? selectRelativeTimeUnit(absDiffMs);
    const relativeValue = calculateRelativeTimeValue(
      valueInstant.getTime(),
      referenceInstant.getTime(),
      unit,
    );
    const formatter = getCachedRelativeTimeFormat(this.context.locale, numeric);

    return formatter.format(relativeValue, unit);
  }

  formatNumber(value: number, options?: NumberFormatOptions): string {
    assertFiniteNumber(value, 'Number format value');
    validateFractionPolicy(options, 'Number format');

    const intlOptions: Intl.NumberFormatOptions = {
      useGrouping: options?.useGrouping,
      minimumFractionDigits: options?.minimumFractionDigits,
      maximumFractionDigits: options?.maximumFractionDigits,
    };

    if (this.context.numberingSystem !== undefined) {
      intlOptions.numberingSystem = this.context.numberingSystem;
    }

    const formatter = getCachedNumberFormat(this.context.locale, intlOptions);

    return formatter.format(value);
  }

  formatPercentage(value: number, options?: PercentageFormatOptions): string {
    assertFiniteNumber(value, 'Percentage format value');
    validateFractionPolicy(options, 'Percentage format');

    const intlOptions: Intl.NumberFormatOptions = {
      style: 'percent',
      useGrouping: options?.useGrouping,
      minimumFractionDigits: options?.minimumFractionDigits,
      maximumFractionDigits: options?.maximumFractionDigits,
    };

    if (this.context.numberingSystem !== undefined) {
      intlOptions.numberingSystem = this.context.numberingSystem;
    }

    const formatter = getCachedNumberFormat(this.context.locale, intlOptions);

    return formatter.format(value);
  }

  formatCurrency(
    value: number,
    currency?: string,
    options?: CurrencyFormatOptions,
  ): string {
    assertFiniteNumber(value, 'Currency format value');
    validateFractionPolicy(options, 'Currency format');

    const currencyCode = resolveCurrencyCode(currency, this.context.currency);
    validateCurrencyCode(this.context.locale, currencyCode);

    const intlOptions: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: options?.currencyDisplay,
      useGrouping: options?.useGrouping,
      minimumFractionDigits: options?.minimumFractionDigits,
      maximumFractionDigits: options?.maximumFractionDigits,
    };

    if (this.context.numberingSystem !== undefined) {
      intlOptions.numberingSystem = this.context.numberingSystem;
    }

    const formatter = getCachedNumberFormat(this.context.locale, intlOptions);

    return formatter.format(value);
  }

  formatDuration(
    value: DurationValue,
    options?: DurationFormatOptions,
  ): string {
    return formatDurationPresentation(
      value,
      this.context.locale,
      this.context.numberingSystem,
      options,
    );
  }

  formatRange(value: FormatRangeValue, options?: RangeFormatOptions): string {
    if (value.kind === 'number') {
      return formatNumericRangePresentation(
        value,
        (number) => this.formatNumber(number),
        options,
      );
    }

    if (!isDateTimeFormatRangeSupported) {
      throw new Error(
        'Date range formatting is not supported by the current Intl runtime.',
      );
    }

    return formatDateRangePresentation(value, (start, end) => {
      const intlOptions: Intl.DateTimeFormatOptions = {
        dateStyle: 'medium',
      };

      if (this.context.hourCycle !== undefined) {
        intlOptions.hourCycle = this.context.hourCycle;
      }

      const formatter = getCachedDateTimeFormat(
        this.context.locale,
        this.context.timeZone,
        intlOptions,
      );

      return formatter.formatRange(start, end);
    });
  }

  formatMeasurement(
    value: DisplayMeasurement,
    options?: MeasurementFormatOptions,
  ): string {
    assertKnownMeasurementUnit(value.unit);
    assertFiniteNumber(value.value, 'Measurement format value');

    const precision = resolveMeasurementPrecision(value.unit, value.precision);
    validateFractionPolicy(precision, 'Measurement format');

    const formattedValue = this.formatNumber(value.value, {
      minimumFractionDigits: precision.minimumFractionDigits,
      maximumFractionDigits: precision.maximumFractionDigits,
    });

    return composeMeasurementDisplay(formattedValue, value.unit, options);
  }
}
