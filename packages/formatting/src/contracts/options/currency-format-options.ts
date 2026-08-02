/**
 * Options for currency presentation formatting.
 *
 * Currency code is passed explicitly to `formatCurrency()` and is not inferred
 * automatically from `FormattingContext`.
 */
export interface CurrencyFormatOptions {
  readonly currencyDisplay?: 'symbol' | 'narrowSymbol' | 'code' | 'name';
  readonly useGrouping?: boolean;
  readonly minimumFractionDigits?: number;
  readonly maximumFractionDigits?: number;
}
