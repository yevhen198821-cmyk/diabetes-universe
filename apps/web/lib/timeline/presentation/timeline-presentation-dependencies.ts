import type { PlatformFormatter } from '@diabetes-universe/formatting';
import type { LocalizationPlatform } from '@diabetes-universe/i18n';
import type {
  GlucoseDisplayUnit,
  GlucoseTargetRange,
} from '@diabetes-universe/medical-domain';

import { resolveGlucosePresentationUnit } from '../../medical/client/resolve-glucose-display-unit';
import {
  resolveTimelinePresentationLabels,
  type TimelinePresentationLabels,
} from './timeline-presentation-labels';

export interface TimelinePresentationDependencies {
  readonly formatter: PlatformFormatter;
  readonly glucoseDisplayUnit: GlucoseDisplayUnit | null;
  readonly labels: TimelinePresentationLabels;
  readonly localization: LocalizationPlatform;
  readonly referenceTime: Date | string;
  readonly targetRange: GlucoseTargetRange | null;
}

export function createTimelinePresentationDependencies(input: {
  readonly formatter: PlatformFormatter;
  readonly glucoseDisplayUnit?: GlucoseDisplayUnit | null;
  readonly localization: LocalizationPlatform;
  readonly referenceTime?: Date | string;
  readonly targetRange?: GlucoseTargetRange | null;
}): TimelinePresentationDependencies {
  return {
    formatter: input.formatter,
    glucoseDisplayUnit: input.glucoseDisplayUnit ?? null,
    labels: resolveTimelinePresentationLabels(input.localization),
    localization: input.localization,
    referenceTime: input.referenceTime ?? new Date(),
    targetRange: input.targetRange ?? null,
  };
}

export function resolveTimelineGlucoseDisplayUnit(
  dependencies: TimelinePresentationDependencies,
): GlucoseDisplayUnit {
  return resolveGlucosePresentationUnit(dependencies.glucoseDisplayUnit);
}

export function resolveTimelinePresentationLocale(
  dependencies: TimelinePresentationDependencies,
): string {
  return dependencies.localization.localeContext.locale;
}
