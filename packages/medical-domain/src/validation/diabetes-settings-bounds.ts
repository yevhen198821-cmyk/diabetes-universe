/**
 * Canonical validation bounds for diabetes settings domain values.
 *
 * Glucose concentration bounds align with medical event validation
 * (`GLUCOSE_MMOL_MIN` / `GLUCOSE_MMOL_MAX` in apps/web medical API validation).
 */
export const DIABETES_SETTINGS_VALIDATION_BOUNDS = {
  GLUCOSE_MMOL_MIN: 0.1,
  GLUCOSE_MMOL_MAX: 100,
  DIABETES_TYPE_OTHER_DESCRIPTOR_MAX_LENGTH: 256,
} as const;
