import {
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

export function createWebTimelineSemanticEventValidator(): (
  event: SemanticTimelineEvent,
) => boolean {
  return validateWebTimelineInsulinEvent;
}
