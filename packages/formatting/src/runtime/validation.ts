import type { NumberFormatOptions } from '../contracts/options/number-format-options';

export function assertNonEmptyString(
  value: string,
  fieldName: 'locale' | 'timeZone',
): void {
  if (value.trim().length === 0) {
    throw new Error(`Formatting context ${fieldName} must not be empty.`);
  }
}

export function validateLocale(locale: string): void {
  assertNonEmptyString(locale, 'locale');

  try {
    Intl.DateTimeFormat(locale);
  } catch {
    throw new Error(
      `Formatting context locale "${locale}" is not supported by Intl.`,
    );
  }
}

export function validateTimeZone(timeZone: string): void {
  assertNonEmptyString(timeZone, 'timeZone');

  try {
    Intl.DateTimeFormat('en-GB', { timeZone });
  } catch {
    throw new Error(
      `Formatting context timeZone "${timeZone}" is not supported by Intl.`,
    );
  }
}

export function assertFiniteNumber(value: number, context: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${context} must be a finite number.`);
  }
}

export function validateFractionPolicy(
  options: NumberFormatOptions | undefined,
  context: string,
): void {
  const { minimumFractionDigits, maximumFractionDigits } = options ?? {};

  if (minimumFractionDigits !== undefined) {
    if (!Number.isInteger(minimumFractionDigits) || minimumFractionDigits < 0) {
      throw new Error(
        `${context} minimumFractionDigits must be a non-negative integer.`,
      );
    }
  }

  if (maximumFractionDigits !== undefined) {
    if (!Number.isInteger(maximumFractionDigits) || maximumFractionDigits < 0) {
      throw new Error(
        `${context} maximumFractionDigits must be a non-negative integer.`,
      );
    }
  }

  if (
    minimumFractionDigits !== undefined &&
    maximumFractionDigits !== undefined &&
    minimumFractionDigits > maximumFractionDigits
  ) {
    throw new Error(
      `${context} minimumFractionDigits must not be greater than maximumFractionDigits.`,
    );
  }
}

export function resolveCurrencyCode(
  explicitCurrency: string | undefined,
  contextCurrency: string | undefined,
): string {
  const currency = explicitCurrency ?? contextCurrency;

  if (currency === undefined) {
    throw new Error(
      'Currency format requires an explicit currency code or FormattingContext.currency.',
    );
  }

  if (currency.trim().length === 0) {
    throw new Error('Currency code must not be empty.');
  }

  return currency;
}

export function validateCurrencyCode(locale: string, currency: string): void {
  try {
    new Intl.NumberFormat(locale, { style: 'currency', currency });
  } catch {
    throw new Error(`Currency code "${currency}" is not supported by Intl.`);
  }
}
