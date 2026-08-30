'use client';

import type {
  GlucoseMeasurementContext,
  GlucoseQuickAddEntry,
} from '@diabetes-universe/types';
import {
  QuickAddFormActions,
  QuickAddFormLayout,
  QuickAddOptionSheet,
  QuickAddTimeField,
} from '@diabetes-universe/ui';
import { ChevronDown } from 'lucide-react';
import { useMemo, useState, type FormEvent, type RefObject } from 'react';

import { useDiabetesSettings } from '../../lib/medical/react';
import {
  getCurrentTimeString,
  parseGlucoseInput,
} from '../../lib/quick-add/format-glucose';
import { useLocalization } from '../../lib/platform/react/use-localization';
import { formField, formLabel } from '../timeline/ui-styles';
import {
  resolveGlucoseContextLabel,
  resolveGlucoseContextOptions,
  resolveGlucoseQuickAddLabels,
} from './glucose-quick-add-labels';

interface GlucoseQuickAddFormProps {
  readonly initialFocusRef?: RefObject<HTMLInputElement | null>;
  readonly onCancel: () => void;
  readonly onSubmit: (entry: GlucoseQuickAddEntry) => void;
}

interface GlucoseFormState {
  readonly value: string;
  readonly time: string;
  readonly context: GlucoseMeasurementContext | undefined;
}

function createInitialState(): GlucoseFormState {
  return {
    context: undefined,
    time: getCurrentTimeString(),
    value: '',
  };
}

export function GlucoseQuickAddForm({
  initialFocusRef,
  onCancel,
  onSubmit,
}: GlucoseQuickAddFormProps) {
  const localization = useLocalization();
  const labels = useMemo(
    () => resolveGlucoseQuickAddLabels(localization),
    [localization],
  );
  const contextOptions = useMemo(
    () => resolveGlucoseContextOptions(localization),
    [localization],
  );
  const { glucoseDisplayUnit, isUnconfigured, loadState, refresh } =
    useDiabetesSettings();

  const [formState, setFormState] =
    useState<GlucoseFormState>(createInitialState);
  const [valueError, setValueError] = useState<string | null>(null);
  const [contextSheetOpen, setContextSheetOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const isLoading = loadState === 'loading';
  const isSettingsError = loadState === 'error';
  const canEnterValue =
    loadState === 'ready' && !isUnconfigured && !isSettingsError;
  const hasValue = formState.value.trim().length > 0;
  const unitSuffix =
    glucoseDisplayUnit === 'mg_per_dl'
      ? labels.unitMg
      : glucoseDisplayUnit === 'mmol_per_l'
        ? labels.unitMmol
        : '';
  const inputMode = glucoseDisplayUnit === 'mg_per_dl' ? 'numeric' : 'decimal';
  const selectedContextLabel = formState.context
    ? resolveGlucoseContextLabel(localization, formState.context)
    : null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canEnterValue || !glucoseDisplayUnit) {
      return;
    }

    const parsedValue = parseGlucoseInput(formState.value, glucoseDisplayUnit);

    if (parsedValue === null) {
      setValueError(labels.valueOutOfRangeError);
      return;
    }

    onSubmit({
      context: formState.context,
      time: formState.time,
      valueMmol: parsedValue,
    });
  };

  const handleCancel = () => {
    setFormState(createInitialState());
    setValueError(null);
    onCancel();
  };

  const handleContextSelect = (context: GlucoseMeasurementContext) => {
    setFormState((current) => ({
      ...current,
      context,
    }));
    setContextSheetOpen(false);
  };

  const handleClearContext = () => {
    setFormState((current) => ({
      ...current,
      context: undefined,
    }));
  };

  const handleRetrySettings = async () => {
    setIsRetrying(true);

    try {
      await refresh();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <QuickAddFormLayout onSubmit={handleSubmit}>
      <QuickAddFormLayout.Body>
        {isLoading ? (
          <p className="text-sm text-slate-600" role="status">
            {labels.loading}
          </p>
        ) : null}

        {isSettingsError ? (
          <section
            aria-labelledby="quick-add-glucose-settings-error-title"
            className="space-y-3"
          >
            <div className="space-y-1">
              <h3
                className="text-sm font-semibold text-slate-950"
                id="quick-add-glucose-settings-error-title"
              >
                {labels.settingsErrorTitle}
              </h3>
              <p className="text-sm text-slate-600">
                {labels.settingsErrorDescription}
              </p>
            </div>
            <button
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
              disabled={isRetrying}
              onClick={() => void handleRetrySettings()}
              type="button"
            >
              {labels.settingsErrorRetry}
            </button>
          </section>
        ) : null}

        {loadState === 'ready' && isUnconfigured ? (
          <section
            aria-labelledby="quick-add-glucose-unconfigured-title"
            className="space-y-3"
          >
            <div className="space-y-1">
              <h3
                className="text-sm font-semibold text-slate-950"
                id="quick-add-glucose-unconfigured-title"
              >
                {labels.settingsUnconfiguredTitle}
              </h3>
              <p className="text-sm text-slate-600">
                {labels.settingsUnconfiguredDescription}
              </p>
            </div>
            <a
              className="inline-flex min-h-11 items-center rounded-xl border border-sky-500 bg-sky-50 px-4 text-sm font-semibold text-sky-900 transition hover:bg-sky-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
              href="/account/diabetes"
            >
              {labels.settingsUnconfiguredAction}
            </a>
          </section>
        ) : null}

        <div>
          <label className={formLabel} htmlFor="quick-add-glucose-value">
            {labels.valueLabel}
          </label>
          <div className="relative mt-2">
            <input
              aria-describedby={
                valueError ? 'quick-add-glucose-value-error' : undefined
              }
              aria-disabled={!canEnterValue}
              aria-invalid={valueError ? true : undefined}
              autoComplete="off"
              className={`${formField} pr-24 ${
                hasValue ? 'font-semibold text-slate-950' : 'text-slate-900'
              } ${!canEnterValue ? 'cursor-not-allowed opacity-60' : ''}`}
              disabled={!canEnterValue}
              enterKeyHint="done"
              id="quick-add-glucose-value"
              inputMode={canEnterValue ? inputMode : undefined}
              name="value"
              onChange={(event) => {
                setValueError(null);
                setFormState((current) => ({
                  ...current,
                  value: event.target.value,
                }));
              }}
              placeholder={
                glucoseDisplayUnit === 'mg_per_dl'
                  ? '120'
                  : glucoseDisplayUnit === 'mmol_per_l'
                    ? '6.4'
                    : ''
              }
              ref={initialFocusRef}
              required={canEnterValue}
              type="text"
              value={formState.value}
            />
            {unitSuffix ? (
              <span
                className={`pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm font-medium ${
                  hasValue ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {unitSuffix}
              </span>
            ) : null}
          </div>
          {valueError ? (
            <p
              className="mt-2 text-sm text-rose-600"
              id="quick-add-glucose-value-error"
              role="alert"
            >
              {valueError}
            </p>
          ) : null}
        </div>

        <QuickAddTimeField
          id="quick-add-glucose-time"
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

        {formState.context ? (
          <div>
            <span className={formLabel} id="quick-add-glucose-context-label">
              {labels.contextLabel}
            </span>
            <div className="mt-2 flex gap-2">
              <button
                aria-haspopup="dialog"
                aria-labelledby="quick-add-glucose-context-label quick-add-glucose-context-value"
                className={`${formField} flex min-h-11 flex-1 items-center justify-between text-left font-medium text-slate-950`}
                onClick={() => setContextSheetOpen(true)}
                type="button"
              >
                <span id="quick-add-glucose-context-value">
                  {selectedContextLabel}
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className="text-slate-400"
                  size={18}
                />
              </button>
              <button
                aria-label={labels.clearContext}
                className="min-h-11 shrink-0 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                onClick={handleClearContext}
                type="button"
              >
                {labels.clearContext}
              </button>
            </div>
          </div>
        ) : (
          <button
            aria-label={labels.addContext}
            className="min-h-11 self-start rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            onClick={() => setContextSheetOpen(true)}
            type="button"
          >
            {labels.addContext}
          </button>
        )}
      </QuickAddFormLayout.Body>

      <QuickAddFormLayout.Footer>
        <QuickAddFormActions
          inline
          onCancel={handleCancel}
          submitDisabled={!canEnterValue}
          submitLabel={labels.save}
        />
      </QuickAddFormLayout.Footer>

      {contextSheetOpen ? (
        <QuickAddOptionSheet
          onClose={() => setContextSheetOpen(false)}
          onSelect={handleContextSelect}
          options={contextOptions.map((option) => ({
            label: option.label,
            value: option.id,
          }))}
          selectedValue={formState.context}
          title={labels.contextSheetTitle}
        />
      ) : null}
    </QuickAddFormLayout>
  );
}
