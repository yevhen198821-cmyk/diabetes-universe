'use client';

import type {
  MedicationQuickAddEntry,
  MedicationReference,
} from '@diabetes-universe/types';
import {
  QuickAddFormActions,
  QuickAddFormLayout,
  QuickAddOptionSheet,
} from '@diabetes-universe/ui';
import { ChevronDown } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { medicationContextOptions } from '../../lib/quick-add/medication-context-options';
import {
  findMedicationDemoOptionByName,
  medicationDemoOptionNames,
} from '../../lib/quick-add/medication-demo-options';
import { medicationUnitOptions } from '../../lib/quick-add/medication-unit-options';
import { getCurrentTimeString } from '../../lib/quick-add/format-glucose';
import { parseMedicationDoseInput } from '../../lib/quick-add/format-medication';
import { openNativeTimePicker } from '../../lib/quick-add/open-native-time-picker';
import { formField, formLabel } from '../timeline/ui-styles';

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
  const showNoteCounter = formState.note.length >= NOTE_COUNTER_THRESHOLD;
  const canSubmit =
    formState.medication !== null &&
    parsedDose !== null &&
    formState.unit.length > 0 &&
    formState.time.length > 0;

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
        <div>
          <span className={formLabel} id="quick-add-medication-name-label">
            Препарат
          </span>
          <button
            aria-haspopup="dialog"
            aria-labelledby="quick-add-medication-name-label quick-add-medication-name-value"
            className={`${formField} mt-2 flex items-center justify-between text-left font-medium ${
              formState.medication ? 'text-slate-950' : 'text-slate-400'
            }`}
            onClick={() => setMedicationSheetOpen(true)}
            type="button"
          >
            <span id="quick-add-medication-name-value">
              {formState.medication?.name || 'Выберите лекарство'}
            </span>
            <ChevronDown
              aria-hidden="true"
              className="text-slate-400"
              size={18}
            />
          </button>
        </div>

        <div>
          <label className={formLabel} htmlFor="quick-add-medication-dose">
            Доза
          </label>
          <input
            aria-describedby={
              doseError ? 'quick-add-medication-dose-error' : undefined
            }
            aria-invalid={doseError ? true : undefined}
            autoComplete="off"
            className={`${formField} mt-2 ${
              hasDose ? 'font-semibold text-slate-950' : 'text-slate-900'
            }`}
            enterKeyHint="done"
            id="quick-add-medication-dose"
            inputMode="decimal"
            name="dose"
            onChange={(event) => {
              setDoseError(null);
              setFormState((current) => ({
                ...current,
                dose: event.target.value,
              }));
            }}
            placeholder="500"
            required
            type="text"
            value={formState.dose}
          />
          {doseError ? (
            <p
              className="mt-2 text-sm text-rose-600"
              id="quick-add-medication-dose-error"
            >
              {doseError}
            </p>
          ) : null}
        </div>

        <div>
          <span className={formLabel} id="quick-add-medication-unit-label">
            Единица измерения
          </span>
          <button
            aria-haspopup="dialog"
            aria-labelledby="quick-add-medication-unit-label quick-add-medication-unit-value"
            className={`${formField} mt-2 flex items-center justify-between text-left font-medium ${
              formState.unit ? 'text-slate-950' : 'text-slate-400'
            }`}
            onClick={() => setUnitSheetOpen(true)}
            type="button"
          >
            <span id="quick-add-medication-unit-value">
              {formState.unit || 'Выберите единицу'}
            </span>
            <ChevronDown
              aria-hidden="true"
              className="text-slate-400"
              size={18}
            />
          </button>
        </div>

        <div>
          <label className={formLabel} htmlFor="quick-add-medication-time">
            Время
          </label>
          <input
            className={`${formField} mt-2 appearance-auto text-slate-950`}
            id="quick-add-medication-time"
            name="time"
            onChange={(event) => {
              setFormState((current) => ({
                ...current,
                time: event.target.value,
              }));
            }}
            onClick={(event) => {
              openNativeTimePicker(event.currentTarget);
            }}
            required
            step={60}
            type="time"
            value={formState.time}
          />
        </div>

        <div>
          <span className={formLabel} id="quick-add-medication-context-label">
            Контекст
          </span>
          <button
            aria-haspopup="dialog"
            aria-labelledby="quick-add-medication-context-label quick-add-medication-context-value"
            className={`${formField} mt-2 flex items-center justify-between text-left font-medium ${
              formState.context ? 'text-slate-950' : 'text-slate-400'
            }`}
            onClick={() => setContextSheetOpen(true)}
            type="button"
          >
            <span id="quick-add-medication-context-value">
              {formState.context || 'Выберите контекст'}
            </span>
            <ChevronDown
              aria-hidden="true"
              className="text-slate-400"
              size={18}
            />
          </button>
        </div>

        <div>
          <label className={formLabel} htmlFor="quick-add-medication-note">
            Заметка
          </label>
          <textarea
            className={`${formField} mt-2 min-h-24 resize-none py-3`}
            id="quick-add-medication-note"
            maxLength={NOTE_MAX_LENGTH}
            name="note"
            onChange={(event) => {
              setFormState((current) => ({
                ...current,
                note: event.target.value,
              }));
            }}
            placeholder="Добавьте заметку"
            value={formState.note}
          />
          {showNoteCounter ? (
            <p className="mt-1 text-right text-xs text-slate-500">
              {formState.note.length}/{NOTE_MAX_LENGTH}
            </p>
          ) : null}
        </div>
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
            const medication = findMedicationDemoOptionByName(medicationName);

            if (medication) {
              setFormState((current) => ({
                ...current,
                medication,
              }));
            }

            setMedicationSheetOpen(false);
          }}
          options={medicationDemoOptionNames}
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
