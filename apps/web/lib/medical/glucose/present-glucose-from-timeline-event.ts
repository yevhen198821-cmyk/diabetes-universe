import type { PlatformFormatter } from '@diabetes-universe/formatting';
import type {
  LocalizationPlatform,
  TranslationKey,
} from '@diabetes-universe/i18n';
import type {
  GlucoseDisplayUnit,
  GlucoseFreshnessPolicy,
  GlucosePresentationModel,
  GlucoseTargetRange,
} from '@diabetes-universe/medical-domain';
import type {
  GlucoseMeasurementContext,
  SemanticTimelineEvent,
} from '@diabetes-universe/types';

import { resolveGlucosePresentationUnit } from '../client/resolve-glucose-display-unit';
import { adaptGlucosePresentationForDisplay } from './glucose-presentation-adapter';
import { resolveGlucoseRangeStateLabel } from './glucose-range-state-labels';

export interface PresentGlucoseFromTimelineEventInput {
  readonly event: Extract<SemanticTimelineEvent, { kind: 'glucose' }>;
  readonly formatter: PlatformFormatter;
  readonly glucoseDisplayUnit: GlucoseDisplayUnit | null;
  readonly referenceTime: Date | string;
  readonly targetRange?: GlucoseTargetRange | null;
  readonly freshnessPolicy?: GlucoseFreshnessPolicy | null;
  readonly localization: LocalizationPlatform;
  readonly glucoseContextLabel?: string;
  readonly glucoseKindLabel: string;
}

export interface TimelineGlucosePresentationResult {
  readonly context: string | undefined;
  readonly formattedMeasurement: string;
  readonly formattedValue: string;
  readonly kindLabel: string;
  readonly model: GlucosePresentationModel;
  readonly rangeLabel: string | null;
  readonly search: {
    readonly localizedLabels: readonly string[];
    readonly userContent: readonly string[];
  };
  readonly unit: string;
  readonly value: string;
}

function resolveGlucoseContextLabel(
  context: GlucoseMeasurementContext | undefined,
  glucoseContextLabel: string | undefined,
): string | undefined {
  return glucoseContextLabel;
}

export function presentGlucoseFromTimelineEvent(
  input: PresentGlucoseFromTimelineEventInput,
): TimelineGlucosePresentationResult {
  const displayUnit = resolveGlucosePresentationUnit(input.glucoseDisplayUnit);
  const localized = adaptGlucosePresentationForDisplay(input.formatter, {
    displayUnit,
    freshnessPolicy: input.freshnessPolicy ?? null,
    reading: {
      concentrationMmolPerL: input.event.concentrationMmolPerL,
      measuredAt: input.event.occurredAt,
      provenance: input.event.provenance,
      source: input.event.source,
    },
    referenceTime: input.referenceTime,
    targetRange: input.targetRange ?? null,
  });
  const rangeLabel = resolveGlucoseRangeStateLabel(
    input.localization,
    localized.model.rangeState,
    localized.model.dataQualityState,
  );
  const context = resolveGlucoseContextLabel(
    input.event.context,
    input.glucoseContextLabel,
  );
  const unit =
    displayUnit === 'mg_per_dl'
      ? input.localization.translate({
          key: 'timeline.units.glucoseMgPerDl' as TranslationKey,
        }).value
      : input.localization.translate({
          key: 'timeline.units.glucoseMmolPerL' as TranslationKey,
        }).value;

  return {
    context,
    formattedMeasurement: localized.formattedMeasurement,
    formattedValue: localized.formattedValue,
    kindLabel: input.glucoseKindLabel,
    model: localized.model,
    rangeLabel,
    search: {
      localizedLabels: [
        input.glucoseKindLabel,
        unit,
        ...(rangeLabel ? [rangeLabel] : []),
        ...(context ? [context] : []),
      ],
      userContent: [
        localized.formattedValue,
        String(input.event.concentrationMmolPerL),
      ],
    },
    unit,
    value: localized.formattedValue,
  };
}
