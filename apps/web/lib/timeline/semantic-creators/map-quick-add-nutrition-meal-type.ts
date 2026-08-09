import type { NutritionMealType } from '@diabetes-universe/types';

const quickAddNutritionMealTypeMap: Readonly<
  Record<string, NutritionMealType>
> = {
  завтрак: 'breakfast',
  другое: 'other',
  обед: 'lunch',
  перекус: 'snack',
  ужин: 'dinner',
};

function normalizeQuickAddLabel(value: string): string {
  return value.trim().toLocaleLowerCase('ru-RU');
}

export function mapQuickAddNutritionMealType(
  mealType: string,
): NutritionMealType | string {
  const normalized = normalizeQuickAddLabel(mealType);

  if (normalized.length === 0) {
    return mealType.trim();
  }

  return quickAddNutritionMealTypeMap[normalized] ?? mealType.trim();
}
