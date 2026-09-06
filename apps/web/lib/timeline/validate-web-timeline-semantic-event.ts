import {
  classifyNutritionTimelineEvent,
  INSULIN_PREPARATION_OTHER_ID,
  isInsulinAdministrationContext,
  isInsulinPreparationId,
  validateInsulinCanonicalDose,
} from '@diabetes-universe/medical-domain';
import type { SemanticTimelineEvent } from '@diabetes-universe/types';

function isNonEmptyTrimmedString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Supplemental insulin semantic validation for web timeline persistence.
 *
 * Composed at the web timeline root so generic timeline-web never depends on
 * medical-domain.
 */
export function validateWebTimelineInsulinEvent(
  event: SemanticTimelineEvent,
): boolean {
  if (event.kind !== 'insulin') {
    return true;
  }

  if (!isNonEmptyTrimmedString(event.preparation)) {
    return false;
  }

  const doseResult = validateInsulinCanonicalDose(event.doseUnits);

  if (!doseResult.ok) {
    return false;
  }

  if (event.preparationId !== undefined) {
    if (!isInsulinPreparationId(event.preparationId)) {
      return false;
    }

    if (
      event.preparationId === INSULIN_PREPARATION_OTHER_ID &&
      event.preparation.trim().length === 0
    ) {
      return false;
    }
  }

  if (
    event.administrationContext !== undefined &&
    !isInsulinAdministrationContext(event.administrationContext)
  ) {
    return false;
  }

  return true;
}

/**
 * Supplemental Nutrition semantic validation for web timeline persistence.
 *
 * Accepts readable legacy v1 history and canonical v2 events validated by
 * Wave 5A medical-domain rules. Rejects invalid v2 without inference or repair.
 */
export function validateWebTimelineNutritionEvent(
  event: SemanticTimelineEvent,
): boolean {
  if (event.kind !== 'nutrition') {
    return true;
  }

  const classification = classifyNutritionTimelineEvent(event);

  return (
    classification.status === 'canonical_v2' ||
    classification.status === 'legacy_v1'
  );
}

export function validateWebTimelineSemanticEvent(
  event: SemanticTimelineEvent,
): boolean {
  if (!validateWebTimelineInsulinEvent(event)) {
    return false;
  }

  return validateWebTimelineNutritionEvent(event);
}

export function createWebTimelineSemanticEventValidator(): (
  event: SemanticTimelineEvent,
) => boolean {
  return validateWebTimelineSemanticEvent;
}
