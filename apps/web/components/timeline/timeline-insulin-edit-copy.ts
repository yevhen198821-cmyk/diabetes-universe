import type { LocalizationPlatform } from '@diabetes-universe/i18n';

import { resolveInsulinPresentationLabels } from '../../lib/medical/insulin';
import type { TimelineInsulinEditCopy } from './timeline-event-detail-model';
import { resolveTimelineUiLabels } from './timeline-ui-labels';

/**
 * Localized copy required to save an insulin edit.
 *
 * Keeping this in one place ensures no insulin edit string is hardcoded in the
 * edit model or the dialog.
 */
export function resolveTimelineInsulinEditCopy(
  localization: LocalizationPlatform,
): TimelineInsulinEditCopy {
  const errorLabels =
    resolveTimelineUiLabels(localization).detail.form.insulin.errors;

  return {
    errors: {
      'insulin.dose.out_of_ui_bound': errorLabels.doseRange,
      'insulin.preparation.other_name_required': errorLabels.otherNameRequired,
    },
    labels: resolveInsulinPresentationLabels(localization),
  };
}
