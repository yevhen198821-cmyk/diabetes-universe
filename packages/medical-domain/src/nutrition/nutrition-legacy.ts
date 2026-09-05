import type { NutritionTimelineEvent } from '@diabetes-universe/types';

import {
  NUTRITION_KIND,
  NUTRITION_LEGACY_SCHEMA_VERSION,
  NUTRITION_SCHEMA_VERSION,
} from './nutrition-constants';
import { isRecordInput } from './nutrition-registry';
import type { NutritionTimelineEventV2 } from './nutrition-timeline-event-v2';
import type { NutritionTimelineEventV2ValidationErrorCode } from './nutrition-timeline-event-v2';
import { validateNutritionTimelineEventV2 } from './nutrition-timeline-event-v2';

/**
 * Persisted Nutrition v1 event. The current Timeline / Quick Add / API
 * contract. Wave 5A does not rewrite these records to v2.
 */
export type NutritionTimelineEventLegacy = NutritionTimelineEvent;

export type NutritionTimelineEventClassification =
  | {
      readonly status: 'canonical_v2';
      readonly value: NutritionTimelineEventV2;
    }
  | {
      readonly status: 'legacy_v1';
      readonly record: Readonly<Record<string, unknown>>;
    }
  | {
      readonly status: 'invalid';
      readonly error: NutritionTimelineEventV2ValidationErrorCode;
    };

export function isNutritionLegacySchemaVersion(
  value: unknown,
): value is typeof NUTRITION_LEGACY_SCHEMA_VERSION {
  return value === NUTRITION_LEGACY_SCHEMA_VERSION;
}

export function isNutritionCanonicalSchemaVersion(
  value: unknown,
): value is typeof NUTRITION_SCHEMA_VERSION {
  return value === NUTRITION_SCHEMA_VERSION;
}

/**
 * Distinguishes persisted Nutrition v1 from canonical Nutrition v2.
 *
 * Legacy schemaVersion 1 is returned as `legacy_v1` without applying the
 * strict v2 validator. Unknown meal-type strings are not inferred.
 */
export function classifyNutritionTimelineEvent(
  value: unknown,
): NutritionTimelineEventClassification {
  if (!isRecordInput(value)) {
    return { status: 'invalid', error: 'nutrition.input.invalid' };
  }

  if (value.kind !== NUTRITION_KIND) {
    return { status: 'invalid', error: 'nutrition.kind.invalid' };
  }

  if (isNutritionCanonicalSchemaVersion(value.schemaVersion)) {
    const result = validateNutritionTimelineEventV2(value);

    if (!result.ok) {
      return { status: 'invalid', error: result.error };
    }

    return { status: 'canonical_v2', value: result.value };
  }

  if (isNutritionLegacySchemaVersion(value.schemaVersion)) {
    return { status: 'legacy_v1', record: value };
  }

  return { status: 'invalid', error: 'nutrition.schema_version.invalid' };
}
