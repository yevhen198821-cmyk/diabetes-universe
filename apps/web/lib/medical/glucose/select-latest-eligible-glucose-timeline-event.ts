import { selectLatestEligibleGlucoseReading } from '@diabetes-universe/medical-domain';
import type { SemanticTimelineEvent } from '@diabetes-universe/types';

type GlucoseTimelineEvent = Extract<SemanticTimelineEvent, { kind: 'glucose' }>;

export interface GlucoseTimelineEventSelectionOptions {
  readonly referenceTime: Date | string;
  readonly deletedAtByEventId?: Readonly<Record<string, string | null>>;
}

function toSelectionReading(
  event: GlucoseTimelineEvent,
  deletedAtByEventId: Readonly<Record<string, string | null>> | undefined,
) {
  return {
    concentrationMmolPerL: event.concentrationMmolPerL,
    deletedAt: deletedAtByEventId?.[event.id] ?? null,
    id: event.id,
    measuredAt: event.occurredAt,
    recordedAt: null,
  };
}

/**
 * Selects the latest Dashboard-eligible glucose timeline event.
 *
 * Compatibility mapping: `occurredAt` represents measurement time (`measuredAt`).
 * `recordedAt` is unavailable on the current client model; tie-break falls back
 * to stable `id`.
 */
export function selectLatestEligibleGlucoseTimelineEvent(
  events: readonly SemanticTimelineEvent[],
  options: GlucoseTimelineEventSelectionOptions,
): GlucoseTimelineEvent | null {
  const glucoseEvents = events.filter(
    (event): event is GlucoseTimelineEvent => event.kind === 'glucose',
  );

  const selected = selectLatestEligibleGlucoseReading({
    readings: glucoseEvents.map((event) =>
      toSelectionReading(event, options.deletedAtByEventId),
    ),
    referenceTime: options.referenceTime,
  });

  if (!selected) {
    return null;
  }

  return glucoseEvents.find((event) => event.id === selected.id) ?? null;
}
