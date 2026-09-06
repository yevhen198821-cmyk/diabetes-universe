/**
 * Manual Nutrition carbohydrate input policy for Quick Add.
 *
 * This is the web manual-input boundary: syntax, a two-fraction-digit limit,
 * and a 500 g UI typo ceiling. It is not a clinical rule. Canonical domain
 * validity stays at `NUTRITION_CANONICAL_MAX_CARBOHYDRATES_GRAMS` (1000)
 * with arbitrary precision.
 *
 * The parsed number is returned exactly as entered. No rounding is applied.
 */

export const NUTRITION_MANUAL_CARBS_UI_MAXIMUM = 500;

/** Manual entry accepts at most two fractional digits, dot or comma. */
export const NUTRITION_MANUAL_CARBS_MAXIMUM_FRACTION_DIGITS = 2;

const MANUAL_DECIMAL_PATTERN = /^\d+(?:[.,]\d{1,2})?$/;

export function parseNutritionManualDecimalInput(
  raw: string,
  maximum: number = NUTRITION_MANUAL_CARBS_UI_MAXIMUM,
): number | null {
  const trimmed = raw.trim();

  if (!MANUAL_DECIMAL_PATTERN.test(trimmed)) {
    return null;
  }

  const value = Number(trimmed.replace(',', '.'));

  if (!Number.isFinite(value) || value <= 0 || value > maximum) {
    return null;
  }

  return value;
}

export function parseNutritionManualCarbsInput(raw: string): number | null {
  return parseNutritionManualDecimalInput(
    raw,
    NUTRITION_MANUAL_CARBS_UI_MAXIMUM,
  );
}
