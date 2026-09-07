import type { MedicationQuickAddEntry } from '@diabetes-universe/types';

import { parseMedicationDoseInput } from './format-medication';

export interface MedicationQuickAddSubmitRequest {
  readonly entry: MedicationQuickAddEntry;
  readonly eventId: string;
}

export interface MedicationQuickAddFormState {
  readonly context: string;
  readonly dose: string;
  readonly medication: MedicationQuickAddEntry['medication'] | null;
  readonly note: string;
  readonly time: string;
  readonly unit: string;
}

export type MedicationQuickAddSubmitInvalidField =
  'dose' | 'medication' | 'time' | 'unit';

export type MedicationQuickAddSubmitResult =
  | {
      readonly type: 'prepared';
      readonly entry: MedicationQuickAddEntry;
    }
  | {
      readonly type: 'invalid';
      readonly field: MedicationQuickAddSubmitInvalidField;
    };

export function prepareMedicationQuickAddSubmit(
  formState: MedicationQuickAddFormState,
): MedicationQuickAddSubmitResult {
  if (formState.medication === null) {
    return { field: 'medication', type: 'invalid' };
  }

  if (formState.unit.trim().length === 0) {
    return { field: 'unit', type: 'invalid' };
  }

  if (formState.time.trim().length === 0) {
    return { field: 'time', type: 'invalid' };
  }

  const dose = parseMedicationDoseInput(formState.dose);

  if (dose === null) {
    return { field: 'dose', type: 'invalid' };
  }

  const note = formState.note.trim();
  const context = formState.context.trim();

  return {
    entry: {
      context: context || undefined,
      dose,
      medication: formState.medication,
      note: note || undefined,
      time: formState.time,
      unit: formState.unit,
    },
    type: 'prepared',
  };
}

export function serializeMedicationQuickAddRetryPayload(
  entry: MedicationQuickAddEntry,
): string {
  return JSON.stringify({
    context: entry.context ?? '',
    dose: entry.dose,
    medicationId: entry.medication.id,
    medicationName: entry.medication.name,
    note: entry.note ?? '',
    time: entry.time,
    unit: entry.unit,
  });
}
