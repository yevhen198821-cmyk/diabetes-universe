import { validateNutritionCanonicalCarbohydratesGrams } from './nutrition-carbohydrates';
import { isRecordInput } from './nutrition-registry';

/**
 * Historical item snapshot captured on a canonical Nutrition v2 event.
 *
 * `itemId` is an opaque identity inside this record only. It is not a food
 * catalogue key. `name` is a display snapshot, not a lookup key.
 */
export interface NutritionItemSnapshot {
  readonly itemId: string;
  readonly name: string;
  readonly carbohydratesGrams: number;
  readonly weightGrams?: number;
  readonly carbsPer100Grams?: number;
}

export type NutritionItemSnapshotValidationErrorCode =
  | 'nutrition.item.input.invalid'
  | 'nutrition.item.item_id.empty'
  | 'nutrition.item.name.empty'
  | 'nutrition.carbohydrates.not_a_number'
  | 'nutrition.carbohydrates.not_finite'
  | 'nutrition.carbohydrates.not_positive'
  | 'nutrition.carbohydrates.above_technical_maximum'
  | 'nutrition.item.weight_grams.invalid'
  | 'nutrition.item.carbs_per_100_grams.invalid';

export type NutritionItemSnapshotValidationResult =
  | {
      readonly ok: true;
      readonly value: NutritionItemSnapshot;
    }
  | {
      readonly ok: false;
      readonly error: NutritionItemSnapshotValidationErrorCode;
    };

function readNonEmptyOpaqueId(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  return value.trim().length > 0 ? value : null;
}

function readTrimmedName(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function validateOptionalPositiveFiniteMass(value: unknown): boolean {
  if (value === undefined) {
    return true;
  }

  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/**
 * Validates one historical item snapshot.
 *
 * Does not look up items by name, treat `productId` as catalogue identity,
 * recompute carbs from weight × carbs-per-100, or consult a food database.
 */
export function validateNutritionItemSnapshot(
  value: unknown,
): NutritionItemSnapshotValidationResult {
  if (!isRecordInput(value)) {
    return { ok: false, error: 'nutrition.item.input.invalid' };
  }

  const itemId = readNonEmptyOpaqueId(value.itemId);

  if (itemId === null) {
    return { ok: false, error: 'nutrition.item.item_id.empty' };
  }

  const name = readTrimmedName(value.name);

  if (name === null) {
    return { ok: false, error: 'nutrition.item.name.empty' };
  }

  const carbsResult = validateNutritionCanonicalCarbohydratesGrams(
    value.carbohydratesGrams,
  );

  if (!carbsResult.ok) {
    return carbsResult;
  }

  if (!validateOptionalPositiveFiniteMass(value.weightGrams)) {
    return { ok: false, error: 'nutrition.item.weight_grams.invalid' };
  }

  if (!validateOptionalPositiveFiniteMass(value.carbsPer100Grams)) {
    return { ok: false, error: 'nutrition.item.carbs_per_100_grams.invalid' };
  }

  const snapshot: NutritionItemSnapshot = {
    itemId,
    name,
    carbohydratesGrams: carbsResult.carbohydratesGrams,
  };

  if (value.weightGrams !== undefined) {
    return {
      ok: true,
      value: {
        ...snapshot,
        weightGrams: value.weightGrams,
        ...(value.carbsPer100Grams === undefined
          ? {}
          : { carbsPer100Grams: value.carbsPer100Grams }),
      },
    };
  }

  if (value.carbsPer100Grams !== undefined) {
    return {
      ok: true,
      value: {
        ...snapshot,
        carbsPer100Grams: value.carbsPer100Grams,
      },
    };
  }

  return { ok: true, value: snapshot };
}
