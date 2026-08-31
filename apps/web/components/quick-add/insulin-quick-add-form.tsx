'use client';

import { INSULIN_PREPARATION_OTHER_ID } from '@diabetes-universe/medical-domain';
import type {
  InsulinAdministrationContext,
  InsulinPreparationId,
} from '@diabetes-universe/types';
import {
  QuickAddFormActions,
  QuickAddFormLayout,
  QuickAddOptionSheet,
  QuickAddTimeField,
} from '@diabetes-universe/ui';
import { ChevronDown } from 'lucide-react';
import { useMemo, useRef, useState, type FormEvent } from 'react';

import {
  resolveInsulinAdministrationContextOptions,
  resolveInsulinPreparationOptionGroups,
  resolveInsulinPresentationLabels,
} from '../../lib/medical/insulin';
import { useLocalization } from '../../lib/platform/react/use-localization';
import { getCurrentTimeString } from '../../lib/quick-add/format-glucose';
import type { InsulinQuickAddSubmitRequest } from '../../lib/quick-add/insulin-quick-add-submit';
import {
  createInsulinQuickAddSubmitIdentityState,
  persistPreparedInsulinQuickAddSubmit,
  prepareInsulinQuickAddSubmitWithIdentity,
  resetInsulinQuickAddSubmitIdentity,
} from '../../lib/quick-add/insulin-quick-add-submit-controller';
import type { InsulinQuickAddFormState } from '../../lib/quick-add/insulin-quick-add-submit';
import { formField, formLabel } from '../timeline/ui-styles';
import { resolveInsulinQuickAddLabels } from './insulin-quick-add-labels';

interface InsulinQuickAddFormProps {
  readonly onCancel: () => void;
  readonly onSubmit: (request: InsulinQuickAddSubmitRequest) => Promise<void>;
  readonly onSubmittingChange?: (isSubmitting: boolean) => void;
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
  onSubmittingChange,
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
  const [saveError, setSaveError] = useState<string | null>(null);
  const [preparationSheetOpen, setPreparationSheetOpen] = useState(false);
  const [contextSheetOpen, setContextSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitIdentityRef = useRef(createInsulinQuickAddSubmitIdentityState());
  const isSubmittingRef = useRef(false);

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
  const controlsDisabled = isSubmitting;
  const canSubmit =
    formState.preparationId !== null && hasDose && formState.time.length > 0;

  const setSubmittingState = (pending: boolean) => {
    setIsSubmitting(pending);
    onSubmittingChange?.(pending);
  };

  const resetSubmitIdentity = () => {
    resetInsulinQuickAddSubmitIdentity(submitIdentityRef.current);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmittingRef.current) {
      return;
    }

    const prepared = prepareInsulinQuickAddSubmitWithIdentity({
      formState,
      identity: submitIdentityRef.current,
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

    isSubmittingRef.current = true;
    setSubmittingState(true);
    setSaveError(null);
    setDoseError(null);
    setOtherNameError(null);
    setPreparationSheetOpen(false);
    setContextSheetOpen(false);

    const result = await persistPreparedInsulinQuickAddSubmit({
      identity: submitIdentityRef.current,
      onSubmit,
      request: prepared.request,
    });

    if (result.type === 'error') {
      setSaveError(labels.saveErrorDescription);
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
    setOtherNameError(null);
    setSaveError(null);
    resetSubmitIdentity();
    onCancel();
  };

  const handlePreparationSelect = (preparationId: InsulinPreparationId) => {
    if (controlsDisabled) {
      return;
    }

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
    if (controlsDisabled) {
      return;
    }

    setFormState((current) => ({
      ...current,
      administrationContext: context,
    }));
    setContextSheetOpen(false);
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
              id="quick-add-insulin-saving"
              role="status"
            >
              {labels.saving}
            </p>
          ) : null}

          {saveError ? (
            <section
              aria-labelledby="quick-add-insulin-save-error-title"
              className="space-y-1"
              role="alert"
            >
              <h3
                className="text-sm font-semibold text-rose-700"
                id="quick-add-insulin-save-error-title"
              >
                {labels.saveErrorTitle}
              </h3>
              <p
                className="text-sm text-rose-600"
                id="quick-add-insulin-save-error-description"
              >
                {saveError}
              </p>
            </section>
          ) : null}

          <div>
            <span
              className={formLabel}
              id="quick-add-insulin-preparation-label"
            >
              {labels.preparationLabel}
            </span>
            <button
              aria-haspopup="dialog"
              aria-labelledby="quick-add-insulin-preparation-label quick-add-insulin-preparation-value"
              className={`${formField} mt-2 flex items-center justify-between text-left font-medium ${
                selectedPreparationLabel ? 'text-slate-950' : 'text-slate-400'
              }`}
              disabled={controlsDisabled}
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
              <label
                className={formLabel}
                htmlFor="quick-add-insulin-other-name"
              >
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
                disabled={controlsDisabled}
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
                disabled={controlsDisabled}
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
            disabled={controlsDisabled}
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
              disabled={controlsDisabled}
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
        </div>
      </QuickAddFormLayout.Body>

      <QuickAddFormLayout.Footer>
        <QuickAddFormActions
          cancelLabel={labels.cancel}
          inline
          isSubmitting={isSubmitting}
          onCancel={handleCancel}
          submitAriaDescribedBy={
            isSubmitting
              ? 'quick-add-insulin-saving'
              : saveError
                ? 'quick-add-insulin-save-error-description'
                : undefined
          }
          submitDisabled={!canSubmit}
          submitLabel={labels.save}
          submittingLabel={labels.saving}
        />
      </QuickAddFormLayout.Footer>

      {preparationSheetOpen && !controlsDisabled ? (
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

      {contextSheetOpen && !controlsDisabled ? (
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
