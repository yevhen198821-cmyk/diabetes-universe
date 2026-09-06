import type { NutritionItemSnapshot } from '@diabetes-universe/types';

import { calculateNutritionProductCarbs } from './format-nutrition';

export const NUTRITION_DEMO_PRODUCT_IDS = [
  'apple',
  'banana',
  'oatmealCooked',
  'riceBoiled',
  'potatoBoiled',
  'wholegrainBread',
  'milk',
  'plainYogurt',
] as const;

export type NutritionDemoProductId =
  (typeof NUTRITION_DEMO_PRODUCT_IDS)[number];

export interface NutritionDemoProduct {
  readonly id: NutritionDemoProductId;
  /**
   * Locale-independent historical snapshot written to
   * `NutritionItemSnapshot.name`. This is not a product identity, not a
   * catalogue lookup key, and not the localized UI label.
   */
  readonly canonicalSnapshotName: string;
  readonly carbsPer100Grams: number;
}

/**
 * Presentation-only demo catalogue. IDs are not food-database identities
 * and must not be persisted on canonical Nutrition v2 events.
 */
export const nutritionDemoProducts: readonly NutritionDemoProduct[] = [
  {
    canonicalSnapshotName: 'Apple',
    carbsPer100Grams: 14,
    id: 'apple',
  },
  {
    canonicalSnapshotName: 'Banana',
    carbsPer100Grams: 23,
    id: 'banana',
  },
  {
    canonicalSnapshotName: 'Cooked oatmeal',
    carbsPer100Grams: 12,
    id: 'oatmealCooked',
  },
  {
    canonicalSnapshotName: 'Boiled rice',
    carbsPer100Grams: 28,
    id: 'riceBoiled',
  },
  {
    canonicalSnapshotName: 'Boiled potato',
    carbsPer100Grams: 17,
    id: 'potatoBoiled',
  },
  {
    canonicalSnapshotName: 'Wholegrain bread',
    carbsPer100Grams: 43,
    id: 'wholegrainBread',
  },
  {
    canonicalSnapshotName: 'Milk',
    carbsPer100Grams: 5,
    id: 'milk',
  },
  {
    canonicalSnapshotName: 'Plain yogurt',
    carbsPer100Grams: 4,
    id: 'plainYogurt',
  },
];

export function findNutritionDemoProductById(
  productId: string,
): NutritionDemoProduct | undefined {
  return nutritionDemoProducts.find((product) => product.id === productId);
}

/**
 * Builds the locale-independent item snapshot written by demo Quick Add.
 * Never copies UI catalogue labels or the presentation `id`.
 */
export function buildNutritionDemoItemWriteSnapshot(input: {
  readonly itemId: string;
  readonly product: NutritionDemoProduct;
  readonly weightGrams: number;
}): NutritionItemSnapshot {
  return {
    carbohydratesGrams: calculateNutritionProductCarbs(
      input.weightGrams,
      input.product.carbsPer100Grams,
    ),
    carbsPer100Grams: input.product.carbsPer100Grams,
    itemId: input.itemId,
    name: input.product.canonicalSnapshotName,
    weightGrams: input.weightGrams,
  };
}
