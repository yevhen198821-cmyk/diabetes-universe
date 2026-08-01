const DECIMAL_INPUT_PATTERN = /^\d+(?:[.,]\d+)?$/;

export function parseNutritionDecimalInput(
  raw: string,
  maxValue: number,
): number | null {
  const trimmed = raw.trim();

  if (!trimmed || !DECIMAL_INPUT_PATTERN.test(trimmed)) {
    return null;
  }

  const value = Number(trimmed.replace(',', '.'));

  if (!Number.isFinite(value) || value <= 0 || value > maxValue) {
    return null;
  }

  return value;
}

export function calculateNutritionProductCarbs(
  weightGrams: number,
  carbsPer100Grams: number,
): number {
  return (weightGrams * carbsPer100Grams) / 100;
}

export function formatNutritionCarbs(carbsGrams: number): string {
  return carbsGrams.toLocaleString('ru-RU', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  });
}

export function formatNutritionCarbsPer100Grams(
  carbsPer100Grams: number,
): string {
  return `${formatNutritionCarbs(carbsPer100Grams)} г углеводов / 100 г`;
}
