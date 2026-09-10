import { DIABETES_SETTINGS_VALIDATION_BOUNDS } from '../validation/diabetes-settings-bounds';

/** Technical transport/storage limits, not a treatment or target range. */
export function isCanonicalGlucoseConcentration(
  value: unknown,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= DIABETES_SETTINGS_VALIDATION_BOUNDS.GLUCOSE_MMOL_MIN &&
    value <= DIABETES_SETTINGS_VALIDATION_BOUNDS.GLUCOSE_MMOL_MAX
  );
}
