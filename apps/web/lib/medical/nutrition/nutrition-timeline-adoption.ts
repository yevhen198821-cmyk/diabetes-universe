import {
  isNutritionMealType,
  validateNutritionCanonicalCarbohydratesGrams,
} from '@diabetes-universe/medical-domain';
import type {
  NutritionItemSnapshot,
  NutritionMealType,
  NutritionProductSnapshot,
} from '@diabetes-universe/types';

/**
 * Known historical meal labels that may be adopted into a canonical enum
 * at the edit-save boundary only. View-time classification never uses this.
 */
const KNOWN_LEGACY_MEAL_TYPE_MAP: Readonly<Record<string, NutritionMealType>> =
  {
    abendessen: 'dinner',
    breakfast: 'breakfast',
    dinner: 'dinner',
    другое: 'other',
    друге: 'other',
    завтрак: 'breakfast',
    інше: 'other',
    lunch: 'lunch',
    mittagessen: 'lunch',
    обід: 'lunch',
    обед: 'lunch',
    other: 'other',
    перекус: 'snack',
    snack: 'snack',
    sonstiges: 'other',
    сніданок: 'breakfast',
    ужин: 'dinner',
    unspecified: 'unspecified',
    вечеря: 'dinner',
    frühstück: 'breakfast',
    zwischenmahlzeit: 'snack',
  };

function normalizeKnownMealLabel(value: string): string {
  return value.trim().toLocaleLowerCase('en-GB');
}

export function mapKnownLegacyNutritionMealType(
  value: string,
): NutritionMealType | null {
  const normalized = normalizeKnownMealLabel(value);

  if (normalized.length === 0) {
    return null;
  }

  if (isNutritionMealType(normalized)) {
    return normalized;
  }

  return KNOWN_LEGACY_MEAL_TYPE_MAP[normalized] ?? null;
}

function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function createNutritionEditItemId(): string {
  return `nutrition-item-${crypto.randomUUID()}`;
}

/**
 * Adopts one legacy v1 product row into a v2 item snapshot.
 *
 * Historical `productId` is never promoted. Incomplete or invalid rows are
 * omitted so the authoritative event total can still be saved.
 */
export function adoptLegacyNutritionProductToItemSnapshot(
  product: NutritionProductSnapshot,
): NutritionItemSnapshot | null {
  const name = product.productName.trim();

  if (name.length === 0) {
    return null;
  }

  const carbohydrates = validateNutritionCanonicalCarbohydratesGrams(
    product.calculatedCarbsGrams,
  );

  if (!carbohydrates.ok) {
    return null;
  }

  return {
    carbohydratesGrams: carbohydrates.carbohydratesGrams,
    itemId: createNutritionEditItemId(),
    name,
    ...(isPositiveFiniteNumber(product.weightGrams)
      ? { weightGrams: product.weightGrams }
      : {}),
    ...(isPositiveFiniteNumber(product.carbsPer100Grams)
      ? { carbsPer100Grams: product.carbsPer100Grams }
      : {}),
  };
}

export function adoptLegacyNutritionProductsToItemSnapshots(
  products: readonly NutritionProductSnapshot[] | undefined,
): readonly NutritionItemSnapshot[] {
  if (products === undefined) {
    return [];
  }

  return products.flatMap((product) => {
    const adopted = adoptLegacyNutritionProductToItemSnapshot(product);

    return adopted === null ? [] : [adopted];
  });
}
