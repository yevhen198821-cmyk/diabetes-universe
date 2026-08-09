import type { PlatformFormatter } from '@diabetes-universe/formatting';
import type { LocalizationPlatform } from '@diabetes-universe/i18n';

import {
  resolveTimelinePresentationLabels,
  type TimelinePresentationLabels,
} from './timeline-presentation-labels';

export interface TimelinePresentationDependencies {
  readonly formatter: PlatformFormatter;
  readonly labels: TimelinePresentationLabels;
  readonly localization: LocalizationPlatform;
}

export function createTimelinePresentationDependencies(input: {
  readonly formatter: PlatformFormatter;
  readonly localization: LocalizationPlatform;
}): TimelinePresentationDependencies {
  return {
    formatter: input.formatter,
    labels: resolveTimelinePresentationLabels(input.localization),
    localization: input.localization,
  };
}

export function resolveTimelinePresentationLocale(
  dependencies: TimelinePresentationDependencies,
): string {
  return dependencies.localization.localeContext.locale;
}
