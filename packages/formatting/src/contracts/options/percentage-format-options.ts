/**
 * Options for percentage presentation formatting.
 *
 * Input semantics: `0.25` represents `25%`.
 */
export interface PercentageFormatOptions {
  readonly useGrouping?: boolean;
  readonly minimumFractionDigits?: number;
  readonly maximumFractionDigits?: number;
}
