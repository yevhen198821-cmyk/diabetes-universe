import { NUTRITION_CANONICAL_MAX_CARBOHYDRATES_GRAMS } from './nutrition-constants';

export type NutritionCanonicalCarbohydratesValidationErrorCode =
  | 'nutrition.carbohydrates.not_a_number'
  | 'nutrition.carbohydrates.not_finite'
  | 'nutrition.carbohydrates.not_positive'
  | 'nutrition.carbohydrates.above_technical_maximum';

export type NutritionCanonicalCarbohydratesValidationResult =
  | {
      readonly ok: true;
      readonly carbohydratesGrams: number;
    }
  | {
      readonly ok: false;
      readonly error: NutritionCanonicalCarbohydratesValidationErrorCode;
    };

/**
 * Validates a canonical carbohydrate mass without rounding or decimal-place
 * policy.
 *
 * Accepts historical, API, and imported values up to the technical maximum.
 * The future manual UI guard of 500 g is presentation policy, not this
 * validator.
 */
export function validateNutritionCanonicalCarbohydratesGrams(
  value: unknown,
): NutritionCanonicalCarbohydratesValidationResult {
  if (typeof value !== 'number') {
    return { ok: false, error: 'nutrition.carbohydrates.not_a_number' };
  }

  if (!Number.isFinite(value)) {
    return { ok: false, error: 'nutrition.carbohydrates.not_finite' };
  }

  if (value <= 0) {
    return { ok: false, error: 'nutrition.carbohydrates.not_positive' };
  }

  if (value > NUTRITION_CANONICAL_MAX_CARBOHYDRATES_GRAMS) {
    return {
      ok: false,
      error: 'nutrition.carbohydrates.above_technical_maximum',
    };
  }

  return { ok: true, carbohydratesGrams: value };
}
