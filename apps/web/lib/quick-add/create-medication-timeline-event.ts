import type {
  MedicationQuickAddEntry,
  TimelineEvent,
} from '@diabetes-universe/types';

import { createIsoDateTimeFromLocalTime } from '../timeline/timeline-date-time';
import { formatMedicationDose } from './format-medication';

export function createMedicationTimelineEvent(
  entry: MedicationQuickAddEntry,
): TimelineEvent {
  const note = entry.note?.trim();
  const dateTime = createIsoDateTimeFromLocalTime(entry.time);

  return {
    context: entry.context ?? '',
    dateTime,
    id: `medication-${entry.time.replace(':', '')}-${crypto.randomUUID()}`,
    kind: 'medication',
    note: note || undefined,
    source: 'manual',
    title: entry.medication.name,
    unit: entry.unit,
    value: formatMedicationDose(entry.dose),
  };
}
