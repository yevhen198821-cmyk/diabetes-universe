/**
 * Options for measurement presentation formatting.
 *
 * Precision is supplied by `DisplayMeasurement.precision`, not by these options.
 */
export interface MeasurementFormatOptions {
  readonly unitDisplay?: 'long' | 'short' | 'narrow';
}
