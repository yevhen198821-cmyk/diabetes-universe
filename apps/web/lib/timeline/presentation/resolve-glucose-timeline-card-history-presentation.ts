import type { TimelinePresentationDependencies } from './timeline-presentation-dependencies';

export interface GlucoseTimelineCardHistoryPresentation {
  readonly rangeBasisLabel: string | null;
  readonly rangeLabel: string | null;
  readonly statusLines: readonly string[];
  readonly timestampUncertaintyLabel: string | null;
}

export function resolveGlucoseTimelineCardHistoryPresentation(input: {
  readonly dependencies: TimelinePresentationDependencies;
  readonly rangeLabel: string | null;
  readonly timestampUncertaintyLabel: string | null;
}): GlucoseTimelineCardHistoryPresentation {
  const { dependencies, rangeLabel, timestampUncertaintyLabel } = input;

  if (timestampUncertaintyLabel) {
    return {
      rangeBasisLabel: null,
      rangeLabel: null,
      statusLines: [timestampUncertaintyLabel],
      timestampUncertaintyLabel,
    };
  }

  if (rangeLabel) {
    return {
      rangeBasisLabel: dependencies.labels.glucoseRangeCurrentBasis,
      rangeLabel,
      statusLines: [rangeLabel, dependencies.labels.glucoseRangeCurrentBasis],
      timestampUncertaintyLabel: null,
    };
  }

  return {
    rangeBasisLabel: null,
    rangeLabel: null,
    statusLines: [],
    timestampUncertaintyLabel: null,
  };
}
