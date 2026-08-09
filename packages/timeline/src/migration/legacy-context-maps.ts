import type {
  GlucoseMeasurementContext,
  NutritionMealType,
} from '@diabetes-universe/types';

const glucoseContextMap: Readonly<Record<string, GlucoseMeasurementContext>> = {
  другое: 'other',
  натощак: 'fasting',
  'перед едой': 'before_meal',
  'перед завтраком': 'before_meal',
  'перед сном': 'bedtime',
  'после еды': 'after_meal',
  'после завтрака': 'after_meal',
};

const nutritionMealTypeMap: Readonly<Record<string, NutritionMealType>> = {
  завтрак: 'breakfast',
  обед: 'lunch',
  перекус: 'snack',
  ужин: 'dinner',
};

const nutritionModeMap: Readonly<Record<string, 'manual' | 'products'>> = {
  'введено вручную': 'manual',
  'рассчитано по продуктам': 'products',
};

function normalizeLegacyLabel(value: string): string {
  return value.trim().toLocaleLowerCase('ru-RU');
}

export function mapLegacyGlucoseContext(
  context: string | undefined,
): GlucoseMeasurementContext | null {
  if (!context) {
    return null;
  }

  const normalized = normalizeLegacyLabel(context);

  if (normalized.length === 0) {
    return null;
  }

  return glucoseContextMap[normalized] ?? null;
}

export function mapLegacyNutritionMealType(
  title: string,
): NutritionMealType | null {
  const normalized = normalizeLegacyLabel(title);

  if (normalized.length === 0) {
    return null;
  }

  return nutritionMealTypeMap[normalized] ?? null;
}

export function mapLegacyNutritionMode(
  context: string | undefined,
): 'manual' | 'products' | null {
  if (!context) {
    return null;
  }

  const normalized = normalizeLegacyLabel(context);

  if (normalized.length === 0) {
    return null;
  }

  return nutritionModeMap[normalized] ?? null;
}
