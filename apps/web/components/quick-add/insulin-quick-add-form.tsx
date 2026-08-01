'use client';

import type { InsulinQuickAddEntry } from '@diabetes-universe/types';
import {
  QuickAddFormActions,
  QuickAddFormLayout,
  QuickAddOptionSheet,
  QuickAddTimeField,
} from '@diabetes-universe/ui';
import { ChevronDown } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { insulinContextOptions } from '../../lib/quick-add/insulin-context-options';
import { insulinPreparationOptionGroups } from '../../lib/quick-add/insulin-preparation-options';
import { getCurrentTimeString } from '../../lib/quick-add/format-glucose';
import { parseInsulinDoseInput } from '../../lib/quick-add/format-insulin';
import { formField, formLabel } from '../timeline/ui-styles';

interface InsulinQuickAddFormProps {
  readonly onCancel: () => void;
  readonly onSubmit: (entry: InsulinQuickAddEntry) => void;
}

interface InsulinFormState {
  readonly preparation: string;
  readonly dose: string;
  readonly time: string;
  readonly context: string;
}

function createInitialState(): InsulinFormState {
  return {
    context: '',
    dose: '',
    preparation: '',
    time: getCurrentTimeString(),
  };
}

export function InsulinQuickAddForm({
  onCancel,
  onSubmit,
}: InsulinQuickAddFormProps) {
  const [formState, setFormState] =
    useState<InsulinFormState>(createInitialState);
  const [doseError, setDoseError] = useState<string | null>(null);
  const [preparationSheetOpen, setPreparationSheetOpen] = useState(false);
  const [contextSheetOpen, setContextSheetOpen] = useState(false);
  const parsedDose = parseInsulinDoseInput(formState.dose);
  const hasDose = formState.dose.trim().length > 0;
  const canSubmit =
    formState.preparation.length > 0 &&
    parsedDose !== null &&
    formState.time.length > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (parsedDose === null) {
      setDoseError('Введите дозу больше 0 и не более 100 ЕД');
      return;
    }

    if (!formState.preparation || !formState.time) {
      return;
    }

    onSubmit({
      context: formState.context || undefined,
      doseUnits: parsedDose,
      preparation: formState.preparation,
      time: formState.time,
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
          <span className={formLabel} id="quick-add-insulin-preparation-label">
            Препарат
          </span>
          <button
            aria-haspopup="dialog"
            aria-labelledby="quick-add-insulin-preparation-label quick-add-insulin-preparation-value"
            className={`${formField} mt-2 flex items-center justify-between text-left font-medium ${
              formState.preparation ? 'text-slate-950' : 'text-slate-400'
            }`}
            onClick={() => setPreparationSheetOpen(true)}
            type="button"
          >
            <span id="quick-add-insulin-preparation-value">
              {formState.preparation || 'Выберите инсулин'}
            </span>
            <ChevronDown
              aria-hidden="true"
              className="text-slate-400"
              size={18}
            />
          </button>
        </div>

        <div>
          <label className={formLabel} htmlFor="quick-add-insulin-dose">
            Доза
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
              placeholder="4"
              required
              type="text"
              value={formState.dose}
            />
            <span
              className={`pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm font-medium ${
                hasDose ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              ЕД
            </span>
          </div>
          {doseError ? (
            <p
              className="mt-2 text-sm text-rose-600"
              id="quick-add-insulin-dose-error"
            >
              {doseError}
            </p>
          ) : null}
        </div>

        <QuickAddTimeField
          id="quick-add-insulin-time"
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

        <div>
          <span className={formLabel} id="quick-add-insulin-context-label">
            Контекст
          </span>
          <button
            aria-haspopup="dialog"
            aria-labelledby="quick-add-insulin-context-label quick-add-insulin-context-value"
            className={`${formField} mt-2 flex items-center justify-between text-left font-medium ${
              formState.context ? 'text-slate-950' : 'text-slate-400'
            }`}
            onClick={() => setContextSheetOpen(true)}
            type="button"
          >
            <span id="quick-add-insulin-context-value">
              {formState.context || 'Выберите контекст'}
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
          inline
          onCancel={handleCancel}
          submitDisabled={!canSubmit}
        />
      </QuickAddFormLayout.Footer>

      {preparationSheetOpen ? (
        <QuickAddOptionSheet
          groups={insulinPreparationOptionGroups}
          onClose={() => setPreparationSheetOpen(false)}
          onSelect={(preparation) => {
            setFormState((current) => ({
              ...current,
              preparation,
            }));
            setPreparationSheetOpen(false);
          }}
          selectedValue={formState.preparation || undefined}
          title="Препарат"
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
          options={insulinContextOptions}
          selectedValue={formState.context || undefined}
          title="Контекст"
        />
      ) : null}
    </QuickAddFormLayout>
  );
}
