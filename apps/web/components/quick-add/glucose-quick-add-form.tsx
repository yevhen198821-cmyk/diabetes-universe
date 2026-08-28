'use client';

import type { GlucoseQuickAddEntry } from '@diabetes-universe/types';
import type { GlucoseDisplayUnit } from '@diabetes-universe/medical-domain';
import {
  QuickAddFormActions,
  QuickAddFormLayout,
  QuickAddOptionSheet,
  QuickAddTimeField,
} from '@diabetes-universe/ui';
import { ChevronDown } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';

import { useDiabetesSettings } from '../../lib/medical/react';
import { glucoseContextOptions } from '../../lib/quick-add/glucose-context-options';
import {
  getCurrentTimeString,
  parseGlucoseInput,
} from '../../lib/quick-add/format-glucose';
import { useLocalization } from '../../lib/platform/react/use-localization';
import { formField, formLabel } from '../timeline/ui-styles';
import { resolveGlucoseQuickAddLabels } from './glucose-quick-add-labels';

interface GlucoseQuickAddFormProps {
  readonly onCancel: () => void;
  readonly onSubmit: (entry: GlucoseQuickAddEntry) => void;
}

interface GlucoseFormState {
  readonly value: string;
  readonly time: string;
  readonly context: string;
}

function createInitialState(): GlucoseFormState {
  return {
    context: glucoseContextOptions[0],
    time: getCurrentTimeString(),
    value: '',
  };
}

export function GlucoseQuickAddForm({
  onCancel,
  onSubmit,
}: GlucoseQuickAddFormProps) {
  const localization = useLocalization();
  const labels = useMemo(
    () => resolveGlucoseQuickAddLabels(localization),
    [localization],
  );
  const { glucoseDisplayUnit, patchGlucoseDisplayUnit, settings } =
    useDiabetesSettings();

  const [formState, setFormState] =
    useState<GlucoseFormState>(createInitialState);
  const [valueError, setValueError] = useState<string | null>(null);
  const [unitError, setUnitError] = useState<string | null>(null);
  const [contextSheetOpen, setContextSheetOpen] = useState(false);
  const [pendingDisplayUnit, setPendingDisplayUnit] =
    useState<GlucoseDisplayUnit | null>(null);
  const [unitSaving, setUnitSaving] = useState(false);

  const activeDisplayUnit = glucoseDisplayUnit ?? pendingDisplayUnit;
  const requiresUnitSelection = glucoseDisplayUnit === null;
  const canEnterValue = activeDisplayUnit !== null;
  const hasValue = formState.value.trim().length > 0;
  const unitSuffix =
    activeDisplayUnit === 'mg_per_dl'
      ? labels.unitMg
      : activeDisplayUnit === 'mmol_per_l'
        ? labels.unitMmol
        : '';
  const inputMode = activeDisplayUnit === 'mg_per_dl' ? 'numeric' : 'decimal';

  const handleUnitSelect = async (unit: GlucoseDisplayUnit) => {
    if (unitSaving) {
      return;
    }

    setUnitError(null);

    if (settings) {
      setUnitSaving(true);

      try {
        await patchGlucoseDisplayUnit(unit);
        setPendingDisplayUnit(null);
      } catch {
        setUnitError(labels.unitRequiredError);
      } finally {
        setUnitSaving(false);
      }

      return;
    }

    setPendingDisplayUnit(unit);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!activeDisplayUnit) {
      setUnitError(labels.unitRequiredError);
      return;
    }

    const parsedValue = parseGlucoseInput(formState.value, activeDisplayUnit);

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
    setUnitError(null);
    setPendingDisplayUnit(null);
    onCancel();
  };

  const handleContextSelect = (option: string) => {
    setFormState((current) => ({
      ...current,
      context: option,
    }));
    setContextSheetOpen(false);
  };

  return (
    <QuickAddFormLayout onSubmit={handleSubmit}>
      <QuickAddFormLayout.Body>
        {requiresUnitSelection ? (
          <section
            aria-labelledby="quick-add-glucose-unit-gate-title"
            className="space-y-3"
          >
            <div className="space-y-1">
              <h3
                className="text-sm font-semibold text-slate-950"
                id="quick-add-glucose-unit-gate-title"
              >
                {labels.unitGateTitle}
              </h3>
              <p className="text-sm text-slate-600">
                {labels.unitGateDescription}
              </p>
            </div>

            <div
              aria-label={labels.unitGateTitle}
              className="grid grid-cols-2 gap-2"
              role="group"
            >
              {(
                [
                  { id: 'mmol_per_l', label: labels.unitMmol },
                  { id: 'mg_per_dl', label: labels.unitMg },
                ] as const
              ).map((option) => {
                const isActive = activeDisplayUnit === option.id;

                return (
                  <button
                    aria-pressed={isActive}
                    className={`min-h-11 rounded-xl border px-2 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 sm:text-sm ${
                      isActive
                        ? 'border-sky-500 bg-sky-50 text-sky-900'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                    disabled={unitSaving}
                    key={option.id}
                    onClick={() => void handleUnitSelect(option.id)}
                    type="button"
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            {unitSaving ? (
              <p className="text-sm text-slate-600" role="status">
                {labels.unitSaving}
              </p>
            ) : null}

            {unitError ? (
              <p className="text-sm text-rose-600" role="alert">
                {unitError}
              </p>
            ) : null}
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
              inputMode={inputMode}
              name="value"
              onChange={(event) => {
                setValueError(null);
                setFormState((current) => ({
                  ...current,
                  value: event.target.value,
                }));
              }}
              placeholder={
                activeDisplayUnit === 'mg_per_dl'
                  ? '120'
                  : activeDisplayUnit === 'mmol_per_l'
                    ? '6.4'
                    : ''
              }
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

        <div>
          <span className={formLabel} id="quick-add-glucose-context-label">
            {labels.contextLabel}
          </span>
          <button
            aria-haspopup="dialog"
            aria-labelledby="quick-add-glucose-context-label quick-add-glucose-context-value"
            className={`${formField} mt-2 flex items-center justify-between text-left font-medium text-slate-950`}
            onClick={() => setContextSheetOpen(true)}
            type="button"
          >
            <span id="quick-add-glucose-context-value">
              {formState.context}
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
        <QuickAddFormActions inline onCancel={handleCancel} />
      </QuickAddFormLayout.Footer>

      {contextSheetOpen ? (
        <QuickAddOptionSheet
          onClose={() => setContextSheetOpen(false)}
          onSelect={handleContextSelect}
          options={glucoseContextOptions}
          selectedValue={formState.context}
          title={labels.contextSheetTitle}
        />
      ) : null}
    </QuickAddFormLayout>
  );
}
