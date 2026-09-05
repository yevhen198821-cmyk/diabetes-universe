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
  readonly carbsPer100Grams: number;
}

/**
 * Presentation-only demo catalogue. IDs are not food-database identities
 * and must not be persisted on canonical Nutrition v2 events.
 */
export const nutritionDemoProducts: readonly NutritionDemoProduct[] = [
  { carbsPer100Grams: 14, id: 'apple' },
  { carbsPer100Grams: 23, id: 'banana' },
  { carbsPer100Grams: 12, id: 'oatmealCooked' },
  { carbsPer100Grams: 28, id: 'riceBoiled' },
  { carbsPer100Grams: 17, id: 'potatoBoiled' },
  { carbsPer100Grams: 43, id: 'wholegrainBread' },
  { carbsPer100Grams: 5, id: 'milk' },
  { carbsPer100Grams: 4, id: 'plainYogurt' },
];

export function findNutritionDemoProductById(
  productId: string,
): NutritionDemoProduct | undefined {
  return nutritionDemoProducts.find((product) => product.id === productId);
}
