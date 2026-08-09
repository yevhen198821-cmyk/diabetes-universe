import {
  createPlatformFormatter,
  type PlatformFormatter,
} from '@diabetes-universe/formatting';
import type { LocalizationPlatform } from '@diabetes-universe/i18n';

import {
  resolveTimelinePresentationLabels,
  type TimelinePresentationLabels,
} from './timeline-presentation-labels';

/**
 * Wave-1 medical numeric formatting locale.
 *
 * Demo fixtures and legacy repository mirrors use Russian decimal separators
 * regardless of dashboard UI locale. Numeric presentation uses a dedicated
 * formatter instance while system labels resolve through localization.
 */
export const TIMELINE_MEDICAL_VALUE_FORMAT_LOCALE = 'ru-RU';

export interface TimelinePresentationDependencies {
  readonly formatter: PlatformFormatter;
  readonly labels: TimelinePresentationLabels;
  readonly localization: LocalizationPlatform;
  readonly valueFormatter: PlatformFormatter;
}

export function createTimelinePresentationDependencies(input: {
  readonly formatter: PlatformFormatter;
  readonly localization: LocalizationPlatform;
  readonly timeZone: string;
}): TimelinePresentationDependencies {
  return {
    formatter: input.formatter,
    labels: resolveTimelinePresentationLabels(input.localization),
    localization: input.localization,
    valueFormatter: createPlatformFormatter({
      locale: TIMELINE_MEDICAL_VALUE_FORMAT_LOCALE,
      timeZone: input.timeZone,
    }),
  };
}
