'use client';

import type {
  MedicationQuickAddEntry,
  MedicationReference,
} from '@diabetes-universe/types';
import {
  QuickAddFormPreview,
  QuickAddFormActions,
  QuickAddFormLayout,
  QuickAddNumberWithUnitField,
  QuickAddOptionSheet,
  QuickAddSelectField,
  QuickAddTextAreaField,
  QuickAddTimeField,
} from '@diabetes-universe/ui';
import { useState, type FormEvent } from 'react';

import { medicationContextOptions } from '../../lib/quick-add/medication-context-options';
import {
  findMedicationDemoOptionByName,
  medicationDemoSheetOptions,
} from '../../lib/quick-add/medication-demo-options';
import { medicationUnitOptions } from '../../lib/quick-add/medication-unit-options';
import { getCurrentTimeString } from '../../lib/quick-add/format-glucose';
import {
  formatMedicationDose,
  parseMedicationDoseInput,
} from '../../lib/quick-add/format-medication';

const NOTE_COUNTER_THRESHOLD = 160;
const NOTE_MAX_LENGTH = 200;

interface MedicationQuickAddFormProps {
  readonly onCancel: () => void;
  readonly onSubmit: (entry: MedicationQuickAddEntry) => void;
}

interface MedicationFormState {
  readonly medication: MedicationReference | null;
  readonly dose: string;
  readonly unit: string;
  readonly time: string;
  readonly context: string;
  readonly note: string;
}

function createInitialState(): MedicationFormState {
  return {
    context: '',
    dose: '',
    medication: null,
    note: '',
    time: getCurrentTimeString(),
    unit: '',
  };
}

export function MedicationQuickAddForm({
  onCancel,
  onSubmit,
}: MedicationQuickAddFormProps) {
  const [formState, setFormState] =
    useState<MedicationFormState>(createInitialState);
  const [doseError, setDoseError] = useState<string | null>(null);
  const [medicationSheetOpen, setMedicationSheetOpen] = useState(false);
  const [unitSheetOpen, setUnitSheetOpen] = useState(false);
  const [contextSheetOpen, setContextSheetOpen] = useState(false);
  const parsedDose = parseMedicationDoseInput(formState.dose);
  const hasDose = formState.dose.trim().length > 0;
  const doseValidationError =
    doseError ??
    (hasDose && parsedDose === null
      ? 'Введите дозу больше 0 и не более 100000'
      : null);
  const canSubmit =
    formState.medication !== null &&
    parsedDose !== null &&
    formState.unit.length > 0 &&
    formState.time.length > 0;
  const selectedMedicationOption = formState.medication
    ? findMedicationDemoOptionByName(formState.medication.name)
    : undefined;
  const previewPrimary =
    canSubmit && formState.medication && parsedDose !== null
      ? `${formState.medication.name} · ${formatMedicationDose(parsedDose)} ${
          formState.unit
        }`
      : '';
  const previewSecondary = formState.context
    ? `${formState.time} · ${formState.context}`
    : formState.time;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (parsedDose === null) {
      setDoseError('Введите дозу больше 0 и не более 100000');
      return;
    }

    if (!formState.medication || !formState.unit || !formState.time) {
      return;
    }

    const note = formState.note.trim();

    onSubmit({
      context: formState.context || undefined,
      dose: parsedDose,
      medication: formState.medication,
      note: note || undefined,
      time: formState.time,
      unit: formState.unit,
    });
  };

  const handleCancel = () => {
    setFormState(createInitialState());
    setDoseError(null);
    onCancel();
  };

  return (
    <QuickAddFormLayout onSubmit={handleSubmit}>
      <QuickAddFormLayout.Body>
        <QuickAddSelectField
          description={selectedMedicationOption?.form}
          id="quick-add-medication-name"
          label="Препарат"
          onClick={() => setMedicationSheetOpen(true)}
          placeholder="Выберите лекарство"
          value={formState.medication?.name}
        />

        <QuickAddNumberWithUnitField
          error={doseValidationError}
          id="quick-add-medication-dose"
          label="Доза"
          name="dose"
          onUnitClick={() => setUnitSheetOpen(true)}
          onValueChange={(dose) => {
            setDoseError(null);
            setFormState((current) => ({
              ...current,
              dose,
            }));
          }}
          placeholder="0"
          required
          unitPlaceholder="Единица"
          unitValue={formState.unit || undefined}
          value={formState.dose}
        />

        <QuickAddTimeField
          id="quick-add-medication-time"
          label="Время"
          name="time"
          onChange={(time) => {
            setFormState((current) => ({
              ...current,
              time,
            }));
          }}
          required
          value={formState.time}
        />

        <QuickAddSelectField
          id="quick-add-medication-context"
          label="Контекст"
          onClick={() => setContextSheetOpen(true)}
          placeholder="Выберите контекст"
          value={formState.context || undefined}
        />

        <QuickAddTextAreaField
          counterThreshold={NOTE_COUNTER_THRESHOLD}
          id="quick-add-medication-note"
          label="Заметка"
          maxLength={NOTE_MAX_LENGTH}
          name="note"
          onChange={(note) => {
            setFormState((current) => ({
              ...current,
              note,
            }));
          }}
          placeholder="Например, после завтрака"
          value={formState.note}
        />

        {canSubmit ? (
          <QuickAddFormPreview
            primaryText={previewPrimary}
            secondaryText={previewSecondary}
            title="Запись"
          />
        ) : null}
      </QuickAddFormLayout.Body>

      <QuickAddFormLayout.Footer>
        <QuickAddFormActions
          inline
          onCancel={handleCancel}
          submitDisabled={!canSubmit}
        />
      </QuickAddFormLayout.Footer>

      {medicationSheetOpen ? (
        <QuickAddOptionSheet
          onClose={() => setMedicationSheetOpen(false)}
          onSelect={(medicationName) => {
            const medicationOption =
              findMedicationDemoOptionByName(medicationName);

            if (medicationOption) {
              setFormState((current) => ({
                ...current,
                medication: medicationOption.medication,
                unit: current.unit || medicationOption.suggestedUnit || '',
              }));
            }

            setMedicationSheetOpen(false);
          }}
          options={medicationDemoSheetOptions}
          selectedValue={formState.medication?.name}
          title="Лекарство"
        />
      ) : null}

      {unitSheetOpen ? (
        <QuickAddOptionSheet
          onClose={() => setUnitSheetOpen(false)}
          onSelect={(unit) => {
            setFormState((current) => ({
              ...current,
              unit,
            }));
            setUnitSheetOpen(false);
          }}
          options={medicationUnitOptions}
          selectedValue={formState.unit || undefined}
          title="Единица измерения"
        />
      ) : null}

      {contextSheetOpen ? (
        <QuickAddOptionSheet
          onClose={() => setContextSheetOpen(false)}
          onSelect={(context) => {
            setFormState((current) => ({
              ...current,
              context,
            }));
            setContextSheetOpen(false);
          }}
          options={medicationContextOptions}
          selectedValue={formState.context || undefined}
          title="Контекст"
        />
      ) : null}
    </QuickAddFormLayout>
  );
}
