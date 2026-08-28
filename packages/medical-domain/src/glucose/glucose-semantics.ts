/**
 * Presentation-neutral glucose semantics shared across clients.
 *
 * These states are not localized labels and must not encode clinical advice.
 */

export type GlucoseRangeState =
  'below_range' | 'in_range' | 'above_range' | 'unknown';

export type GlucoseFreshnessState = 'current' | 'recent' | 'old' | 'unknown';

/**
 * Technical data quality for a glucose reading.
 *
 * Distinct from target range state. Quality gates confident presentation.
 */
export type GlucoseDataQualityState =
  'valid' | 'questionable' | 'invalid' | 'unknown';
