import type { PlatformFormatter } from '@diabetes-universe/formatting';
import {
  isInsulinAdministrationContext,
  isInsulinPreparationId,
  mapLegacyInsulinAdministrationContext,
  resolveInsulinPresentationGrouping,
  type InsulinPresentationGrouping,
} from '@diabetes-universe/medical-domain';
import type {
  InsulinAdministrationContext,
  InsulinPreparationId,
  SemanticTimelineEvent,
} from '@diabetes-universe/types';

import { INSULIN_PRESENTATION_DOSE_FORMAT_OPTIONS } from './insulin-presentation-dose-format';
import type { InsulinPresentationLabels } from './insulin-presentation-labels';

/**
 * Which reader precedence branch produced the displayed context text.
 *
 * `legacy_raw` means the stored string is shown verbatim because it is not in
 * the governed legacy mapping table.
 */
export type InsulinContextPresentationSource =
  'legacy_mapped' | 'legacy_raw' | 'semantic' | 'unspecified';

export interface PresentInsulinFromTimelineEventInput {
  readonly event: Extract<SemanticTimelineEvent, { kind: 'insulin' }>;
  readonly formatter: PlatformFormatter;
  readonly insulinKindLabel: string;
  readonly labels: InsulinPresentationLabels;
  readonly unitLabel: string;
}

export interface TimelineInsulinPresentationResult {
  /** Semantic context resolved for presentation, or `null` for raw legacy text. */
  readonly administrationContext: InsulinAdministrationContext | null;
  readonly context: string;
  readonly contextSource: InsulinContextPresentationSource;
  readonly grouping: InsulinPresentationGrouping;
  readonly groupingLabel: string;
  /** `true` when the event carries no catalogue identity. Not a catalogue ID. */
  readonly isUnmatchedPreparation: boolean;
  readonly kindLabel: string;
  readonly preparationId: InsulinPreparationId | null;
  readonly search: {
    readonly localizedLabels: readonly string[];
    readonly userContent: readonly string[];
  };
  readonly title: string;
  readonly unit: string;
  readonly value: string;
}

interface ResolvedInsulinContextPresentation {
  readonly administrationContext: InsulinAdministrationContext | null;
  readonly display: string;
  readonly source: InsulinContextPresentationSource;
}

/**
 * Reader precedence for insulin administration context.
 *
 * 1. valid `administrationContext` wins over any legacy `context`;
 * 2. else the exact governed legacy mapping resolves a semantic label;
 * 3. else a non-empty unmatched legacy string is shown verbatim;
 * 4. else the localized `unspecified` label.
 */
export function resolveInsulinContextPresentation(
  event: Pick<
    Extract<SemanticTimelineEvent, { kind: 'insulin' }>,
    'administrationContext' | 'context'
  >,
  labels: InsulinPresentationLabels,
): ResolvedInsulinContextPresentation {
  if (isInsulinAdministrationContext(event.administrationContext)) {
    return {
      administrationContext: event.administrationContext,
      display: labels.contexts[event.administrationContext],
      source: 'semantic',
    };
  }

  const legacyMapping = mapLegacyInsulinAdministrationContext(event.context);

  if (legacyMapping.matched) {
    return {
      administrationContext: legacyMapping.administrationContext,
      display: labels.contexts[legacyMapping.administrationContext],
      source: 'legacy_mapped',
    };
  }

  if (typeof event.context === 'string' && event.context.trim().length > 0) {
    return {
      administrationContext: null,
      display: event.context,
      source: 'legacy_raw',
    };
  }

  return {
    administrationContext: null,
    display: labels.contexts.unspecified,
    source: 'unspecified',
  };
}

/**
 * Presentation-neutral insulin reader shared by Timeline card, detail, search,
 * and Dashboard Recent Events.
 *
 * The title is always the stored `preparation` snapshot. Identity is never
 * derived from display text, and grouping chrome is never persisted.
 */
export function presentInsulinFromTimelineEvent(
  input: PresentInsulinFromTimelineEventInput,
): TimelineInsulinPresentationResult {
  const { event, labels } = input;
  const value = input.formatter.formatNumber(
    event.doseUnits,
    INSULIN_PRESENTATION_DOSE_FORMAT_OPTIONS,
  );
  const contextPresentation = resolveInsulinContextPresentation(event, labels);
  const preparationId = isInsulinPreparationId(event.preparationId)
    ? event.preparationId
    : null;
  const grouping = resolveInsulinPresentationGrouping(event.preparationId);
  const groupingLabel = labels.groupings[grouping];
  const additiveLocalizedContext =
    contextPresentation.source === 'legacy_raw'
      ? []
      : [contextPresentation.display];

  return {
    administrationContext: contextPresentation.administrationContext,
    context: contextPresentation.display,
    contextSource: contextPresentation.source,
    grouping,
    groupingLabel,
    isUnmatchedPreparation: preparationId === null,
    kindLabel: input.insulinKindLabel,
    preparationId,
    search: {
      localizedLabels: [
        input.insulinKindLabel,
        input.unitLabel,
        ...additiveLocalizedContext,
        groupingLabel,
      ],
      userContent: [
        event.preparation,
        String(event.doseUnits),
        event.context ?? '',
      ],
    },
    title: event.preparation,
    unit: input.unitLabel,
    value,
  };
}
