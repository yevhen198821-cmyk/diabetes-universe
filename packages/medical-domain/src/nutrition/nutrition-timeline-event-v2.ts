import type { NutritionCanonicalCarbohydratesValidationErrorCode } from './nutrition-carbohydrates';
import { validateNutritionCanonicalCarbohydratesGrams } from './nutrition-carbohydrates';
import {
  NUTRITION_KIND,
  NUTRITION_SCHEMA_VERSION,
} from './nutrition-constants';
import type { NutritionItemSnapshot } from './nutrition-item-snapshot';
import type { NutritionItemSnapshotValidationErrorCode } from './nutrition-item-snapshot';
import { validateNutritionItemSnapshot } from './nutrition-item-snapshot';
import type { NutritionMealType } from './nutrition-meal-type';
import { isNutritionMealType } from './nutrition-meal-type';
import { isRecordInput } from './nutrition-registry';

/**
 * Canonical Nutrition v2 semantic payload.
 *
 * Envelope fields (`id`, `occurredAt`, …) stay on `SemanticEventEnvelope`.
 * This wave does not replace persisted `NutritionTimelineEvent`.
 */
export interface NutritionTimelineEventV2 {
  readonly kind: typeof NUTRITION_KIND;
  readonly mealType: NutritionMealType;
  readonly carbohydratesGrams: number;
  readonly items?: readonly NutritionItemSnapshot[];
  readonly note?: string;
  readonly schemaVersion: typeof NUTRITION_SCHEMA_VERSION;
}

export type NutritionTimelineEventV2ValidationErrorCode =
  | 'nutrition.input.invalid'
  | 'nutrition.kind.invalid'
  | 'nutrition.schema_version.invalid'
  | 'nutrition.meal_type.invalid'
  | 'nutrition.legacy_field.not_allowed'
  | 'nutrition.items.not_an_array'
  | 'nutrition.items.empty'
  | 'nutrition.note.invalid'
  | NutritionCanonicalCarbohydratesValidationErrorCode
  | NutritionItemSnapshotValidationErrorCode;

export type NutritionTimelineEventV2ValidationResult =
  | {
      readonly ok: true;
      readonly value: NutritionTimelineEventV2;
    }
  | {
      readonly ok: false;
      readonly error: NutritionTimelineEventV2ValidationErrorCode;
    };

const LEGACY_NUTRITION_FIELDS = [
  'mode',
  'products',
  'calculatedCarbsGrams',
] as const;

function readOptionalNote(
  value: unknown,
): { readonly ok: true; readonly note?: string } | { readonly ok: false } {
  if (value === undefined) {
    return { ok: true };
  }

  if (typeof value !== 'string') {
    return { ok: false };
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? { ok: true, note: trimmed } : { ok: true };
}

/**
 * Validates a canonical Nutrition v2 payload.
 *
 * `carbohydratesGrams` is the authoritative historical total. Item masses
 * are snapshots only. This function does not recompute, round, or repair
 * a mismatch, and it does not apply to legacy schemaVersion 1 records.
 */
export function validateNutritionTimelineEventV2(
  value: unknown,
): NutritionTimelineEventV2ValidationResult {
  if (!isRecordInput(value)) {
    return { ok: false, error: 'nutrition.input.invalid' };
  }

  if (value.kind !== NUTRITION_KIND) {
    return { ok: false, error: 'nutrition.kind.invalid' };
  }

  if (value.schemaVersion !== NUTRITION_SCHEMA_VERSION) {
    return { ok: false, error: 'nutrition.schema_version.invalid' };
  }

  for (const field of LEGACY_NUTRITION_FIELDS) {
    if (field in value) {
      return { ok: false, error: 'nutrition.legacy_field.not_allowed' };
    }
  }

  if (!isNutritionMealType(value.mealType)) {
    return { ok: false, error: 'nutrition.meal_type.invalid' };
  }

  const carbsResult = validateNutritionCanonicalCarbohydratesGrams(
    value.carbohydratesGrams,
  );

  if (!carbsResult.ok) {
    return carbsResult;
  }

  const noteResult = readOptionalNote(value.note);

  if (!noteResult.ok) {
    return { ok: false, error: 'nutrition.note.invalid' };
  }

  if (value.items === undefined) {
    return {
      ok: true,
      value: {
        kind: NUTRITION_KIND,
        mealType: value.mealType,
        carbohydratesGrams: carbsResult.carbohydratesGrams,
        schemaVersion: NUTRITION_SCHEMA_VERSION,
        ...(noteResult.note === undefined ? {} : { note: noteResult.note }),
      },
    };
  }

  if (!Array.isArray(value.items)) {
    return { ok: false, error: 'nutrition.items.not_an_array' };
  }

  if (value.items.length === 0) {
    return { ok: false, error: 'nutrition.items.empty' };
  }

  const items: NutritionItemSnapshot[] = [];

  for (const item of value.items) {
    const itemResult = validateNutritionItemSnapshot(item);

    if (!itemResult.ok) {
      return itemResult;
    }

    items.push(itemResult.value);
  }

  return {
    ok: true,
    value: {
      kind: NUTRITION_KIND,
      mealType: value.mealType,
      carbohydratesGrams: carbsResult.carbohydratesGrams,
      items,
      schemaVersion: NUTRITION_SCHEMA_VERSION,
      ...(noteResult.note === undefined ? {} : { note: noteResult.note }),
    },
  };
}
