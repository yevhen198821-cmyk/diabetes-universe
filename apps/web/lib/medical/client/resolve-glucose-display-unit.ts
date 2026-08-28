import type { GlucoseDisplayUnit } from '@diabetes-universe/medical-domain';

/**
 * Presentation-only fallback when the authoritative display unit is unset or
 * unavailable. Canonical mmol/L values are shown without implying a persisted
 * user preference.
 */
export function resolveGlucosePresentationUnit(
  glucoseDisplayUnit: GlucoseDisplayUnit | null | undefined,
): GlucoseDisplayUnit {
  return glucoseDisplayUnit ?? 'mmol_per_l';
}
