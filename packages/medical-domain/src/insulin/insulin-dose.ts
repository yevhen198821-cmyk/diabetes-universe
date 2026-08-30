/**
 * Canonical insulin administration dose validity.
 *
 * The 500 IU ceiling is the existing medical API technical transport bound.
 * It is not a therapeutic maximum, recommended dose, or safety claim.
 */

export const INSULIN_CANONICAL_DOSE_TECHNICAL_MAXIMUM = 500;

export type InsulinCanonicalDoseValidationErrorCode =
  | 'insulin.dose.not_a_number'
  | 'insulin.dose.not_finite'
  | 'insulin.dose.not_positive'
  | 'insulin.dose.above_technical_maximum';

export type InsulinCanonicalDoseValidationResult =
  | {
      readonly ok: true;
      readonly doseUnits: number;
    }
  | {
      readonly ok: false;
      readonly error: InsulinCanonicalDoseValidationErrorCode;
    };

/**
 * Validates a canonical IU dose without rounding or decimal-place policy.
 *
 * Wave 4C may later apply a two-decimal rule to manual parsers only.
 */
export function validateInsulinCanonicalDose(
  value: unknown,
): InsulinCanonicalDoseValidationResult {
  if (typeof value !== 'number') {
    return { ok: false, error: 'insulin.dose.not_a_number' };
  }

  if (!Number.isFinite(value)) {
    return { ok: false, error: 'insulin.dose.not_finite' };
  }

  if (value <= 0) {
    return { ok: false, error: 'insulin.dose.not_positive' };
  }

  if (value > INSULIN_CANONICAL_DOSE_TECHNICAL_MAXIMUM) {
    return { ok: false, error: 'insulin.dose.above_technical_maximum' };
  }

  return { ok: true, doseUnits: value };
}
