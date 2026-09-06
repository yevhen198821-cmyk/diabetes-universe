import {
  NUTRITION_KIND,
  NUTRITION_SCHEMA_VERSION,
  isNutritionMealType,
  validateNutritionTimelineEventV2,
} from '@diabetes-universe/medical-domain';
import type {
  NutritionItemSnapshot,
  NutritionMealType,
  NutritionQuickAddEntry,
} from '@diabetes-universe/types';

import { calculateNutritionProductCarbs } from './format-nutrition';

export const NUTRITION_QUICK_ADD_MEAL_TYPES = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'other',
] as const satisfies readonly NutritionMealType[];

export type NutritionQuickAddMealType =
  (typeof NUTRITION_QUICK_ADD_MEAL_TYPES)[number];

export type NutritionQuickAddSubmitErrorCode =
  | 'nutrition.meal_type.invalid'
  | 'nutrition.carbohydrates.invalid'
  | 'nutrition.items.invalid'
  | 'nutrition.input.invalid';

export type NutritionQuickAddSubmitResult =
  | {
      readonly ok: true;
      readonly value: NutritionQuickAddEntry;
    }
  | {
      readonly ok: false;
      readonly error: NutritionQuickAddSubmitErrorCode;
    };

export interface NutritionQuickAddItemDraft {
  readonly itemId: string;
  readonly name: string;
  readonly weightGrams: number;
  readonly carbsPer100Grams: number;
}

export function isNutritionQuickAddMealType(
  value: unknown,
): value is NutritionQuickAddMealType {
  return (
    typeof value === 'string' &&
    (NUTRITION_QUICK_ADD_MEAL_TYPES as readonly string[]).includes(value)
  );
}

export function createNutritionItemCarbsSnapshot(
  weightGrams: number,
  carbsPer100Grams: number,
): number {
  return calculateNutritionProductCarbs(weightGrams, carbsPer100Grams);
}

export function buildNutritionQuickAddItemSnapshot(
  draft: NutritionQuickAddItemDraft,
): NutritionItemSnapshot {
  return {
    carbohydratesGrams: createNutritionItemCarbsSnapshot(
      draft.weightGrams,
      draft.carbsPer100Grams,
    ),
    carbsPer100Grams: draft.carbsPer100Grams,
    itemId: draft.itemId,
    name: draft.name,
    weightGrams: draft.weightGrams,
  };
}

export function sumNutritionItemCarbohydrates(
  items: readonly NutritionItemSnapshot[],
): number {
  return items.reduce((total, item) => total + item.carbohydratesGrams, 0);
}

export function prepareNutritionQuickAddSubmit(input: {
  readonly mealType: unknown;
  readonly carbohydratesGrams: unknown;
  readonly time: unknown;
  readonly note?: unknown;
  readonly items?: readonly NutritionItemSnapshot[];
}): NutritionQuickAddSubmitResult {
  if (typeof input.time !== 'string' || input.time.trim().length === 0) {
    return { ok: false, error: 'nutrition.input.invalid' };
  }

  if (!isNutritionQuickAddMealType(input.mealType)) {
    return { ok: false, error: 'nutrition.meal_type.invalid' };
  }

  if (!isNutritionMealType(input.mealType)) {
    return { ok: false, error: 'nutrition.meal_type.invalid' };
  }

  if (
    typeof input.carbohydratesGrams !== 'number' ||
    !Number.isFinite(input.carbohydratesGrams)
  ) {
    return { ok: false, error: 'nutrition.carbohydrates.invalid' };
  }

  const note =
    typeof input.note === 'string' && input.note.trim().length > 0
      ? input.note.trim()
      : undefined;

  const domainResult = validateNutritionTimelineEventV2({
    carbohydratesGrams: input.carbohydratesGrams,
    items: input.items,
    kind: NUTRITION_KIND,
    mealType: input.mealType,
    note,
    schemaVersion: NUTRITION_SCHEMA_VERSION,
  });

  if (!domainResult.ok) {
    if (domainResult.error.startsWith('nutrition.item')) {
      return { ok: false, error: 'nutrition.items.invalid' };
    }

    if (domainResult.error.startsWith('nutrition.carbohydrates')) {
      return { ok: false, error: 'nutrition.carbohydrates.invalid' };
    }

    if (domainResult.error === 'nutrition.meal_type.invalid') {
      return { ok: false, error: 'nutrition.meal_type.invalid' };
    }

    return { ok: false, error: 'nutrition.input.invalid' };
  }

  return {
    ok: true,
    value: {
      carbohydratesGrams: domainResult.value.carbohydratesGrams,
      mealType: domainResult.value.mealType,
      time: input.time,
      ...(domainResult.value.items === undefined
        ? {}
        : { items: domainResult.value.items }),
      ...(domainResult.value.note === undefined
        ? {}
        : { note: domainResult.value.note }),
    },
  };
}
