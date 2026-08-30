import type {
  InsulinQuickAddEntry,
  InsulinTimelineEvent,
} from '@diabetes-universe/types';

import { createIsoDateTimeFromLocalTime } from '../timeline-date-time';
import { createSemanticTimelineEventId } from './create-semantic-timeline-event-id';
import {
  systemSemanticTimelineClock,
  type SemanticTimelineClock,
} from './semantic-timeline-clock';

/**
 * Builds one semantic insulin event from a Wave 4C Quick Add entry.
 *
 * Catalogue identity and its display snapshot are written together, the
 * administration context is always a semantic ID, and the legacy free-text
 * `context` key is never emitted. The dose is stored exactly as entered.
 */
export function createSemanticInsulinTimelineEvent(
  entry: InsulinQuickAddEntry,
  options: {
    readonly clock?: SemanticTimelineClock;
    readonly referenceDate?: Date;
  } = {},
): InsulinTimelineEvent {
  const clock = options.clock ?? systemSemanticTimelineClock;
  const now = clock.now().toISOString();
  const occurredAt = createIsoDateTimeFromLocalTime(
    entry.time,
    options.referenceDate ?? clock.now(),
  );

  return {
    administrationContext: entry.administrationContext,
    createdAt: now,
    doseUnits: entry.doseUnits,
    id: createSemanticTimelineEventId('insulin', entry.time),
    kind: 'insulin',
    occurredAt,
    preparation: entry.preparation.trim(),
    preparationId: entry.preparationId,
    schemaVersion: 1,
    source: 'manual',
    updatedAt: now,
  };
}
