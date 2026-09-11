'use client';

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
import { useMemo, useRef, useState, type FormEvent } from 'react';

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
import type { MedicationQuickAddSubmitRequest } from '../../lib/quick-add/medication-quick-add-submit';
import {
  createMedicationQuickAddSubmitIdentityState,
  persistPreparedMedicationQuickAddSubmit,
  prepareMedicationQuickAddSubmitWithIdentity,
  resetMedicationQuickAddSubmitIdentity,
} from '../../lib/quick-add/medication-quick-add-submit-controller';
import type { MedicationQuickAddFormState } from '../../lib/quick-add/medication-quick-add-submit';
import { useFormatter } from '../../lib/platform/react/use-formatter';
import { useLocalization } from '../../lib/platform/react/use-localization';
import { resolveMedicationQuickAddSaveLabels } from './medication-quick-add-labels';

const NOTE_COUNTER_THRESHOLD = 160;
const NOTE_MAX_LENGTH = 200;

interface MedicationQuickAddFormProps {
  readonly onCancel: () => void;
  readonly onSubmit: (
    request: MedicationQuickAddSubmitRequest,
  ) => Promise<void>;
  readonly onSubmittingChange?: (isSubmitting: boolean) => void;
}

function createInitialState(): MedicationQuickAddFormState {
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
  onSubmittingChange,
}: MedicationQuickAddFormProps) {
  const formatter = useFormatter();
  const localization = useLocalization();
  const saveLabels = useMemo(
    () => resolveMedicationQuickAddSaveLabels(localization),
    [localization],
  );
  const [formState, setFormState] =
    useState<MedicationQuickAddFormState>(createInitialState);
  const [doseError, setDoseError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [medicationSheetOpen, setMedicationSheetOpen] = useState(false);
  const [unitSheetOpen, setUnitSheetOpen] = useState(false);
  const [contextSheetOpen, setContextSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitIdentityRef = useRef(
    createMedicationQuickAddSubmitIdentityState(),
  );
  const isSubmittingRef = useRef(false);
  const parsedDose = parseMedicationDoseInput(formState.dose);
  const hasDose = formState.dose.trim().length > 0;
  const doseValidationError =
    doseError ??
    (hasDose && parsedDose === null
      ? 'Введите дозу больше 0 и не более 10000'
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
      ? `${formState.medication.name} · ${formatMedicationDose(parsedDose, formatter)} ${
          formState.unit
        }`
      : '';
  const previewSecondary = formState.context
    ? `${formState.time} · ${formState.context}`
    : formState.time;
  const controlsDisabled = isSubmitting;

  const setSubmittingState = (pending: boolean) => {
    setIsSubmitting(pending);
    onSubmittingChange?.(pending);
  };

  const noteFailedAttemptFieldEdit = () => {
    setSaveError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmittingRef.current) {
      return;
    }

    const prepared = prepareMedicationQuickAddSubmitWithIdentity({
      formState,
      identity: submitIdentityRef.current,
    });

    if (prepared.type === 'invalid') {
      if (prepared.field === 'dose') {
        setDoseError('Введите дозу больше 0 и не более 10000');
      }

      return;
    }

    isSubmittingRef.current = true;
    setSubmittingState(true);
    setSaveError(null);
    setDoseError(null);
    setMedicationSheetOpen(false);
    setUnitSheetOpen(false);
    setContextSheetOpen(false);

    const result = await persistPreparedMedicationQuickAddSubmit({
      identity: submitIdentityRef.current,
      onSubmit,
      request: prepared.request,
    });

    if (result.type === 'error') {
      setSaveError(saveLabels.saveErrorDescription);
    }

    isSubmittingRef.current = false;
    setSubmittingState(false);
  };

  const handleCancel = () => {
    if (isSubmittingRef.current) {
      return;
    }

    setFormState(createInitialState());
    setDoseError(null);
    setSaveError(null);
    resetMedicationQuickAddSubmitIdentity(submitIdentityRef.current);
    onCancel();
  };

  return (
    <QuickAddFormLayout
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
    >
      <QuickAddFormLayout.Body>
        <div aria-busy={isSubmitting ? true : undefined}>
          {isSubmitting ? (
            <p
              className="text-sm text-slate-600"
              id="quick-add-medication-saving"
              role="status"
            >
              {saveLabels.saving}
            </p>
          ) : null}

          {saveError ? (
            <section
              aria-labelledby="quick-add-medication-save-error-title"
              className="space-y-1"
              role="alert"
            >
              <h3
                className="text-sm font-semibold text-rose-700"
                id="quick-add-medication-save-error-title"
              >
                {saveLabels.saveErrorTitle}
              </h3>
              <p
                className="text-sm text-rose-600"
                id="quick-add-medication-save-error-description"
              >
                {saveError}
              </p>
            </section>
          ) : null}

          <QuickAddSelectField
            description={selectedMedicationOption?.form}
            id="quick-add-medication-name"
            label="Препарат"
            onClick={() => {
              if (controlsDisabled) {
                return;
              }

              setMedicationSheetOpen(true);
            }}
            placeholder="Выберите лекарство"
            value={formState.medication?.name}
          />

          <QuickAddNumberWithUnitField
            error={doseValidationError}
            id="quick-add-medication-dose"
            label="Доза"
            name="dose"
            onUnitClick={() => {
              if (controlsDisabled) {
                return;
              }

              setUnitSheetOpen(true);
            }}
            onValueChange={(dose) => {
              if (controlsDisabled) {
                return;
              }

              setDoseError(null);
              noteFailedAttemptFieldEdit();
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
            disabled={controlsDisabled}
            id="quick-add-medication-time"
            label="Время"
            name="time"
            onChange={(time) => {
              noteFailedAttemptFieldEdit();
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
            onClick={() => {
              if (controlsDisabled) {
                return;
              }

              setContextSheetOpen(true);
            }}
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
              if (controlsDisabled) {
                return;
              }

              noteFailedAttemptFieldEdit();
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
        </div>
      </QuickAddFormLayout.Body>

      <QuickAddFormLayout.Footer>
        <QuickAddFormActions
          inline
          isSubmitting={isSubmitting}
          onCancel={handleCancel}
          submitAriaDescribedBy={
            isSubmitting
              ? 'quick-add-medication-saving'
              : saveError
                ? 'quick-add-medication-save-error-description'
                : undefined
          }
          submitDisabled={!canSubmit}
          submittingLabel={saveLabels.saving}
        />
      </QuickAddFormLayout.Footer>

      {medicationSheetOpen && !controlsDisabled ? (
        <QuickAddOptionSheet
          onClose={() => setMedicationSheetOpen(false)}
          onSelect={(medicationName) => {
            const medicationOption =
              findMedicationDemoOptionByName(medicationName);

            if (medicationOption) {
              noteFailedAttemptFieldEdit();
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

      {unitSheetOpen && !controlsDisabled ? (
        <QuickAddOptionSheet
          onClose={() => setUnitSheetOpen(false)}
          onSelect={(unit) => {
            noteFailedAttemptFieldEdit();
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

      {contextSheetOpen && !controlsDisabled ? (
        <QuickAddOptionSheet
          onClose={() => setContextSheetOpen(false)}
          onSelect={(context) => {
            noteFailedAttemptFieldEdit();
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
