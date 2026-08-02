/**
 * Options for relative time presentation formatting.
 */
export interface RelativeTimeFormatOptions {
  readonly numeric?: 'always' | 'auto';
  readonly unit?: 'second' | 'minute' | 'hour' | 'day';
}
