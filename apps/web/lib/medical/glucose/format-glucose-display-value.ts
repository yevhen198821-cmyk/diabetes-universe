import type { PlatformFormatter } from '@diabetes-universe/formatting';
import type { GlucoseDisplayUnit } from '@diabetes-universe/medical-domain';
import type { SemanticTimelineEvent } from '@diabetes-universe/types';

import { formatGlucoseValueForLocalizedDisplay } from '../client/diabetes-settings-display';
import { resolveGlucosePresentationUnit } from '../client/resolve-glucose-display-unit';

/**
 * Formats a glucose timeline event value for localized display using the shared
 * medical-domain numeric precision contract.
 */
export function formatGlucoseDisplayValueFromTimelineEvent(
  event: Extract<SemanticTimelineEvent, { kind: 'glucose' }>,
  formatter: PlatformFormatter,
  glucoseDisplayUnit: GlucoseDisplayUnit | null,
): string {
  return formatGlucoseValueForLocalizedDisplay(
    formatter,
    event.concentrationMmolPerL,
    resolveGlucosePresentationUnit(glucoseDisplayUnit),
  );
}
