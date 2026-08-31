'use client';

import { INSULIN_PREPARATION_OTHER_ID } from '@diabetes-universe/medical-domain';
import type {
  InsulinAdministrationContext,
  InsulinPreparationId,
  InsulinQuickAddEntry,
} from '@diabetes-universe/types';
import {
  QuickAddFormActions,
  QuickAddFormLayout,
  QuickAddOptionSheet,
  QuickAddTimeField,
} from '@diabetes-universe/ui';
import { ChevronDown } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';

import {
  resolveInsulinAdministrationContextOptions,
  resolveInsulinPreparationOptionGroups,
  resolveInsulinPresentationLabels,
} from '../../lib/medical/insulin';
import { useLocalization } from '../../lib/platform/react/use-localization';
import { getCurrentTimeString } from '../../lib/quick-add/format-glucose';
import {
  prepareInsulinQuickAddSubmit,
  type InsulinQuickAddFormState,
} from '../../lib/quick-add/insulin-quick-add-submit';
import { formField, formLabel } from '../timeline/ui-styles';
import { resolveInsulinQuickAddLabels } from './insulin-quick-add-labels';

interface InsulinQuickAddFormProps {
  readonly onCancel: () => void;
  readonly onSubmit: (entry: InsulinQuickAddEntry) => void;
}

function createInitialState(): InsulinQuickAddFormState {
  return {
    administrationContext: null,
    dose: '',
    otherName: '',
    preparationId: null,
    time: getCurrentTimeString(),
  };
}

export function InsulinQuickAddForm({
  onCancel,
  onSubmit,
}: InsulinQuickAddFormProps) {
  const localization = useLocalization();
  const labels = useMemo(
    () => resolveInsulinQuickAddLabels(localization),
    [localization],
  );
  const presentationLabels = useMemo(
    () => resolveInsulinPresentationLabels(localization),
    [localization],
  );
  const preparationGroups = useMemo(
    () => resolveInsulinPreparationOptionGroups(presentationLabels),
    [presentationLabels],
  );
  const contextOptions = useMemo(
    () => resolveInsulinAdministrationContextOptions(presentationLabels),
    [presentationLabels],
  );

  const [formState, setFormState] =
    useState<InsulinQuickAddFormState>(createInitialState);
  const [doseError, setDoseError] = useState<string | null>(null);
  const [otherNameError, setOtherNameError] = useState<string | null>(null);
  const [preparationSheetOpen, setPreparationSheetOpen] = useState(false);
  const [contextSheetOpen, setContextSheetOpen] = useState(false);

  const showOtherName =
    formState.preparationId === INSULIN_PREPARATION_OTHER_ID;
  const hasDose = formState.dose.trim().length > 0;
  const selectedPreparationLabel =
    formState.preparationId === null
      ? null
      : presentationLabels.preparations[formState.preparationId];
  const selectedContextLabel =
    formState.administrationContext === null
      ? null
      : presentationLabels.contexts[formState.administrationContext];
  const canSubmit =
    formState.preparationId !== null && hasDose && formState.time.length > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const prepared = prepareInsulinQuickAddSubmit({
      formState,
      labels: presentationLabels,
    });

    if (prepared.type === 'invalid') {
      if (prepared.field === 'dose') {
        setDoseError(labels.doseError);
        return;
      }

      if (prepared.field === 'otherName') {
        setOtherNameError(labels.otherNameRequiredError);
        return;
      }

      return;
    }

    setDoseError(null);
    setOtherNameError(null);
    onSubmit(prepared.entry);
  };

  const handleCancel = () => {
    setFormState(createInitialState());
    setDoseError(null);
    setOtherNameError(null);
    onCancel();
  };

  const handlePreparationSelect = (preparationId: InsulinPreparationId) => {
    setOtherNameError(null);
    setFormState((current) => ({
      ...current,
      otherName:
        preparationId === INSULIN_PREPARATION_OTHER_ID ? current.otherName : '',
      preparationId,
    }));
    setPreparationSheetOpen(false);
  };

  const handleContextSelect = (context: InsulinAdministrationContext) => {
    setFormState((current) => ({
      ...current,
      administrationContext: context,
    }));
    setContextSheetOpen(false);
  };

  return (
    <QuickAddFormLayout onSubmit={handleSubmit}>
      <QuickAddFormLayout.Body>
        <div>
          <span className={formLabel} id="quick-add-insulin-preparation-label">
            {labels.preparationLabel}
          </span>
          <button
            aria-haspopup="dialog"
            aria-labelledby="quick-add-insulin-preparation-label quick-add-insulin-preparation-value"
            className={`${formField} mt-2 flex items-center justify-between text-left font-medium ${
              selectedPreparationLabel ? 'text-slate-950' : 'text-slate-400'
            }`}
            onClick={() => setPreparationSheetOpen(true)}
            type="button"
          >
            <span id="quick-add-insulin-preparation-value">
              {selectedPreparationLabel ?? labels.preparationPlaceholder}
            </span>
            <ChevronDown
              aria-hidden="true"
              className="text-slate-400"
              size={18}
            />
          </button>
        </div>

        {showOtherName ? (
          <div>
            <label className={formLabel} htmlFor="quick-add-insulin-other-name">
              {labels.otherNameLabel}
            </label>
            <input
              aria-describedby={
                otherNameError
                  ? 'quick-add-insulin-other-name-error'
                  : undefined
              }
              aria-invalid={otherNameError ? true : undefined}
              autoComplete="off"
              className={`${formField} mt-2`}
              id="quick-add-insulin-other-name"
              maxLength={120}
              name="otherName"
              onChange={(event) => {
                setOtherNameError(null);
                setFormState((current) => ({
                  ...current,
                  otherName: event.target.value,
                }));
              }}
              placeholder={labels.otherNamePlaceholder}
              type="text"
              value={formState.otherName}
            />
            {otherNameError ? (
              <p
                className="mt-2 text-sm text-rose-600"
                id="quick-add-insulin-other-name-error"
                role="alert"
              >
                {otherNameError}
              </p>
            ) : null}
          </div>
        ) : null}

        <div>
          <label className={formLabel} htmlFor="quick-add-insulin-dose">
            {labels.doseLabel}
          </label>
          <div className="relative mt-2">
            <input
              aria-describedby={
                doseError ? 'quick-add-insulin-dose-error' : undefined
              }
              aria-invalid={doseError ? true : undefined}
              autoComplete="off"
              className={`${formField} pr-14 ${
                hasDose ? 'font-semibold text-slate-950' : 'text-slate-900'
              }`}
              enterKeyHint="done"
              id="quick-add-insulin-dose"
              inputMode="decimal"
              name="dose"
              onChange={(event) => {
                setDoseError(null);
                setFormState((current) => ({
                  ...current,
                  dose: event.target.value,
                }));
              }}
              placeholder={labels.dosePlaceholder}
              required
              type="text"
              value={formState.dose}
            />
            <span
              className={`pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm font-medium ${
                hasDose ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              {labels.doseUnit}
            </span>
          </div>
          {doseError ? (
            <p
              className="mt-2 text-sm text-rose-600"
              id="quick-add-insulin-dose-error"
              role="alert"
            >
              {doseError}
            </p>
          ) : null}
        </div>

        <QuickAddTimeField
          id="quick-add-insulin-time"
          label={labels.timeLabel}
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

        <div>
          <span className={formLabel} id="quick-add-insulin-context-label">
            {labels.contextLabel}
          </span>
          <button
            aria-haspopup="dialog"
            aria-labelledby="quick-add-insulin-context-label quick-add-insulin-context-value"
            className={`${formField} mt-2 flex items-center justify-between text-left font-medium ${
              selectedContextLabel ? 'text-slate-950' : 'text-slate-400'
            }`}
            onClick={() => setContextSheetOpen(true)}
            type="button"
          >
            <span id="quick-add-insulin-context-value">
              {selectedContextLabel ?? labels.contextPlaceholder}
            </span>
            <ChevronDown
              aria-hidden="true"
              className="text-slate-400"
              size={18}
            />
          </button>
        </div>
      </QuickAddFormLayout.Body>

      <QuickAddFormLayout.Footer>
        <QuickAddFormActions
          cancelLabel={labels.cancel}
          inline
          onCancel={handleCancel}
          submitDisabled={!canSubmit}
          submitLabel={labels.save}
        />
      </QuickAddFormLayout.Footer>

      {preparationSheetOpen ? (
        <QuickAddOptionSheet<InsulinPreparationId>
          groups={preparationGroups.map((group) => ({
            label: group.label,
            options: group.options.map((option) => ({
              label: option.label,
              value: option.id,
            })),
          }))}
          onClose={() => setPreparationSheetOpen(false)}
          onSelect={handlePreparationSelect}
          selectedValue={formState.preparationId ?? undefined}
          title={labels.preparationSheetTitle}
        />
      ) : null}

      {contextSheetOpen ? (
        <QuickAddOptionSheet<InsulinAdministrationContext>
          onClose={() => setContextSheetOpen(false)}
          onSelect={handleContextSelect}
          options={contextOptions.map((option) => ({
            label: option.label,
            value: option.id,
          }))}
          selectedValue={formState.administrationContext ?? undefined}
          title={labels.contextSheetTitle}
        />
      ) : null}
    </QuickAddFormLayout>
  );
}
