import type {
  MedicationQuickAddEntry,
  MedicationTimelineEvent,
} from '@diabetes-universe/types';

import { createIsoDateTimeFromLocalTime } from '../timeline-date-time';
import { createSemanticTimelineEventId } from './create-semantic-timeline-event-id';
import { mapQuickAddMedicationUnit } from './map-quick-add-medication-unit';
import {
  systemSemanticTimelineClock,
  type SemanticTimelineClock,
} from './semantic-timeline-clock';

export function createSemanticMedicationTimelineEvent(
  entry: MedicationQuickAddEntry,
  options: {
    readonly clock?: SemanticTimelineClock;
    readonly referenceDate?: Date;
  } = {},
): MedicationTimelineEvent {
  const doseUnit = mapQuickAddMedicationUnit(entry.unit);

  if (!doseUnit) {
    throw new Error(
      `Unsupported medication unit for semantic creation: "${entry.unit}"`,
    );
  }

  const clock = options.clock ?? systemSemanticTimelineClock;
  const now = clock.now().toISOString();
  const occurredAt = createIsoDateTimeFromLocalTime(
    entry.time,
    options.referenceDate ?? clock.now(),
  );
  const context = entry.context?.trim();
  const note = entry.note?.trim();

  return {
    context: context || undefined,
    createdAt: now,
    dose: entry.dose,
    doseUnit,
    id: createSemanticTimelineEventId('medication', entry.time),
    kind: 'medication',
    medicationId: entry.medication.id,
    medicationName: entry.medication.name.trim(),
    note: note || undefined,
    occurredAt,
    schemaVersion: 1,
    source: 'manual',
    updatedAt: now,
  };
}
