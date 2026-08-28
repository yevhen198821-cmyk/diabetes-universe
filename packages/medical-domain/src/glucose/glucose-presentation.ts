import type { EventProvenance } from '@diabetes-universe/types';
import type { TimelineEventSource } from '@diabetes-universe/types';

import type { GlucoseDisplayUnit } from '../types/diabetes-settings-enums';
import type { GlucoseTargetRange } from '../types/glucose-target-range';
import { mapGlucoseDisplayUnitToDisplaySymbol } from '../validation/diabetes-settings-validation';
import { resolveGlucoseDataQualityState } from './glucose-data-quality';
import { toGlucoseDisplayNumericValue } from './glucose-display-value';
import type { GlucoseFreshnessPolicy } from './glucose-freshness-policy';
import { resolveGlucoseFreshnessState } from './glucose-freshness-policy';
import { resolveGlucoseRangeState } from './glucose-range-state';
import type {
  GlucoseDataQualityState,
  GlucoseFreshnessState,
  GlucoseRangeState,
} from './glucose-semantics';
import { resolveGlucoseSourceDescriptor } from './glucose-source-semantics';

export interface GlucoseReadingInput {
  readonly concentrationMmolPerL: number;
  readonly measuredAt: string;
  readonly source: TimelineEventSource;
  readonly provenance?: EventProvenance;
}

export interface GlucosePresentationModel {
  readonly canonicalMmolPerL: number;
  readonly displayValue: number;
  readonly displayUnit: GlucoseDisplayUnit;
  readonly displayUnitSymbol: ReturnType<
    typeof mapGlucoseDisplayUnitToDisplaySymbol
  >;
  readonly rangeState: GlucoseRangeState;
  readonly freshnessState: GlucoseFreshnessState;
  readonly dataQualityState: GlucoseDataQualityState;
  readonly measuredAt: string;
  readonly sourceIdentity: TimelineEventSource;
  readonly provenanceIdentity: string | null;
}

export interface BuildGlucosePresentationInput {
  readonly reading: GlucoseReadingInput;
  readonly displayUnit: GlucoseDisplayUnit;
  readonly targetRange?: GlucoseTargetRange | null;
  readonly freshnessPolicy?: GlucoseFreshnessPolicy | null;
  readonly referenceTime?: Date | string;
}

export function buildGlucosePresentation(
  input: BuildGlucosePresentationInput,
): GlucosePresentationModel {
  const referenceTime = input.referenceTime ?? new Date();
  const dataQualityState = resolveGlucoseDataQualityState({
    concentrationMmolPerL: input.reading.concentrationMmolPerL,
    measuredAt: input.reading.measuredAt,
    referenceTime,
  });

  const rangeState =
    dataQualityState === 'valid'
      ? resolveGlucoseRangeState(
          input.reading.concentrationMmolPerL,
          input.targetRange,
        )
      : 'unknown';

  const freshnessState = resolveGlucoseFreshnessState({
    measuredAt: input.reading.measuredAt,
    policy: input.freshnessPolicy,
    referenceTime,
  });

  const source = resolveGlucoseSourceDescriptor(
    input.reading.source,
    input.reading.provenance,
  );

  return {
    canonicalMmolPerL: input.reading.concentrationMmolPerL,
    dataQualityState,
    displayUnit: input.displayUnit,
    displayUnitSymbol: mapGlucoseDisplayUnitToDisplaySymbol(input.displayUnit),
    displayValue: toGlucoseDisplayNumericValue(
      input.reading.concentrationMmolPerL,
      input.displayUnit,
    ),
    freshnessState,
    measuredAt: input.reading.measuredAt,
    provenanceIdentity: source.provenanceIdentity,
    rangeState,
    sourceIdentity: source.sourceIdentity,
  };
}
