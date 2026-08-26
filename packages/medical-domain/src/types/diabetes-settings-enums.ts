/**
 * Canonical glucose display unit codes for Diabetes Settings persistence and API.
 *
 * Maps to formatting-layer symbols via `mapGlucoseDisplayUnitToMeasurementUnit()`.
 */
export type GlucoseDisplayUnit = 'mmol_per_l' | 'mg_per_dl';

export const GLUCOSE_DISPLAY_UNITS = [
  'mmol_per_l',
  'mg_per_dl',
] as const satisfies readonly GlucoseDisplayUnit[];

/**
 * Approved Wave 2 informational diabetes type taxonomy.
 *
 * Default `unknown` is an explicit product state, not a missing/unset value.
 */
export type DiabetesTypeCategory =
  'type_1' | 'type_2' | 'gestational' | 'other' | 'unknown';

export const DIABETES_TYPE_CATEGORIES = [
  'type_1',
  'type_2',
  'gestational',
  'other',
  'unknown',
] as const satisfies readonly DiabetesTypeCategory[];

export type DiabetesTypeSource = 'self_reported';

export const DIABETES_TYPE_SOURCE_SELF_REPORTED =
  'self_reported' as const satisfies DiabetesTypeSource;

/**
 * Provenance for medically meaningful glucose target values.
 *
 * `system_reference` is not equivalent to `user_defined` (Wave 2A INV-006).
 */
export type TargetRangeSource =
  'user_defined' | 'clinician_defined' | 'imported' | 'system_reference';

export const TARGET_RANGE_SOURCES = [
  'user_defined',
  'clinician_defined',
  'imported',
  'system_reference',
] as const satisfies readonly TargetRangeSource[];
