import {
  freezeKeys,
  freezeRecord,
  type KeysMatchUnion,
} from './nutrition-registry';

/**
 * Canonical meal-type identifiers for Nutrition v2.
 *
 * These are storage/domain tokens. Do not localize them. Do not infer them
 * from display strings such as "Breakfast", "Frühstück", or "Завтрак".
 *
 * Distinct from `@diabetes-universe/types` `NutritionMealType`, which is the
 * persisted v1 identifier subset (no `unspecified`) used by current UI.
 */
export type NutritionMealType =
  'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other' | 'unspecified';

const NUTRITION_MEAL_TYPE_REGISTRY = freezeRecord({
  breakfast: true,
  lunch: true,
  dinner: true,
  snack: true,
  other: true,
  unspecified: true,
} as const satisfies Record<NutritionMealType, true>);

true satisfies KeysMatchUnion<
  typeof NUTRITION_MEAL_TYPE_REGISTRY,
  NutritionMealType
>;

export const NUTRITION_MEAL_TYPES = freezeKeys(NUTRITION_MEAL_TYPE_REGISTRY);

const NUTRITION_MEAL_TYPE_SET: ReadonlySet<NutritionMealType> = new Set(
  NUTRITION_MEAL_TYPES,
);

export function isNutritionMealType(
  value: unknown,
): value is NutritionMealType {
  return (
    typeof value === 'string' &&
    NUTRITION_MEAL_TYPE_SET.has(value as NutritionMealType)
  );
}
