'use client';

import type { GlucoseQuickAddEntry } from '@diabetes-universe/types';
import {
  QuickAddFormActions,
  QuickAddOptionSheet,
} from '@diabetes-universe/ui';
import { ChevronDown } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { formField, formLabel } from '../timeline/ui-styles';
import { glucoseContextOptions } from '../../lib/quick-add/glucose-context-options';
import {
  getCurrentTimeString,
  parseGlucoseInput,
} from '../../lib/quick-add/format-glucose';
import { openNativeTimePicker } from '../../lib/quick-add/open-native-time-picker';

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
  const [formState, setFormState] =
    useState<GlucoseFormState>(createInitialState);
  const [valueError, setValueError] = useState<string | null>(null);
  const [contextSheetOpen, setContextSheetOpen] = useState(false);
  const hasValue = formState.value.trim().length > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedValue = parseGlucoseInput(formState.value);

    if (parsedValue === null) {
      setValueError('Введите значение от 0,1 до 40 ммоль/л');
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

  const handleContextSelect = (option: string) => {
    setFormState((current) => ({
      ...current,
      context: option,
    }));
    setContextSheetOpen(false);
  };

  return (
    <form
      className="flex min-h-0 flex-col overflow-hidden"
      onSubmit={handleSubmit}
    >
      <div className="min-h-0 space-y-5 overflow-x-hidden overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
        <div>
          <label className={formLabel} htmlFor="quick-add-glucose-value">
            Уровень глюкозы
          </label>
          <div className="relative mt-2">
            <input
              aria-describedby={
                valueError ? 'quick-add-glucose-value-error' : undefined
              }
              aria-invalid={valueError ? true : undefined}
              autoComplete="off"
              className={`${formField} pr-24 ${
                hasValue ? 'font-semibold text-slate-950' : 'text-slate-900'
              }`}
              enterKeyHint="done"
              id="quick-add-glucose-value"
              inputMode="decimal"
              name="value"
              onChange={(event) => {
                setValueError(null);
                setFormState((current) => ({
                  ...current,
                  value: event.target.value,
                }));
              }}
              placeholder="6,4"
              required
              type="text"
              value={formState.value}
            />
            <span
              className={`pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm font-medium ${
                hasValue ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              ммоль/л
            </span>
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

        <div>
          <label className={formLabel} htmlFor="quick-add-glucose-time">
            Время
          </label>
          <input
            className={`${formField} mt-2 appearance-auto text-slate-950`}
            id="quick-add-glucose-time"
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
          <span className={formLabel} id="quick-add-glucose-context-label">
            Контекст измерения
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
      </div>

      <QuickAddFormActions onCancel={handleCancel} />

      {contextSheetOpen ? (
        <QuickAddOptionSheet
          onClose={() => setContextSheetOpen(false)}
          onSelect={handleContextSelect}
          options={glucoseContextOptions}
          selectedValue={formState.context}
          title="Контекст измерения"
        />
      ) : null}
    </form>
  );
}
