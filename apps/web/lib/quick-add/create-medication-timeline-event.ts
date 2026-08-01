import type {
  MedicationQuickAddEntry,
  TimelineEvent,
} from '@diabetes-universe/types';

import { formatMedicationDose } from './format-medication';

export function createMedicationTimelineEvent(
  entry: MedicationQuickAddEntry,
): TimelineEvent {
  const note = entry.note?.trim();

  return {
    context: entry.context ?? '',
    id: `medication-${entry.time.replace(':', '')}-${crypto.randomUUID()}`,
    kind: 'medication',
    note: note || undefined,
    time: entry.time,
    title: entry.medication.name,
    unit: entry.unit,
    value: formatMedicationDose(entry.dose),
  };
}
